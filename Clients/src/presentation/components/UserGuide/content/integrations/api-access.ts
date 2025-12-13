import type { ArticleContent } from '@User-guide-content/contentTypes';

export const apiAccessContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides API access for programmatic integration with external applications, scripts, and automation workflows. API keys allow authenticated access to VerifyWise features without requiring interactive login.',
    },
    {
      type: 'paragraph',
      text: 'Use API keys to build custom integrations, automate data synchronization, or connect VerifyWise with your existing tools and processes.',
    },
    {
      type: 'heading',
      id: 'accessing-api-keys',
      level: 2,
      text: 'Accessing API keys',
    },
    {
      type: 'paragraph',
      text: 'To manage API keys:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Settings from the main menu' },
        { text: 'Select the API Keys tab' },
        { text: 'View your existing keys or create new ones' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only users with the Admin role can view and manage API keys. The API Keys tab is not visible to Editors or Viewers.',
    },
    {
      type: 'heading',
      id: 'creating-api-key',
      level: 2,
      text: 'Creating an API key',
    },
    {
      type: 'paragraph',
      text: 'To create a new API key:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click "Create new key" or "Create API key" button' },
        { text: 'Enter a descriptive name for the key (e.g., "Production API Key", "CI/CD Pipeline")' },
        { text: 'Click Create' },
        { text: 'Copy the generated key immediately' },
        { text: 'Click "I copied the key" to close the dialog' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/create-api-key.png',
      alt: 'Create API key modal with a key name input field and Create button',
      caption: 'Enter a descriptive name for your API key to help identify its purpose.',
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Important',
      text: 'The API key is only shown once when created. Copy it immediately and store it securely. You cannot retrieve the key later. If you lose the key, you must create a new one.',
    },
    {
      type: 'heading',
      id: 'key-naming',
      level: 3,
      text: 'Key naming best practices',
    },
    {
      type: 'paragraph',
      text: 'Use descriptive names that indicate the key\'s purpose:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Environment-based', text: 'Production API Key, Staging API Key, Development Key' },
        { bold: 'Purpose-based', text: 'Model Sync Key, Reporting Automation, CI/CD Integration' },
        { bold: 'Application-based', text: 'Data Pipeline Key, Dashboard Integration' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Key names must be between 3 and 50 characters. Each key name must be unique within your organization.',
    },
    {
      type: 'heading',
      id: 'viewing-keys',
      level: 2,
      text: 'Viewing API keys',
    },
    {
      type: 'paragraph',
      text: 'The API keys list displays the following information for each key:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Name', text: 'The descriptive name you assigned to the key' },
        { bold: 'Status', text: 'Whether the key is Active or Expired' },
        { bold: 'Created', text: 'When the key was created' },
        { bold: 'Expires', text: 'When the key will expire' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/api-keys.png',
      alt: 'API Keys settings tab showing a list of API keys with their names, status indicators, creation dates, and expiration dates',
      caption: 'The API Keys tab displays all your API keys with their status and expiration information.',
    },
    {
      type: 'paragraph',
      text: 'Active keys display a green status badge. Expired keys show a warning indicator and can no longer be used for API access.',
    },
    {
      type: 'heading',
      id: 'deleting-keys',
      level: 2,
      text: 'Deleting API keys',
    },
    {
      type: 'paragraph',
      text: 'To delete an API key:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Find the key in the API keys list' },
        { text: 'Click the delete icon for that key' },
        { text: 'Confirm the deletion when prompted' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Deleting an API key immediately invalidates it. Any applications using the key will lose access. This action cannot be undone.',
    },
    {
      type: 'heading',
      id: 'using-api-keys',
      level: 2,
      text: 'Using API keys',
    },
    {
      type: 'paragraph',
      text: 'To authenticate API requests, include your API key in the request headers:',
    },
    {
      type: 'paragraph',
      text: 'Include the key in the Authorization header as a Bearer token:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Header name', text: 'Authorization' },
        { bold: 'Header value', text: 'Bearer YOUR_API_KEY' },
      ],
    },
    {
      type: 'heading',
      id: 'security-best-practices',
      level: 2,
      text: 'Security best practices',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Never share keys', text: 'Keep API keys confidential. Do not share them in emails, chat, or version control.' },
        { bold: 'Use environment variables', text: 'Store keys in environment variables rather than hard-coding them in applications.' },
        { bold: 'Rotate regularly', text: 'Periodically create new keys and delete old ones to limit exposure.' },
        { bold: 'Use separate keys', text: 'Create separate keys for different environments and purposes.' },
        { bold: 'Monitor usage', text: 'If you suspect a key has been compromised, delete it immediately and create a new one.' },
        { bold: 'Limit access', text: 'Only administrators should have access to API key management.' },
      ],
    },
    {
      type: 'heading',
      id: 'key-expiration',
      level: 2,
      text: 'Key expiration',
    },
    {
      type: 'paragraph',
      text: 'API keys have an expiration date set when created. Monitor your keys and create new ones before existing keys expire to maintain uninterrupted access.',
    },
    {
      type: 'paragraph',
      text: 'When a key expires:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'The key status changes to Expired' },
        { text: 'API requests using the key will be rejected' },
        { text: 'You must create a new key and update your applications' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'heading',
      id: 'troubleshoot-401',
      level: 3,
      text: 'Receiving 401 Unauthorized errors',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Verify the API key is correct and complete' },
        { text: 'Check that the key has not expired' },
        { text: 'Ensure the Authorization header is properly formatted' },
        { text: 'Confirm the key has not been deleted' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshoot-lost-key',
      level: 3,
      text: 'Lost API key',
    },
    {
      type: 'paragraph',
      text: 'If you lose an API key, you cannot retrieve it. Create a new key and update your applications to use the new key. Delete the old key if it is no longer needed.',
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-how-many',
      level: 3,
      text: 'How many API keys can I create?',
    },
    {
      type: 'paragraph',
      text: 'There is a limit on the number of API keys per organization. If you receive an error about reaching the maximum, delete unused keys before creating new ones.',
    },
    {
      type: 'heading',
      id: 'faq-duplicate-name',
      level: 3,
      text: 'Why am I getting a duplicate name error?',
    },
    {
      type: 'paragraph',
      text: 'Each API key must have a unique name within your organization. If a key with that name already exists, choose a different name or delete the existing key first.',
    },
    {
      type: 'heading',
      id: 'faq-permissions',
      level: 3,
      text: 'What permissions does an API key have?',
    },
    {
      type: 'paragraph',
      text: 'API keys provide access to VerifyWise API endpoints based on the permissions available to your organization. The specific endpoints and operations available are documented in the API reference.',
    },
    {
      type: 'heading',
      id: 'faq-rate-limits',
      level: 3,
      text: 'Are there rate limits?',
    },
    {
      type: 'paragraph',
      text: 'API requests may be subject to rate limiting to ensure platform stability. If you encounter rate limit errors, reduce the frequency of your requests or contact support for guidance.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'integrations',
          articleId: 'integration-overview',
          title: 'Integration overview',
          description: 'View all available integrations',
        },
        {
          collectionId: 'settings',
          articleId: 'role-configuration',
          title: 'Role configuration',
          description: 'Understand roles and permissions',
        },
      ],
    },
  ],
};
