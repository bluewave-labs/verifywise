import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Stack,
  Typography,
  Divider,
  FormControl,
  Chip,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import { X as CloseIcon, Settings } from 'lucide-react';
import Select from '../../../../components/Inputs/Select';
import Toggle from '../../../../components/Inputs/Toggle';
import Field from '../../../../components/Inputs/Field';
import TemplateField from '../../../../components/Inputs/TemplateField';
import CustomizableMultiSelect from '../../../../components/Inputs/Select/Multi';
import { Trigger, Action, TriggerTemplate, ActionTemplate, ConfigurationField } from '../../../../../domain/types/Automation';
import useUsers from '../../../../../application/hooks/useUsers';

interface AutomationDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedItem: Trigger | Action | null;
  selectedItemType: 'trigger' | 'action' | null;
  trigger: Trigger | null;
  triggerTemplates: TriggerTemplate[];
  actionTemplates: ActionTemplate[];
  onConfigurationChange: (configuration: Record<string, any>) => void;
}

const AutomationDrawer: React.FC<AutomationDrawerProps> = ({
  open,
  onClose,
  selectedItem,
  selectedItemType,
  trigger,
  triggerTemplates,
  actionTemplates,
  onConfigurationChange,
}) => {
  const theme = useTheme();
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const bodyFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const subjectFieldRef = React.useRef<HTMLInputElement>(null);

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

  // Handle variable insertion
  const handleVariableInsert = (variable: string) => {
    // Default to body field if no field is active
    const targetField = activeField || 'body';
    const currentValue = configuration[targetField] || '';

    // Get the ref for the active field
    let fieldRef: HTMLInputElement | HTMLTextAreaElement | null = null;
    if (targetField === 'body') {
      fieldRef = bodyFieldRef.current;
    } else if (targetField === 'subject') {
      fieldRef = subjectFieldRef.current;
    }

    if (fieldRef) {
      // Get cursor position
      const cursorPosition = fieldRef.selectionStart || currentValue.length;

      // Insert variable at cursor position
      const newValue =
        currentValue.slice(0, cursorPosition) +
        variable +
        currentValue.slice(cursorPosition);

      handleFieldChange(targetField, newValue);

      // Set focus back to field and position cursor after inserted variable
      setTimeout(() => {
        fieldRef!.focus();
        const newCursorPosition = cursorPosition + variable.length;
        fieldRef!.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      // Fallback: append to the end
      handleFieldChange(targetField, currentValue + (currentValue ? ' ' : '') + variable);
    }
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

        // Check if this is a template field (subject or body for email)
        const isTemplateField = field.key === 'subject' || field.key === 'body';

        // Use CustomizableMultiSelect for the "to" field (email recipients)
        if (field.key === 'to' && selectedItemType === 'action') {
          // Convert value to array format expected by CustomizableMultiSelect
          const selectValue = Array.isArray(value) ? value :
            (value && value !== '' ? value.split(',').map((v: string | number) => v.toString().trim()).filter((v: string | number) => v) : []);

          // Transform users to have _id field expected by CustomizableMultiSelect
          const usersWithId = users.map(user => ({
            ...user,
            _id: user.id // Map id to _id for the component
          }));

          return (
            <CustomizableMultiSelect
              key={field.key}
              label={field.label}
              required={field.required}
              error={!field.required || (selectValue.length > 0) ? undefined : "At least one recipient is required"}
              value={selectValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              items={usersWithId}
              placeholder={usersLoading ? "Loading users..." : "Search and select users..."}
              sx={{ width: '100%' }}
              isHidden={false}
            />
          );
        }

        // Determine which ref to use
        const inputRef = field.key === 'body' ? bodyFieldRef as any :
                         field.key === 'subject' ? subjectFieldRef :
                         undefined;

        // Use TemplateField for subject and body with variable autocomplete
        if (isTemplateField && selectedItemType === 'action') {
          return (
            <TemplateField
              key={field.key}
              id={field.key}
              label={field.label}
              type={isMessageField ? "description" : "text"}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              onFocus={() => setActiveField(field.key)}
              placeholder={field.placeholder}
              rows={isMessageField ? 8 : undefined}
              isRequired={field.required}
              variables={templateVariables}
              ref={inputRef}
            />
          );
        }

        // Use regular Field for other fields
        return (
          <Field
            key={field.key}
            id={field.key}
            label={field.label}
            type={isMessageField ? "description" : "text"}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            onFocus={() => setActiveField(field.key)}
            placeholder={field.placeholder}
            rows={isMessageField ? 8 : undefined}
            isRequired={field.required}
            ref={inputRef}
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
            isRequired={field.required}
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

  // Get trigger-specific template variables
  const getTemplateVariables = () => {
    if (!trigger) return [];

    const commonVariables = [
      { var: '{{date_and_time}}', desc: 'Date and time of the event' },
    ];

    const vendorVariables = [
      { var: '{{vendor.name}}', desc: 'Name of the vendor' },
      { var: '{{vendor.id}}', desc: 'Vendor ID' },
      { var: '{{vendor.provides}}', desc: 'Services/products the vendor provides' },
      { var: '{{vendor.website}}', desc: 'Vendor website URL' },
      { var: '{{vendor.contact}}', desc: 'Vendor contact person name' },
    ];

    const modelVariables = [
      { var: '{{model.id}}', desc: 'Model ID' },
      { var: '{{model.provider}}', desc: 'Model provider (e.g., OpenAI, Anthropic)' },
      { var: '{{model.name}}', desc: 'Model name' },
      { var: '{{model.version}}', desc: 'Model version' },
      { var: '{{model.provider_model}}', desc: 'Full provider model string' },
      { var: '{{model.approver}}', desc: 'Person who approved the model' },
      { var: '{{model.capabilities}}', desc: 'Model capabilities' },
      { var: '{{model.security_assessment}}', desc: 'Security assessment status (Yes/No)' },
      { var: '{{model.status}}', desc: 'Model status (Pending/Approved/Restricted)' },
      { var: '{{model.status_date}}', desc: 'Status date' },
      { var: '{{model.reference_link}}', desc: 'Reference link' },
      { var: '{{model.biases}}', desc: 'Known biases' },
      { var: '{{model.limitations}}', desc: 'Model limitations' },
      { var: '{{model.hosting_provider}}', desc: 'Hosting provider' },
      { var: '{{model.used_in_projects}}', desc: 'Projects using this model' },
      { var: '{{model.created_at}}', desc: 'Model creation date' },
    ];

    const vendorReviewVariables = [
      { var: '{{vendor.review_date}}', desc: 'Scheduled review date' },
      { var: '{{vendor.reviewer}}', desc: 'Assigned reviewer' },
    ];

    switch (trigger.type) {
      case 'vendor_added':
        return [...vendorVariables, ...commonVariables];
      case 'model_added':
        return [...modelVariables, ...commonVariables];
      case 'vendor_review_date_approaching':
        return [...vendorVariables, ...vendorReviewVariables, ...commonVariables];
      default:
        return commonVariables;
    }
  };

  const templateVariables = getTemplateVariables();

  if (!selectedItem || !template) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        sx={{
          width: 600,
          margin: 0,
          '& .MuiDrawer-paper': {
            margin: 0,
            borderRadius: 0,
          },
        }}
        anchor="right"
      >
        <Stack
          sx={{
            width: 600,
          }}
        >
          {/* Header */}
          <Stack
            sx={{
              width: 600,
              padding: '15px 20px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography fontSize={15} fontWeight={700}>
              Configure Automation
            </Typography>
            <CloseIcon size={20} onClick={onClose} style={{ cursor: 'pointer' }} />
          </Stack>
          <Divider />

          {/* Empty State */}
          <Stack
            sx={{
              flex: 1,
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
        </Stack>
      </Drawer>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        width: 600,
        margin: 0,
        '& .MuiDrawer-paper': {
          margin: 0,
          borderRadius: 0,
        },
      }}
      anchor="right"
    >
      <Stack
        sx={{
          width: 600,
        }}
      >
        {/* Header */}
        <Stack
          sx={{
            width: 600,
            padding: '15px 20px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography fontSize={15} fontWeight={700}>
            {selectedItemType === 'trigger' ? 'Configure Trigger' : 'Configure Action'}: {selectedItem.name}
          </Typography>
          <CloseIcon size={20} onClick={onClose} style={{ cursor: 'pointer' }} />
        </Stack>
        <Divider />

        {/* Configuration Fields */}
        <Stack
          sx={{
            padding: '15px 20px',
            flex: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'transparent',
              borderRadius: '4px',
              backgroundClip: 'padding-box',
            },
            '&:hover::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.3)',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}
          gap="24px"
        >
          {template.configurationSchema.length > 0 ? (
            <>
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
            </>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              No configuration options available for this {selectedItemType}.
            </Typography>
          )}
        </Stack>

        {/* Template Variables Helper */}
        {selectedItemType === 'action' && templateVariables.length > 0 && (
          <>
            <Divider />
            <Stack sx={{ padding: '15px 20px' }} gap="16px">
              <Typography fontSize={13} sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Available Variables
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ fontSize: 12 }}>
                Use these variables in your email subject and body to insert dynamic content: Click any variable to insert it into {
                  activeField === 'subject' ? 'the subject field' :
                  'the email body'
                } (currently {activeField || 'body'})
              </Typography>

              <Stack spacing={1.5}>
                {templateVariables.map((item) => (
                  <Card
                    key={item.var}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        borderColor: theme.palette.primary.main,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => handleVariableInsert(item.var)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack spacing={0.5}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {item.var}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: 10 }}>
                          {item.desc}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
};

export default AutomationDrawer;
