import { TriggerTemplate, ActionTemplate } from '../../../../domain/types/Automation';

export const mockTriggerTemplates: TriggerTemplate[] = [
  {
    type: 'vendor_added',
    name: 'When a vendor is added',
    description: 'Triggered when a new vendor is added',
    category: 'vendor',
    icon: 'Building',
    defaultConfiguration: {},
    configurationSchema: [],
  },
  {
    type: 'model_added',
    name: 'When a model is added',
    description: 'Triggered when a new model is added',
    category: 'project',
    icon: 'Box',
    defaultConfiguration: {},
    configurationSchema: [],
  },
  {
    type: 'vendor_review_date_approaching',
    name: 'When a vendor review date is approaching',
    description: 'Triggered when a vendor review date is approaching',
    category: 'vendor',
    icon: 'Calendar',
    defaultConfiguration: {
      daysBefore: 7,
    },
    configurationSchema: [
      {
        key: 'daysBefore',
        label: 'Days Before Review Date',
        type: 'select',
        required: true,
        options: [
          { value: 1, label: '1 day' },
          { value: 3, label: '3 days' },
          { value: 7, label: '7 days' },
          { value: 14, label: '14 days' },
          { value: 30, label: '30 days' },
        ],
        helpText: 'How many days before the review date should the automation trigger?',
      },
    ],
  },
];

export const mockActionTemplates: ActionTemplate[] = [
  {
    type: 'send_email',
    name: 'Send Email Notification',
    description: 'Sends an email to specified recipients',
    category: 'notification',
    icon: 'Mail',
    defaultConfiguration: {
      to: [],
      subject: 'Notification',
      body: 'This is an automated notification.',
      replacements: {},
    },
    configurationSchema: [
      {
        key: 'to',
        label: 'Recipients',
        type: 'textarea',
        required: true,
        placeholder: 'Enter email addresses (comma-separated)',
        helpText: 'Enter one or more email addresses separated by commas',
      },
      {
        key: 'subject',
        label: 'Email Subject',
        type: 'text',
        required: true,
        placeholder: 'Enter email subject',
        helpText: 'Use {{variable_name}} for dynamic content',
      },
      {
        key: 'body',
        label: 'Email Body',
        type: 'textarea',
        required: true,
        placeholder: 'Enter email content',
        helpText: 'Use {{variable_name}} for dynamic content. Available variables depend on the trigger.',
      },
    ],
    compatibleTriggers: ['vendor_added', 'model_added', 'vendor_review_date_approaching'],
  },
];