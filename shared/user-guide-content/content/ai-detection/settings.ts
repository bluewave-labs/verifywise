import type { ArticleContent } from '../../contentTypes';

export const aiDetectionSettingsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'AI Detection settings',
    },
    {
      type: 'paragraph',
      text: 'The Settings page lets you configure integrations and tokens needed for AI detection scanning. Currently, this includes GitHub token management for accessing private repositories.',
    },
    {
      type: 'heading',
      id: 'github-integration',
      level: 2,
      text: 'GitHub integration',
    },
    {
      type: 'paragraph',
      text: 'To scan private repositories, you need a GitHub Personal Access Token. Without a token, AI Detection can only scan public repositories.',
    },
    {
      type: 'heading',
      id: 'creating-token',
      level: 2,
      text: 'Creating a token',
    },
    {
      type: 'paragraph',
      text: 'Click the **Create a new token on GitHub** link to open GitHub\'s token creation page with the recommended scopes pre-selected:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'repo', text: 'Full access to private and public repositories. Required for scanning private repos.' },
        { bold: 'public_repo', text: 'Access to public repositories only. Use this if you only need to scan public repos.' },
      ],
    },
    {
      type: 'heading',
      id: 'saving-token',
      level: 2,
      text: 'Saving your token',
    },
    {
      type: 'paragraph',
      text: 'Paste your token into the **Personal access token** field. Optionally give it a descriptive name (e.g., "VerifyWise Scanner Token") to help identify it later. Click **Test token** to verify it works, then **Save token** to store it.',
    },
    {
      type: 'heading',
      id: 'managing-token',
      level: 2,
      text: 'Managing your token',
    },
    {
      type: 'paragraph',
      text: 'Once a token is configured, you\'ll see a status indicator showing it\'s active. You can update the token at any time by entering a new one and clicking **Update token**. To remove the token entirely, click the delete button.',
    },
    {
      type: 'callout',
      text: 'Tokens are stored securely on the server. They are never exposed in the browser after being saved.',
    },
  ],
};
