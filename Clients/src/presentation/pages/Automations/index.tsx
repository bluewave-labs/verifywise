import React, { useState, useEffect } from 'react';
import { Grid, Container, Box, useTheme } from '@mui/material';
import AutomationList from './components/AutomationList';
import AutomationBuilder from './components/AutomationBuilder';
import ConfigurationPanel from './components/ConfigurationPanel';
import { Automation, Trigger, Action, TriggerTemplate, ActionTemplate } from '../../../domain/types/Automation';
import { mockTriggerTemplates, mockActionTemplates } from './data/mockData';
import { generateId } from '../../../application/utils/generateId';

const AutomationsPage: React.FC = () => {
  const theme = useTheme();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'trigger' | 'action' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // Initialize with empty state to show Airtable-style onboarding
  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setAutomations([]); // Start with empty state
      setIsLoading(false);
    }, 500);
  }, []);

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

  const handleDeleteAutomation = (automationId: string) => {
    setAutomations(prev => prev.filter(a => a.id !== automationId));
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

  const handleToggleAutomation = (automationId: string) => {
    setAutomations(prev => prev.map(automation =>
      automation.id === automationId
        ? {
            ...automation,
            isActive: !automation.isActive,
            status: !automation.isActive ? 'active' : 'inactive',
            updatedAt: new Date()
          }
        : automation
    ));
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
              automation={selectedAutomation}
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
            />
          </Grid>

          {/* Right Panel - Configuration (conditional) */}
          {showConfigurationPanel && (
            <Grid item xs={12} md={3}>
              <ConfigurationPanel
                selectedItem={selectedItem}
                selectedItemType={selectedItemType}
                triggerTemplates={mockTriggerTemplates}
                actionTemplates={mockActionTemplates}
                onConfigurationChange={handleUpdateConfiguration}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default AutomationsPage;