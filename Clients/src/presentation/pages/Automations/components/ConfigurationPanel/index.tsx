import React, { useState, useEffect } from 'react';
import {
  Stack,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Chip,
  useTheme,
  Divider,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Settings, HelpCircle } from 'lucide-react';
import Select from '../../../../components/Inputs/Select';
import Toggle from '../../../../components/Inputs/Toggle';
import Field from '../../../../components/Inputs/Field';
import { Trigger, Action, TriggerTemplate, ActionTemplate, ConfigurationField } from '../../../../../domain/types/Automation';

interface ConfigurationPanelProps {
  selectedItem: Trigger | Action | null;
  selectedItemType: 'trigger' | 'action' | null;
  triggerTemplates: TriggerTemplate[];
  actionTemplates: ActionTemplate[];
  onConfigurationChange: (configuration: Record<string, any>) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  selectedItem,
  selectedItemType,
  triggerTemplates,
  actionTemplates,
  onConfigurationChange,
}) => {
  const theme = useTheme();
  const [configuration, setConfiguration] = useState<Record<string, any>>({});

  // Get the template for the selected item
  const template = React.useMemo(() => {
    if (!selectedItem) return null;

    if (selectedItemType === 'trigger') {
      return triggerTemplates.find(t => t.type === selectedItem.type);
    } else {
      return actionTemplates.find(a => a.type === selectedItem.type);
    }
  }, [selectedItem, selectedItemType, triggerTemplates, actionTemplates]);

  // Initialize configuration when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setConfiguration(selectedItem.configuration || {});
    }
  }, [selectedItem]);

  // Handle configuration field changes
  const handleFieldChange = (fieldKey: string, value: any) => {
    const newConfiguration = { ...configuration, [fieldKey]: value };
    setConfiguration(newConfiguration);
    onConfigurationChange(newConfiguration);
  };

  // Render different field types
  const renderField = (field: ConfigurationField) => {
    const value = configuration[field.key] ?? '';

    switch (field.type) {
      case 'text':
      case 'textarea':
        // Check if this is a message/content field that should have multiple rows (excluding subject)
        const isMessageField = field.type === 'textarea' ||
                              field.key.toLowerCase().includes('message') ||
                              field.key.toLowerCase().includes('body') ||
                              field.key.toLowerCase().includes('content') ||
                              field.key === 'body' ||
                              field.key === 'message' ||
                              field.key === 'reminderMessage' ||
                              field.label.toLowerCase().includes('message') ||
                              field.label.toLowerCase().includes('body') ||
                              field.label.toLowerCase().includes('content');

        return (
          <Field
            key={field.key}
            id={field.key}
            label={field.label}
            type={isMessageField ? "description" : "text"}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={isMessageField ? 4 : undefined}
            isRequired={field.required}
          />
        );

      case 'select':
        return (
          <Select
            key={field.key}
            id={field.key}
            label={field.label}
            value={value}
            items={field.options?.map(opt => ({ _id: opt.value, name: opt.label })) || []}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            isRequired={field.required}
          />
        );

      case 'multiselect':
        return (
          <FormControl key={field.key} fullWidth>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {field.label} {field.required && <span style={{ color: theme.palette.error.main }}>*</span>}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {field.options?.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  clickable
                  variant={Array.isArray(value) && value.includes(option.value) ? 'filled' : 'outlined'}
                  onClick={() => {
                    const currentArray = Array.isArray(value) ? value : [];
                    const newArray = currentArray.includes(option.value)
                      ? currentArray.filter(v => v !== option.value)
                      : [...currentArray, option.value];
                    handleFieldChange(field.key, newArray);
                  }}
                  sx={{
                    backgroundColor: Array.isArray(value) && value.includes(option.value)
                      ? theme.palette.primary.main
                      : 'transparent',
                    color: Array.isArray(value) && value.includes(option.value)
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                  }}
                />
              ))}
            </Stack>
            {field.helpText && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {field.helpText}
              </Typography>
            )}
          </FormControl>
        );

      case 'number':
        return (
          <Field
            key={field.key}
            id={field.key}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <Stack key={field.key} direction="row" alignItems="center" spacing={1}>
            <Stack flex={1}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {field.label}
              </Typography>
              {field.helpText && (
                <Typography variant="caption" color="textSecondary">
                  {field.helpText}
                </Typography>
              )}
            </Stack>
            <Toggle
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  // Template variables helper
  const templateVariables = [
    '{{project_name}}',
    '{{project_owner}}',
    '{{trigger_name}}',
    '{{trigger_details}}',
    '{{user_name}}',
    '{{date}}',
    '{{time}}',
  ];

  if (!selectedItem || !template) {
    return (
      <Stack
        sx={{
          height: '100%',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Settings size={48} strokeWidth={1} color={theme.palette.primary.main} />
        <Typography variant="h6" color="textSecondary" sx={{ mt: 2, fontSize: '13px' }}>
          Configure automation
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
          Select a trigger or action to configure its settings
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      sx={{
        height: '100%',
        backgroundColor: 'transparent',
      }}
    >

      {/* Content */}
      <Stack sx={{ flex: 1, overflow: 'auto', pt: 4 }}>
        {/* Configuration Fields */}
        <Box sx={{ mx: 2, my: 2 }}>
          <Box sx={{ px: 2, py: 2, borderLeft: '16px solid transparent', borderRight: '16px solid transparent' }}>
            {template.configurationSchema.length > 0 ? (
            <Stack spacing={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Settings
              </Typography>

              {template.configurationSchema.map((field) => (
                <Stack key={field.key} spacing={1}>
                  {renderField(field)}
                  {field.helpText && field.type !== 'boolean' && field.type !== 'multiselect' && (
                    <Typography variant="caption" color="textSecondary">
                      {field.helpText}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              No configuration options available for this {selectedItemType}.
            </Typography>
          )}
          </Box>
        </Box>

        {/* Template Variables Helper */}
        {selectedItemType === 'action' && (
          <>
            <Box sx={{ my: 2 }}>
              <Divider />
            </Box>
            <Box sx={{ mx: 2, my: 2 }}>
              <Box sx={{ px: 2, py: 2, borderLeft: '16px solid transparent', borderRight: '16px solid transparent' }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Available Variables
                  </Typography>

                <Typography variant="body2" color="textSecondary" sx={{ fontSize: 12 }}>
                  Use these variables in your text fields to insert dynamic content:
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {templateVariables.map((variable) => (
                    <Chip
                      key={variable}
                      label={variable}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(variable);
                      }}
                    />
                  ))}
                </Stack>

                <Typography variant="caption" color="textSecondary">
                  Click any variable to copy it to your clipboard
                </Typography>
                </Stack>
              </Box>
            </Box>
          </>
        )}

      </Stack>
    </Stack>
  );
};

export default ConfigurationPanel;