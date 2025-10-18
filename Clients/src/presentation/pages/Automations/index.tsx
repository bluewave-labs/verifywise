import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Container, Box, useTheme } from '@mui/material';
import AutomationList from './components/AutomationList';
import AutomationBuilder from './components/AutomationBuilder';
import ConfigurationPanel from './components/ConfigurationPanel';
import { Automation, Trigger, Action, TriggerTemplate, ActionTemplate } from '../../../domain/types/Automation';
import { mockTriggerTemplates, mockActionTemplates } from './data/mockData';
import { generateId } from '../../../application/utils/generateId';
import CustomAxios from '../../../infrastructure/api/customAxios';

const AutomationsPage: React.FC = () => {
  const theme = useTheme();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'trigger' | 'action' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
  const fetchAutomations = useCallback(async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error('Error fetching automations:', error);
      // If there's an error, start with empty state
      setAutomations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load automations on mount
  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete automation';
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

    if (!isExistingAutomation) {
      // For new automations that haven't been saved yet, just update local state
      setAutomations(prev => prev.map(auto =>
        auto.id === automationId
          ? {
              ...auto,
              isActive: !auto.isActive,
              status: !auto.isActive ? 'active' : 'inactive',
              updatedAt: new Date()
            }
          : auto
      ));
      return;
    }

    const newIsActive = !automation.isActive;

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

      const errorMessage = error.response?.data?.message || error.message || 'Failed to toggle automation';
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

    setAutomations(prev => prev.map(automation =>
      automation.id === selectedAutomationId
        ? { ...automation, trigger: newTrigger, updatedAt: new Date() }
        : automation
    ));

    // Auto-select the new trigger for configuration
    setSelectedItemId(newTrigger.id);
    setSelectedItemType('trigger');
  };

  const handleAddAction = (actionTemplate: ActionTemplate) => {
    if (!selectedAutomationId) return;

    const newAction: Action = {
      id: generateId(),
      type: actionTemplate.type,
      name: actionTemplate.name,
      description: actionTemplate.description,
      configuration: { ...actionTemplate.defaultConfiguration },
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
          name: selectedAutomation.name,
          actions: processedActions,
        };

        response = await CustomAxios.put(`/automations/${selectedAutomation.id}`, updateData);

        if (response.status === 200) {
          // Show success notification
          console.log('Automation updated successfully!', response.data);

          // Refresh the automations list
          await fetchAutomations();
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

          // Refresh the automations list to get the saved automation with its backend ID
          await fetchAutomations();

          // Clear selection since we'll need to re-select using the new ID
          setSelectedAutomationId(null);
          setSelectedItemId(null);
          setSelectedItemType(null);
        }
      }
    } catch (error: any) {
      console.error('Error saving automation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save automation';
      // TODO: Show error notification to user
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we should show configuration panel
  const showConfigurationPanel = automations.length > 0 && (selectedItem || selectedAutomation);

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: '32px' }}>
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
          <Grid item xs={12} md={showConfigurationPanel ? 3 : 4} sx={{ borderRight: `1px solid ${theme.palette.border.light}` }}>
            <AutomationList
              automations={filteredAutomations}
              selectedAutomationId={selectedAutomationId}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onSelectAutomation={handleSelectAutomation}
              onCreateAutomation={handleCreateAutomation}
              onDeleteAutomation={handleDeleteAutomation}
              onDuplicateAutomation={handleDuplicateAutomation}
              onToggleAutomation={handleToggleAutomation}
              onRenameAutomation={handleRenameAutomation}
              onSearchChange={setSearchQuery}
            />
          </Grid>

          {/* Center Panel - Automation Builder */}
          <Grid item xs={12} md={showConfigurationPanel ? 6 : 8} sx={showConfigurationPanel ? { borderRight: `1px solid ${theme.palette.border.light}` } : {}}>
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
          </Grid>

          {/* Right Panel - Configuration (conditional) */}
          {showConfigurationPanel && (
            <Grid item xs={12} md={3}>
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
  );
};

export default AutomationsPage;