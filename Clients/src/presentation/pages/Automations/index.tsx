import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Grid, Box, Stack, useTheme } from '@mui/material';
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
import { useProjects } from '../../../application/hooks/useProjects';

const AutomationsPage: React.FC = () => {
  const theme = useTheme();
  const { data: projects = [] } = useProjects();
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

      // Fetch users to map emails back to user IDs
      const usersResponse = await CustomAxios.get('/users');
      const users = usersResponse.data.data;

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

          // Parse trigger params from the automation (check both backendAuto and detailData)
          const paramsSource = detailData.params || backendAuto.params;
          const triggerParams = paramsSource
            ? (typeof paramsSource === 'string' ? JSON.parse(paramsSource) : paramsSource)
            : {};

          // Map backend trigger key to frontend format
          const mapBackendTriggerToFrontend = (backendKey: string): { type: string; changeType?: string } => {
            // Check if this is an added/updated/deleted trigger
            const addedMatch = backendKey.match(/^(.+)_added$/);
            const updatedMatch = backendKey.match(/^(.+)_updated$/);
            const deletedMatch = backendKey.match(/^(.+)_deleted$/);

            if (addedMatch) {
              return {
                type: `${addedMatch[1]}_updated`,
                changeType: 'Added'
              };
            } else if (updatedMatch) {
              return {
                type: `${updatedMatch[1]}_updated`,
                changeType: 'Updated'
              };
            } else if (deletedMatch) {
              return {
                type: `${deletedMatch[1]}_updated`,
                changeType: 'Deleted'
              };
            }

            // Return as-is for other triggers (like vendor_review_date_approaching)
            return { type: backendKey };
          };

          const { type: frontendTriggerType, changeType } = mapBackendTriggerToFrontend(trigger.key);

          // Merge the changeType into trigger params if it exists
          const finalTriggerParams = changeType
            ? { ...triggerParams, changeType }
            : triggerParams;

          // Map trigger to frontend format
          const frontendTrigger: Trigger | null = trigger ? {
            id: String(trigger.id),
            type: frontendTriggerType as Trigger['type'],
            name: trigger.label,
            description: trigger.description || '',
            configuration: finalTriggerParams,
          } : null;

          // Map actions to frontend format
          const frontendActions: Action[] = (detailData.actions || []).map((action: any) => {
            const actionType = actionsData.find((a: any) => a.id === action.action_type_id);

            // Parse params if string
            let parsedParams = typeof action.params === 'string' ? JSON.parse(action.params) : action.params || {};

            // Convert 'to' array of emails back to user IDs for the multi-select component
            if (parsedParams.to && Array.isArray(parsedParams.to)) {
              // Map email addresses back to user IDs
              const userIds = parsedParams.to.map((email: string) => {
                const user = users.find((u: any) => u.email === email);
                return user ? user.id : null;
              }).filter((id: any) => id !== null);

              parsedParams = {
                ...parsedParams,
                to: userIds
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
        case 'vendor_updated':
          return 'Vendor change automation';
        case 'model_updated':
          return 'Model change automation';
        case 'project_updated':
          return 'Project change automation';
        case 'task_updated':
          return 'Task change automation';
        case 'risk_updated':
          return 'Risk change automation';
        case 'training_updated':
          return 'Training change automation';
        case 'policy_updated':
          return 'Policy change automation';
        case 'incident_updated':
          return 'Incident change automation';
        case 'vendor_review_date_approaching':
          return 'Vendor review automation';
        case 'scheduled_report':
          return 'Scheduled report automation';
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
      const changeType = selectedAutomation.trigger.configuration?.changeType || 'Added';
      const isUpdate = changeType === 'Updated';

      switch (selectedAutomation.trigger.type) {
        case 'vendor_updated':
          if (isUpdate) {
            configuration.subject = 'Vendor {{vendor.name}} has been updated';
            configuration.body = `A vendor has been updated in the system.

Vendor Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Vendor {{vendor.name}} has been deleted' : 'New vendor {{vendor.name}} has been added'}`;
            configuration.body = `A vendor has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Vendor Details:
• Vendor Name: {{vendor.name}}
• Vendor ID: {{vendor.id}}
• Services/Products: {{vendor.provides}}
• Website: {{vendor.website}}
• Contact Person: {{vendor.contact}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'model_updated':
          if (isUpdate) {
            configuration.subject = 'Model {{model.name}} ({{model.provider}}) has been updated';
            configuration.body = `A model has been updated in the system.

Model Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Model {{model.name}} has been deleted' : 'New model {{model.name}} has been added'}`;
            configuration.body = `A model has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Model Details:
• Model Name: {{model.name}}
• Provider: {{model.provider}}
• Version: {{model.version}}
• Status: {{model.status}}
• Capabilities: {{model.capabilities}}
• Security Assessment: {{model.security_assessment}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'project_updated':
          if (isUpdate) {
            configuration.subject = 'Project "{{project.title}}" has been updated';
            configuration.body = `A project has been updated in the system.

Project Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Project "{{project.title}}" has been deleted' : 'New project "{{project.title}}" has been created'}`;
            configuration.body = `A project has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Project Details:
• Project Title: {{project.title}}
• Goal: {{project.goal}}
• Owner: {{project.owner}}
• Start Date: {{project.start_date}}
• AI Risk Classification: {{project.ai_risk_classification}}
• Type of High-Risk Role: {{project.type_of_high_risk_role}}
• Status: {{project.status}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'task_updated':
          if (isUpdate) {
            configuration.subject = 'Task "{{task.title}}" has been updated';
            configuration.body = `Task "{{task.title}}" has been updated.

Task Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Task "{{task.title}}" has been deleted' : 'New task "{{task.title}}" has been created'}`;
            configuration.body = `A task has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Task Details:
• Task Title: {{task.title}}
• Task ID: {{task.id}}
• Description: {{task.description}}
• Creator: {{task.creator}}
• Assignees: {{task.assignees}}
• Due Date: {{task.due_date}}
• Priority: {{task.priority}}
• Status: {{task.status}}
• Categories: {{task.categories}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'risk_updated':
          if (isUpdate) {
            configuration.subject = 'Risk "{{risk.name}}" has been updated';
            configuration.body = `A risk has been updated in the system.

Risk Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Risk "{{risk.name}}" has been deleted' : 'New risk "{{risk.name}}" has been identified'}`;
            configuration.body = `A risk has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Risk Details:
• Risk Name: {{risk.name}}
• Description: {{risk.description}}
• Risk Owner: {{risk.owner}}
• AI Lifecycle Phase: {{risk.ai_lifecycle_phase}}
• Category: {{risk.category}}
• Likelihood: {{risk.likelihood}}
• Severity: {{risk.severity}}
• Risk Level: {{risk.risk_level}}
• Current Risk Level: {{risk.current_risk_level}}
• Mitigation Status: {{risk.mitigation_status}}
• Deadline: {{risk.deadline}}
• Approval Status: {{risk.approval_status}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'training_updated':
          if (isUpdate) {
            configuration.subject = 'Training "{{training.name}}" has been updated';
            configuration.body = `A training has been updated in the system.

Training Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Training "{{training.name}}" has been deleted' : 'New training "{{training.name}}" has been scheduled'}`;
            configuration.body = `A training has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Training Details:
• Training Name: {{training.name}}
• Description: {{training.description}}
• Duration: {{training.duration}}
• Provider: {{training.provider}}
• Department: {{training.department}}
• Status: {{training.status}}
• Number of People: {{training.number_of_people}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'policy_updated':
          if (isUpdate) {
            configuration.subject = 'Policy "{{policy.title}}" has been updated';
            configuration.body = `A policy has been updated in the system.

Policy Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Policy "{{policy.title}}" has been deleted' : 'New policy "{{policy.title}}" has been published'}`;
            configuration.body = `A policy has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Policy Details:
• Policy Title: {{policy.title}}
• Content: {{policy.content}}
• Status: {{policy.status}}
• Tags: {{policy.tags}}
• Next Review Date: {{policy.next_review_date}}
• Author: {{policy.author}}
• Assigned Reviewers: {{policy.reviewers}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'incident_updated':
          if (isUpdate) {
            configuration.subject = 'Incident has been updated';
            configuration.body = `An incident has been updated in the system.

Incident Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`;
          } else {
            configuration.subject = `${changeType === 'Deleted' ? 'Incident has been deleted' : 'New incident has been reported'}`;
            configuration.body = `An incident has been ${changeType === 'Deleted' ? 'deleted from' : 'reported in'} the system.

Incident Details:
• AI Project: {{incident.ai_project}}
• Type: {{incident.type}}
• Severity: {{incident.severity}}
• Status: {{incident.status}}
• Date Occurred: {{incident.occurred_date}}
• Date Detected: {{incident.date_detected}}
• Reporter: {{incident.reporter}}
• Categories of Harm: {{incident.categories_of_harm}}
• Affected Persons/Groups: {{incident.affected_persons_groups}}

Description:
{{incident.description}}

Relationship/Causality:
{{incident.relationship_causality}}

Immediate Mitigations:
{{incident.immediate_mitigations}}

Planned Corrective Actions:
{{incident.planned_corrective_actions}}

Model/System Version: {{incident.model_system_version}}

Approval Status: {{incident.approval_status}}
Approved By: {{incident.approved_by}}
Approval Date: {{incident.approval_date}}
Interim Report: {{incident.interim_report}}

This notification was sent on {{date_and_time}}.`;
          }
          break;
        case 'vendor_review_date_approaching':
          configuration.subject = 'Review for {{vendor.name}} due on {{review_date}}';
          configuration.body = `This is a reminder that a vendor review is approaching.

Review Details:
• Vendor Name: {{vendor.name}}
• Vendor ID: {{vendor.id}}
• Services/Products: {{vendor.provides}}
• Website: {{vendor.website}}
• Contact Person: {{vendor.contact}}
• Scheduled Review Date: {{review_date}}
• Days Until Review: {{days_until_review}}
• Last Review Date: {{last_review_date}}
• Assigned Reviewer: {{reviewer}}

Please complete the review by the scheduled date.

This notification was sent on {{date_and_time}}.`;
          break;
        case 'scheduled_report':
          // Get selected report types from trigger configuration
          const reportTypes = selectedAutomation?.trigger?.configuration?.reportType || [];
          const reportTypeArray = Array.isArray(reportTypes) ? reportTypes : [reportTypes];
          const isOrgLevel = selectedAutomation?.trigger?.configuration?.reportLevel === 'organization';

          // Build dynamic email subject
          if (reportTypeArray.length === 1) {
            configuration.subject = `Scheduled Report: ${reportTypeArray[0]}`;
          } else if (reportTypeArray.includes('All reports combined in one file')) {
            configuration.subject = 'Scheduled Report: All Reports';
          } else {
            configuration.subject = 'Scheduled Report: Multiple Reports';
          }

          // Build email body
          const bodyParts = [];

          // Header
          bodyParts.push(`Your scheduled report is ready and attached to this email.

📊 REPORT INFORMATION
• Report Type: {{report.type}}
• Generated: {{date_and_time}}
• Schedule: {{schedule.frequency}}`);

          // Project/Organization section
          if (isOrgLevel) {
            bodyParts.push(`
🏢 ORGANIZATION
• Organization: {{organization.name}}`);
          } else {
            bodyParts.push(`
🏢 PROJECT & ORGANIZATION
• Project: {{project.title}}
• Project Owner: {{project.owner}}
• Organization: {{organization.name}}
• Project Status: {{project.status}}`);
          }

          // Footer
          bodyParts.push(`
---

This is an automated report generated by VerifyWise. The complete report is attached as a Word document.`);

          configuration.body = bodyParts.join('\n');
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
        // Check if changeType has changed
        const oldChangeType = automation.trigger.configuration?.changeType;
        const newChangeType = configuration.changeType;
        const changeTypeChanged = oldChangeType !== newChangeType;

        // Update trigger configuration
        const updatedAutomation = {
          ...automation,
          trigger: { ...automation.trigger, configuration },
          updatedAt: new Date()
        };

        // If changeType changed, regenerate email action templates
        if (changeTypeChanged && updatedAutomation.trigger) {
          const isUpdate = newChangeType === 'Updated';
          const changeType = newChangeType || 'Added';

          // Helper function to generate email templates based on trigger type and changeType
          const generateEmailTemplate = (triggerType: string): { subject: string; body: string } | null => {
            switch (triggerType) {
              case 'vendor_updated':
                if (isUpdate) {
                  return {
                    subject: 'Vendor {{vendor.name}} has been updated',
                    body: `A vendor has been updated in the system.

Vendor Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Vendor {{vendor.name}} has been deleted' : 'New vendor {{vendor.name}} has been added'}`,
                    body: `A vendor has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Vendor Details:
• Vendor Name: {{vendor.name}}
• Vendor ID: {{vendor.id}}
• Services/Products: {{vendor.provides}}
• Website: {{vendor.website}}
• Contact Person: {{vendor.contact}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'model_updated':
                if (isUpdate) {
                  return {
                    subject: 'Model {{model.name}} ({{model.provider}}) has been updated',
                    body: `A model has been updated in the system.

Model Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Model {{model.name}} has been deleted' : 'New model {{model.name}} has been added'}`,
                    body: `A model has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Model Details:
• Model Name: {{model.name}}
• Provider: {{model.provider}}
• Version: {{model.version}}
• Status: {{model.status}}
• Capabilities: {{model.capabilities}}
• Security Assessment: {{model.security_assessment}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'project_updated':
                if (isUpdate) {
                  return {
                    subject: 'Project "{{project.title}}" has been updated',
                    body: `A project has been updated in the system.

Project Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Project "{{project.title}}" has been deleted' : 'New project "{{project.title}}" has been created'}`,
                    body: `A project has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Project Details:
• Project Title: {{project.title}}
• Goal: {{project.goal}}
• Owner: {{project.owner}}
• Start Date: {{project.start_date}}
• AI Risk Classification: {{project.ai_risk_classification}}
• Type of High-Risk Role: {{project.type_of_high_risk_role}}
• Status: {{project.status}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'task_updated':
                if (isUpdate) {
                  return {
                    subject: 'Task "{{task.title}}" has been updated',
                    body: `Task "{{task.title}}" has been updated.

Task Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Task "{{task.title}}" has been deleted' : 'New task "{{task.title}}" has been created'}`,
                    body: `A task has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Task Details:
• Task Title: {{task.title}}
• Task ID: {{task.id}}
• Description: {{task.description}}
• Creator: {{task.creator}}
• Assignees: {{task.assignees}}
• Due Date: {{task.due_date}}
• Priority: {{task.priority}}
• Status: {{task.status}}
• Categories: {{task.categories}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'risk_updated':
                if (isUpdate) {
                  return {
                    subject: 'Risk "{{risk.name}}" has been updated',
                    body: `A risk has been updated in the system.

Risk Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Risk "{{risk.name}}" has been deleted' : 'New risk "{{risk.name}}" has been identified'}`,
                    body: `A risk has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Risk Details:
• Risk Name: {{risk.name}}
• Description: {{risk.description}}
• Risk Owner: {{risk.owner}}
• AI Lifecycle Phase: {{risk.ai_lifecycle_phase}}
• Category: {{risk.category}}
• Likelihood: {{risk.likelihood}}
• Severity: {{risk.severity}}
• Risk Level: {{risk.risk_level}}
• Current Risk Level: {{risk.current_risk_level}}
• Mitigation Status: {{risk.mitigation_status}}
• Deadline: {{risk.deadline}}
• Approval Status: {{risk.approval_status}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'training_updated':
                if (isUpdate) {
                  return {
                    subject: 'Training "{{training.name}}" has been updated',
                    body: `A training has been updated in the system.

Training Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Training "{{training.name}}" has been deleted' : 'New training "{{training.name}}" has been scheduled'}`,
                    body: `A training has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Training Details:
• Training Name: {{training.name}}
• Description: {{training.description}}
• Duration: {{training.duration}}
• Provider: {{training.provider}}
• Department: {{training.department}}
• Status: {{training.status}}
• Number of People: {{training.number_of_people}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'policy_updated':
                if (isUpdate) {
                  return {
                    subject: 'Policy "{{policy.title}}" has been updated',
                    body: `A policy has been updated in the system.

Policy Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Policy "{{policy.title}}" has been deleted' : 'New policy "{{policy.title}}" has been published'}`,
                    body: `A policy has been ${changeType === 'Deleted' ? 'deleted from' : 'added to'} the system.

Policy Details:
• Policy Title: {{policy.title}}
• Content: {{policy.content}}
• Status: {{policy.status}}
• Tags: {{policy.tags}}
• Next Review Date: {{policy.next_review_date}}
• Author: {{policy.author}}
• Assigned Reviewers: {{policy.reviewers}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              case 'incident_updated':
                if (isUpdate) {
                  return {
                    subject: 'Incident has been updated',
                    body: `An incident has been updated in the system.

Incident Information:
{{changes_summary}}

This notification was sent on {{date_and_time}}.`
                  };
                } else {
                  return {
                    subject: `${changeType === 'Deleted' ? 'Incident has been deleted' : 'New incident has been reported'}`,
                    body: `An incident has been ${changeType === 'Deleted' ? 'deleted from' : 'reported in'} the system.

Incident Details:
• AI Project: {{incident.ai_project}}
• Type: {{incident.type}}
• Severity: {{incident.severity}}
• Status: {{incident.status}}
• Date Occurred: {{incident.occurred_date}}
• Date Detected: {{incident.date_detected}}
• Reporter: {{incident.reporter}}
• Categories of Harm: {{incident.categories_of_harm}}
• Affected Persons/Groups: {{incident.affected_persons_groups}}

Description:
{{incident.description}}

Relationship/Causality:
{{incident.relationship_causality}}

Immediate Mitigations:
{{incident.immediate_mitigations}}

Planned Corrective Actions:
{{incident.planned_corrective_actions}}

Model/System Version: {{incident.model_system_version}}

Approval Status: {{incident.approval_status}}
Approved By: {{incident.approved_by}}
Approval Date: {{incident.approval_date}}
Interim Report: {{incident.interim_report}}

This notification was sent on {{date_and_time}}.`
                  };
                }

              default:
                return null;
            }
          };

          // Update all email actions with new templates
          const emailTemplate = generateEmailTemplate(updatedAutomation.trigger.type);
          if (emailTemplate) {
            updatedAutomation.actions = updatedAutomation.actions.map(action => {
              if (action.type === 'send_email') {
                return {
                  ...action,
                  configuration: {
                    ...action.configuration,
                    subject: emailTemplate.subject,
                    body: emailTemplate.body
                  }
                };
              }
              return action;
            });
          }
        }

        return updatedAutomation;
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

    // Validate that send_email actions have recipients
    const sendEmailActions = selectedAutomation.actions.filter(action => action.type === 'send_email');
    for (const action of sendEmailActions) {
      const recipients = action.configuration?.to;
      const hasRecipients = Array.isArray(recipients) && recipients.length > 0;

      if (!hasRecipients) {
        setToast({
          variant: "error",
          body: "Please add at least one recipient to the Send Email action before saving.",
          visible: true
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Check if this is an existing automation (has numeric ID from backend) or new (has generated string ID)
      const isExistingAutomation = !isNaN(Number(selectedAutomation.id));

      // Map frontend trigger type + changeType to backend trigger key
      const mapTriggerKey = (triggerType: string, changeType: string): string => {
        // Extract the entity type from trigger (e.g., "vendor_updated" -> "vendor")
        const entityType = triggerType.replace('_updated', '');

        // Map changeType to backend suffix
        const changeTypeSuffix = changeType.toLowerCase(); // "Added" -> "added", "Updated" -> "updated", "Deleted" -> "deleted"

        // Return the mapped backend trigger key (e.g., "vendor_added", "vendor_updated", "vendor_deleted")
        return `${entityType}_${changeTypeSuffix}`;
      };

      // Get the changeType from trigger configuration (default to 'Added' if not set)
      const changeType = selectedAutomation.trigger.configuration?.changeType || 'Added';

      // Get the backend trigger key based on trigger type and changeType
      const backendTriggerKey = selectedAutomation.trigger.type.endsWith('_updated')
        ? mapTriggerKey(selectedAutomation.trigger.type, changeType)
        : selectedAutomation.trigger.type;

      // First, get all triggers to find the trigger ID by type
      const triggersResponse = await CustomAxios.get('/automations/triggers');
      const triggers = triggersResponse.data.data;

      // Find the trigger ID that matches our mapped backend trigger key
      const triggerData = triggers.find((t: any) => t.key === backendTriggerKey);

      if (!triggerData) {
        throw new Error(`Trigger type "${backendTriggerKey}" not found in backend`);
      }

      // Get all actions to map action types to IDs
      const actionsResponse = await CustomAxios.get(`/automations/actions/by-triggerId/${triggerData.id}`);
      const availableActions = actionsResponse.data.data;

      // Fetch users to map user IDs to emails
      const usersResponse = await CustomAxios.get('/users');
      const users = usersResponse.data.data;

      // Prepare the actions data
      const processedActions = selectedAutomation.actions.map((action, index) => {
        // Find the action type ID
        const actionData = availableActions.find((a: any) => a.key === action.type);

        if (!actionData) {
          throw new Error(`Action type "${action.type}" not found for this trigger`);
        }

        // Process the configuration to ensure 'to' field is an array of emails
        const processedParams = { ...action.configuration };

        // If 'to' field exists, convert it to an array of email addresses
        if (processedParams.to) {
          let recipientIds: string[] = [];

          if (typeof processedParams.to === 'string') {
            // Split by comma if it's a string
            recipientIds = processedParams.to
              .split(',')
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0);
          } else if (Array.isArray(processedParams.to)) {
            // Already an array
            recipientIds = processedParams.to;
          }

          // Convert user IDs to email addresses
          processedParams.to = recipientIds.map((id: string) => {
            // // Check if it's already an email address
            // if (id.includes('@')) {
            //   return id;
            // }
            // Otherwise, it's a user ID - look up the email
            const user = users.find((u: any) => String(u.id) === String(id));
            return user ? user.email : id;
          }).filter((email: string) => email && email.length > 0);
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
          params: JSON.stringify(selectedAutomation.trigger.configuration || {}),
          actions: processedActions,
        };

        response = await CustomAxios.put(`/automations/${selectedAutomation.id}`, updateData);

        if (response.status === 200) {
          // Show success notification
  
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
          params: JSON.stringify(selectedAutomation.trigger.configuration || {}),
          actions: processedActions,
        };

        response = await CustomAxios.post('/automations', automationData);

        if (response.status === 201) {
          // Show success notification
    
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

      <Box sx={{ height: 'calc(100vh - 180px)' }}>
        <Box
          sx={{
            height: '100%',
            backgroundColor: theme.palette.background.main,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.border.dark}`,
            display: 'flex',
          }}
        >
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {/* Left Sidebar - Automation List */}
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                height: '100%',
                borderRight: `1px solid ${theme.palette.border.dark}`,
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
              md={showConfigurationPanel ? 6 : 9}
              sx={{
                height: '100%',
                ...(showConfigurationPanel ? { borderRight: `1px solid ${theme.palette.border.dark}` } : {}),
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
                  projects={projects}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

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