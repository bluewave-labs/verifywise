import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Grid, Container, Box, Stack, useTheme } from '@mui/material';
import { Settings } from 'lucide-react';
import AutomationList from './components/AutomationList';
import AutomationBuilder from './components/AutomationBuilder';
import ConfigurationPanel from './components/ConfigurationPanel';
import { Automation, Trigger, Action, TriggerTemplate, ActionTemplate } from '../../../domain/types/Automation';
import { mockTriggerTemplates, mockActionTemplates } from './data/mockData';
import { generateId } from '../../../application/utils/generateId';
import CustomAxios from '../../../infrastructure/api/customAxios';
import Alert from '../../components/Alert';
import PageBreadcrumbs from '../../components/Breadcrumbs/PageBreadcrumbs';

const AutomationsPage: React.FC = () => {
  const theme = useTheme();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'trigger' | 'action' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  // Get selected automation
  const selectedAutomation = selectedAutomationId
    ? automations.find(a => a.id === selectedAutomationId)
    : null;

  // Get selected item (trigger or action) for configuration panel
  const selectedItem = React.useMemo(() => {
    if (!selectedAutomation || !selectedItemId || !selectedItemType) return null;

    if (selectedItemType === 'trigger') {
      return selectedAutomation.trigger?.id === selectedItemId ? selectedAutomation.trigger : null;
    } else {
      return selectedAutomation.actions.find(a => a.id === selectedItemId) || null;
    }
  }, [selectedAutomation, selectedItemId, selectedItemType]);

  // Filter automations based on search
  const filteredAutomations = automations.filter(automation =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    automation.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch existing automations
  const fetchAutomations = useCallback(async (preserveSelection?: string, showLoading: boolean = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch all automations
      const response = await CustomAxios.get('/automations');
      const backendAutomations = response.data.data;

      // Fetch triggers and actions to map IDs to types
      const triggersResponse = await CustomAxios.get('/automations/triggers');
      const triggers = triggersResponse.data.data;

      // Map backend automations to frontend format
      const mappedAutomations: Automation[] = await Promise.all(
        backendAutomations.map(async (backendAuto: any) => {
          // Find the trigger
          const trigger = triggers.find((t: any) => t.id === backendAuto.trigger_id);

          // Fetch actions for this trigger to get action details
          let actionsData: any[] = [];
          if (trigger) {
            const actionsResponse = await CustomAxios.get(`/automations/actions/by-triggerId/${trigger.id}`);
            actionsData = actionsResponse.data.data;
          }

          // Fetch detailed automation data including actions
          const detailResponse = await CustomAxios.get(`/automations/${backendAuto.id}`);
          const detailData = detailResponse.data.data;

          // Map trigger to frontend format
          const frontendTrigger: Trigger | null = trigger ? {
            id: String(trigger.id),
            type: trigger.key,
            name: trigger.label,
            description: trigger.description || '',
            configuration: {},
          } : null;

          // Map actions to frontend format
          const frontendActions: Action[] = (detailData.actions || []).map((action: any) => {
            const actionType = actionsData.find((a: any) => a.id === action.action_type_id);

            // Parse params if string
            let parsedParams = typeof action.params === 'string' ? JSON.parse(action.params) : action.params || {};

            // Convert 'to' array back to comma-separated string for textarea display
            if (parsedParams.to && Array.isArray(parsedParams.to)) {
              parsedParams = {
                ...parsedParams,
                to: parsedParams.to.join(', ')
              };
            }

            return {
              id: String(action.id),
              type: actionType?.key || 'send_email',
              name: actionType?.label || 'Send Email',
              description: actionType?.description || '',
              configuration: parsedParams,
              order: action.order || 0,
            };
          });

          return {
            id: String(backendAuto.id),
            name: backendAuto.name,
            description: backendAuto.description || 'No description',
            isActive: backendAuto.is_active ?? false,
            trigger: frontendTrigger,
            actions: frontendActions,
            status: backendAuto.is_active ? 'active' : 'inactive',
            createdAt: new Date(backendAuto.created_at),
            updatedAt: new Date(backendAuto.updated_at || backendAuto.created_at),
          };
        })
      );

      setAutomations(mappedAutomations);

      // If we have a selection to preserve, make sure it's still selected
      if (preserveSelection) {
        setSelectedAutomationId(preserveSelection);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
      // If there's an error, start with empty state
      setAutomations([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Load automations on mount
  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Handle toast auto-hide
  useEffect(() => {
    if (toast && toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close toast handler
  const handleCloseToast = () => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
  };

  const handleCreateAutomation = () => {
    const newAutomation: Automation = {
      id: generateId(),
      name: `New Automation ${automations.length + 1}`,
      description: 'No description',
      isActive: false,
      trigger: null,
      actions: [],
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAutomations(prev => [newAutomation, ...prev]);
    setSelectedAutomationId(newAutomation.id);
    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const handleSelectAutomation = (automationId: string) => {
    setSelectedAutomationId(automationId);
    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      // Call the backend API to delete the automation
      await CustomAxios.delete(`/automations/${automationId}`);

      // Remove from local state
      setAutomations(prev => prev.filter(a => a.id !== automationId));

      // Clear selection if the deleted automation was selected
      if (selectedAutomationId === automationId) {
        setSelectedAutomationId(null);
        setSelectedItemId(null);
        setSelectedItemType(null);
      }

      console.log('Automation deleted successfully');
    } catch (error: any) {
      console.error('Error deleting automation:', error);
    }
  };

  const handleDiscardAutomation = (automationId: string) => {
    // Simply remove from local state without backend call
    setAutomations(prev => prev.filter(a => a.id !== automationId));

    // Clear selection if the discarded automation was selected
    if (selectedAutomationId === automationId) {
      setSelectedAutomationId(null);
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  };

  const handleDuplicateAutomation = (automationId: string) => {
    const originalAutomation = automations.find(a => a.id === automationId);
    if (!originalAutomation) return;

    const duplicatedAutomation: Automation = {
      ...originalAutomation,
      id: generateId(),
      name: `${originalAutomation.name} (Copy)`,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAutomations(prev => [duplicatedAutomation, ...prev]);
  };

  const handleToggleAutomation = async (automationId: string) => {
    // Find the automation to get its current state
    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;

    // Check if this is an existing automation (has numeric ID from backend)
    const isExistingAutomation = !isNaN(Number(automationId));

    const newIsActive = !automation.isActive;

    if (!isExistingAutomation) {
      // For new automations that haven't been saved yet, just update local state
      setAutomations(prev => prev.map(auto =>
        auto.id === automationId
          ? {
              ...auto,
              isActive: newIsActive,
              status: newIsActive ? 'active' : 'inactive',
              updatedAt: new Date()
            }
          : auto
      ));

      // Show toast for new automation
      setToast({
        variant: "info",
        body: newIsActive ? "This automation is enabled" : "This automation is disabled",
        visible: true
      });
      return;
    }

    // Optimistically update the UI
    setAutomations(prev => prev.map(auto =>
      auto.id === automationId
        ? {
            ...auto,
            isActive: newIsActive,
            status: newIsActive ? 'active' : 'inactive',
            updatedAt: new Date()
          }
        : auto
    ));

    try {
      // Make PUT request to update is_active on the backend
      await CustomAxios.put(`/automations/${automationId}`, {
        is_active: newIsActive
      });

      console.log('Automation toggle status updated successfully');

      // Show success toast
      setToast({
        variant: "success",
        body: newIsActive ? "This automation is enabled" : "This automation is disabled",
        visible: true
      });
    } catch (error: any) {
      console.error('Error toggling automation:', error);

      // Revert the optimistic update on error
      setAutomations(prev => prev.map(auto =>
        auto.id === automationId
          ? {
              ...auto,
              isActive: !newIsActive,
              status: !newIsActive ? 'active' : 'inactive',
              updatedAt: new Date()
            }
          : auto
      ));

      // Show error toast
      setToast({
        variant: "error",
        body: "Failed to toggle automation status",
        visible: true
      });
    }
  };

  const handleRenameAutomation = (automationId: string, newName: string) => {
    setAutomations(prev => prev.map(automation =>
      automation.id === automationId
        ? { ...automation, name: newName, updatedAt: new Date() }
        : automation
    ));
  };

  const handleUpdateAutomationDescription = (automationId: string, newDescription: string) => {
    setAutomations(prev => prev.map(automation =>
      automation.id === automationId
        ? { ...automation, description: newDescription, updatedAt: new Date() }
        : automation
    ));
  };

  const handleAddTrigger = (triggerTemplate: TriggerTemplate) => {
    if (!selectedAutomationId) return;

    const newTrigger: Trigger = {
      id: generateId(),
      type: triggerTemplate.type,
      name: triggerTemplate.name,
      description: triggerTemplate.description,
      configuration: { ...triggerTemplate.defaultConfiguration },
    };

    // Generate automation name based on trigger type
    const getAutomationNameFromTrigger = (triggerType: string): string => {
      switch (triggerType) {
        case 'vendor_added':
          return 'Vendor add automation';
        case 'model_added':
          return 'Model add automation';
        case 'vendor_review_date_approaching':
          return 'Vendor review automation';
        default:
          return 'New automation';
      }
    };

    setAutomations(prev => prev.map(automation => {
      if (automation.id !== selectedAutomationId) return automation;

      // Check if the current name is a default name (starts with "New Automation")
      // If so, update it to a trigger-specific name
      const isDefaultName = automation.name.startsWith('New Automation');
      const newName = isDefaultName ? getAutomationNameFromTrigger(triggerTemplate.type) : automation.name;

      return {
        ...automation,
        trigger: newTrigger,
        name: newName,
        updatedAt: new Date()
      };
    }));

    // Auto-select the new trigger for configuration
    setSelectedItemId(newTrigger.id);
    setSelectedItemType('trigger');
  };

  const handleAddAction = (actionTemplate: ActionTemplate) => {
    if (!selectedAutomationId) return;

    // Create a copy of the default configuration
    const configuration = { ...actionTemplate.defaultConfiguration };

    // Set dynamic default subject and body based on trigger type for email actions
    if (actionTemplate.type === 'send_email' && selectedAutomation?.trigger) {
      switch (selectedAutomation.trigger.type) {
        case 'vendor_added':
          configuration.subject = '{{vendor.name}} has been added as a new vendor';
          configuration.body = `A new vendor has been added to the system.

Vendor Details:
• Vendor Name: {{vendor.name}}
• Vendor ID: {{vendor.id}}
• Services/Products: {{vendor.provides}}
• Website: {{vendor.website}}
• Contact Person: {{vendor.contact}}

This notification was sent on {{date_and_time}}.`;
          break;
        case 'model_added':
          configuration.subject = '{{model.name}} ({{model.provider}}) has been added';
          configuration.body = `A new model has been added to the system.

Model Details:
• Model Name: {{model.name}}
• Provider: {{model.provider}}
• Version: {{model.version}}
• Status: {{model.status}}

This notification was sent on {{date_and_time}}.`;
          break;
        case 'vendor_review_date_approaching':
          configuration.subject = 'Review for {{vendor_name}} due on {{review_date}}';
          configuration.body = `This is a reminder that a vendor review is approaching.

Review Details:
• Vendor: {{vendor_name}}
• Vendor ID: {{vendor_id}}
• Scheduled Review Date: {{review_date}}
• Days Until Review: {{days_until_review}}
• Assigned Reviewer: {{reviewer}}

Please complete the review by the scheduled date.

This notification was sent on {{date_and_time}}.`;
          break;
        default:
          configuration.subject = 'Notification';
          configuration.body = 'This is an automated notification.';
      }
    }

    const newAction: Action = {
      id: generateId(),
      type: actionTemplate.type,
      name: actionTemplate.name,
      description: actionTemplate.description,
      configuration,
      order: selectedAutomation?.actions.length || 0,
    };

    setAutomations(prev => prev.map(automation =>
      automation.id === selectedAutomationId
        ? {
            ...automation,
            actions: [...automation.actions, newAction],
            updatedAt: new Date()
          }
        : automation
    ));

    // Auto-select the new action for configuration
    setSelectedItemId(newAction.id);
    setSelectedItemType('action');
  };

  const handleSelectItem = (itemId: string, itemType: 'trigger' | 'action') => {
    setSelectedItemId(itemId);
    setSelectedItemType(itemType);
  };

  const handleDeleteTrigger = () => {
    if (!selectedAutomationId) return;

    setAutomations(prev => prev.map(automation =>
      automation.id === selectedAutomationId
        ? { ...automation, trigger: null, updatedAt: new Date() }
        : automation
    ));

    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const handleDeleteAction = (actionId: string) => {
    if (!selectedAutomationId) return;

    setAutomations(prev => prev.map(automation =>
      automation.id === selectedAutomationId
        ? {
            ...automation,
            actions: automation.actions.filter(a => a.id !== actionId),
            updatedAt: new Date()
          }
        : automation
    ));

    if (selectedItemId === actionId) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  };

  const handleUpdateConfiguration = (configuration: Record<string, any>) => {
    if (!selectedAutomationId || !selectedItemId || !selectedItemType) return;

    setAutomations(prev => prev.map(automation => {
      if (automation.id !== selectedAutomationId) return automation;

      if (selectedItemType === 'trigger' && automation.trigger?.id === selectedItemId) {
        return {
          ...automation,
          trigger: { ...automation.trigger, configuration },
          updatedAt: new Date()
        };
      } else if (selectedItemType === 'action') {
        return {
          ...automation,
          actions: automation.actions.map(action =>
            action.id === selectedItemId
              ? { ...action, configuration }
              : action
          ),
          updatedAt: new Date()
        };
      }

      return automation;
    }));
  };

  const handleSaveAutomation = async () => {
    if (!selectedAutomation || !selectedAutomation.trigger || selectedAutomation.actions.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      // Check if this is an existing automation (has numeric ID from backend) or new (has generated string ID)
      const isExistingAutomation = !isNaN(Number(selectedAutomation.id));

      // First, get all triggers to find the trigger ID by type
      const triggersResponse = await CustomAxios.get('/automations/triggers');
      const triggers = triggersResponse.data.data;

      // Find the trigger ID that matches our trigger type
      const triggerData = triggers.find((t: any) => t.key === selectedAutomation.trigger!.type);

      if (!triggerData) {
        throw new Error(`Trigger type "${selectedAutomation.trigger.type}" not found in backend`);
      }

      // Get all actions to map action types to IDs
      const actionsResponse = await CustomAxios.get(`/automations/actions/by-triggerId/${triggerData.id}`);
      const availableActions = actionsResponse.data.data;

      // Prepare the actions data
      const processedActions = selectedAutomation.actions.map((action, index) => {
        // Find the action type ID
        const actionData = availableActions.find((a: any) => a.key === action.type);

        if (!actionData) {
          throw new Error(`Action type "${action.type}" not found for this trigger`);
        }

        // Process the configuration to ensure 'to' field is an array
        const processedParams = { ...action.configuration };

        // If 'to' field exists and is a string, split it into an array
        if (processedParams.to && typeof processedParams.to === 'string') {
          processedParams.to = processedParams.to
            .split(',')
            .map((email: string) => email.trim())
            .filter((email: string) => email.length > 0);
        }

        return {
          action_type_id: actionData.id,
          params: processedParams,
          order: index + 1,
        };
      });

      let response;

      if (isExistingAutomation) {
        // Update existing automation with PUT
        const updateData = {
          triggerId: triggerData.id,
          name: selectedAutomation.name,
          actions: processedActions,
        };

        response = await CustomAxios.put(`/automations/${selectedAutomation.id}`, updateData);

        if (response.status === 200) {
          // Show success notification
          console.log('Automation updated successfully!', response.data);

          // Refresh the automations list, preserving the current selection
          await fetchAutomations(selectedAutomationId ?? undefined, false);

          // Show success toast
          setToast({
            variant: "success",
            body: "Automation updated successfully!",
            visible: true
          });
        }
      } else {
        // Create new automation with POST
        const automationData = {
          triggerId: triggerData.id,
          name: selectedAutomation.name,
          actions: processedActions,
        };

        response = await CustomAxios.post('/automations', automationData);

        if (response.status === 201) {
          // Show success notification
          console.log('Automation created successfully!', response.data);

          // Get the newly created automation's ID from the response
          const newAutomationId = response.data.data?.id;

          // Refresh the automations list to get the saved automation with its backend ID
          // Preserve the selection to the newly created automation
          await fetchAutomations(String(newAutomationId), false);
          setSelectedItemId(null);
          setSelectedItemType(null);

          // Show success toast
          setToast({
            variant: "success",
            body: "Automation created successfully!",
            visible: true
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving automation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save automation';

      // Show error toast
      setToast({
        variant: "error",
        body: errorMessage,
        visible: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we should show configuration panel
  const showConfigurationPanel = automations.length > 0 && (selectedItem || selectedAutomation);

  return (
    <Stack className="vwhome" gap={"16px"}>
      {/* Breadcrumbs with integrated action buttons and divider */}
      <PageBreadcrumbs />

      <Container maxWidth={false} sx={{ height: 'calc(100vh - 180px)', px: 0 }}>
        <Box
          sx={{
            height: '100%',
            backgroundColor: theme.palette.background.main,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.border.light}`,
            display: 'flex',
          }}
        >
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {/* Left Sidebar - Automation List */}
            <Grid
              item
              xs={12}
              md={showConfigurationPanel ? 3 : 4}
              sx={{
                height: '100%',
                borderRight: `1px solid ${theme.palette.border.light}`,
                background: 'linear-gradient(135deg, rgba(200,200,200,0.1) 0%, rgba(255,255,255,0) 100%) !important',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AutomationList
                automations={filteredAutomations}
                selectedAutomationId={selectedAutomationId}
                searchQuery={searchQuery}
                isLoading={isLoading}
                onSelectAutomation={handleSelectAutomation}
                onCreateAutomation={handleCreateAutomation}
                onDeleteAutomation={handleDeleteAutomation}
                onDiscardAutomation={handleDiscardAutomation}
                onToggleAutomation={handleToggleAutomation}
                onSearchChange={setSearchQuery}
              />
            </Grid>

            {/* Center Panel - Automation Builder */}
            <Grid
              item
              xs={12}
              md={showConfigurationPanel ? 6 : 8}
              sx={{
                height: '100%',
                ...(showConfigurationPanel ? { borderRight: `1px solid ${theme.palette.border.light}` } : {}),
                background: 'linear-gradient(135deg, rgba(100,150,255,0.08) 0%, rgba(255,255,255,0) 100%), #F9FAF9 !important',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AutomationBuilder
                automation={selectedAutomation ?? null}
                triggerTemplates={mockTriggerTemplates}
                actionTemplates={mockActionTemplates}
                selectedItemId={selectedItemId}
                selectedItemType={selectedItemType}
                onAddTrigger={handleAddTrigger}
                onAddAction={handleAddAction}
                onSelectItem={handleSelectItem}
                onDeleteTrigger={handleDeleteTrigger}
                onDeleteAction={handleDeleteAction}
                onUpdateAutomationName={(newName) => selectedAutomation && handleRenameAutomation(selectedAutomation.id, newName)}
                onUpdateAutomationDescription={(newDescription) => selectedAutomation && handleUpdateAutomationDescription(selectedAutomation.id, newDescription)}
                onSave={handleSaveAutomation}
                isSaving={isSaving}
              />

              {/* Large gear icon decoration */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '-10%',
                  right: '-10%',
                  transform: 'rotate(-15deg)',
                  opacity: 0.025,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                <Settings size={350} strokeWidth={1} />
              </Box>
            </Grid>

            {/* Right Panel - Configuration (conditional) */}
            {showConfigurationPanel && (
              <Grid
                item
                xs={12}
                md={3}
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(200,200,200,0.08) 0%, rgba(255,255,255,0) 100%) !important',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ConfigurationPanel
                  selectedItem={selectedItem}
                  selectedItemType={selectedItemType}
                  trigger={selectedAutomation?.trigger ?? null}
                  triggerTemplates={mockTriggerTemplates}
                  actionTemplates={mockActionTemplates}
                  onConfigurationChange={handleUpdateConfiguration}
                  automationName={selectedAutomation?.name}
                  onAutomationNameChange={(newName) => selectedAutomation && handleRenameAutomation(selectedAutomation.id, newName)}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>

      {/* Toast Notification */}
      {toast && toast.visible && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={toast.variant}
            body={toast.body}
            isToast={true}
            onClick={handleCloseToast}
          />
        </Suspense>
      )}
    </Stack>
  );
};

export default AutomationsPage;