import type { ArticleContent } from '../../contentTypes';

export const promptsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Prompts let you centralize system and user messages into versioned templates. Each prompt contains an ordered list of messages (system, user, assistant) that can include **{{variable}}** placeholders. When a prompt is bound to an endpoint, the gateway resolves the template and prepends it to every request.',
    },
    {
      type: 'paragraph',
      text: 'The prompt editor uses a split-panel layout: the left side for editing messages and the right side for testing with real variables and streaming responses.',
    },
    {
      type: 'heading',
      id: 'creating-prompt',
      level: 2,
      text: 'Creating a prompt',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to **AI Gateway > Prompts** in the sidebar' },
        { text: 'Click **Create prompt** in the top right' },
        { text: 'Enter a name for your prompt (e.g., "Customer support agent"). A URL-safe slug is generated automatically from the name.' },
        { text: 'Optionally add a description to help your team understand the prompt\'s purpose' },
        { text: 'Click **Create**. You are taken to the prompt editor.' },
      ],
    },
    {
      type: 'heading',
      id: 'editing-messages',
      level: 2,
      text: 'Editing messages',
    },
    {
      type: 'paragraph',
      text: 'The left panel of the editor shows your message blocks. Each block has a role (system, user, or assistant) and a text area for the content. You can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Add messages', text: 'Click "+ Add message" below the last block to add a new user message. Change the role using the dropdown in the block header.' },
        { bold: 'Reorder messages', text: 'Drag the grip handle on the left side of any message block to reorder them.' },
        { bold: 'Delete messages', text: 'Click the trash icon in the block header. At least one message must remain.' },
        { bold: 'Change the role', text: 'Use the dropdown in the block header to switch between SYSTEM, USER, and ASSISTANT roles.' },
      ],
    },
    {
      type: 'heading',
      id: 'template-variables',
      level: 2,
      text: 'Template variables',
    },
    {
      type: 'paragraph',
      text: 'Use **{{variableName}}** syntax anywhere in your message content to create placeholders. Variables are automatically detected and shown as chips below the message blocks. The variable name must contain only letters, numbers, and underscores.',
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Variable resolution',
      text: 'When testing in the editor, you fill in variable values manually in the right panel. When a prompt is bound to an endpoint in production, variables are resolved from the request metadata.',
    },
    {
      type: 'heading',
      id: 'model-and-parameters',
      level: 2,
      text: 'Model and parameters',
    },
    {
      type: 'paragraph',
      text: 'Each prompt version can specify a model and parameters. Select a model from the dropdown at the top of the editor. Click the settings icon next to the model selector to configure:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Temperature', text: 'Controls randomness (0.0 to 2.0). Lower values produce more focused, deterministic output. Higher values produce more creative, varied output. Default is 1.0.' },
        { bold: 'Max tokens', text: 'Maximum number of tokens to generate in the response. Higher values allow longer outputs but increase cost and latency.' },
        { bold: 'Top P', text: 'Nucleus sampling parameter (0.0 to 1.0). The model considers tokens within the top_p cumulative probability. Use either temperature or top P for best results, not both.' },
      ],
    },
    {
      type: 'heading',
      id: 'versioning',
      level: 2,
      text: 'Versioning',
    },
    {
      type: 'paragraph',
      text: 'Every time you click **Save draft**, a new version is created. Versions are append-only and numbered sequentially (v1, v2, v3...). Each version captures the full message content, detected variables, model, and parameters.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Draft', text: 'A saved version that is not yet active. Drafts can be loaded into the editor and tested.' },
        { bold: 'Published', text: 'The active version used by bound endpoints. Only one version can be published at a time.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click the clock icon in the top right to open the **Version history** drawer. From there you can load any version into the editor or publish it directly.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Publishing',
      text: 'When you publish a version, all other versions are automatically set back to draft. The published version is immediately used by any endpoints bound to this prompt.',
    },
    {
      type: 'heading',
      id: 'testing',
      level: 2,
      text: 'Testing prompts',
    },
    {
      type: 'paragraph',
      text: 'The right panel of the editor lets you test your prompt with real LLM responses. To send a test:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Select an active endpoint from the **Test endpoint** dropdown. This determines which provider and API key will be used.' },
        { text: 'If your prompt contains variables, fill in the variable values in the input fields below the endpoint selector.' },
        { text: 'Type a message in the chat input at the bottom and press Enter (or click the send button).' },
        { text: 'The response streams in real-time. After the response completes, latency, token count, and cost are shown above the chat input.' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Test requests use real endpoints',
      text: 'Test messages are sent through the selected endpoint with full proxy flow including guardrails, rate limits, and spend logging. Budget is consumed as with any normal request.',
    },
    {
      type: 'heading',
      id: 'binding-to-endpoints',
      level: 2,
      text: 'Binding prompts to endpoints',
    },
    {
      type: 'paragraph',
      text: 'Once a prompt has a published version, it can be bound to an endpoint. When an endpoint has a bound prompt, the gateway resolves the published version\'s messages and prepends them to every request that goes through that endpoint.',
    },
    {
      type: 'paragraph',
      text: 'The resolution priority is:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'If the endpoint has a **prompt_id**, resolve the published version and prepend its messages (with variables substituted from request metadata).' },
        { text: 'If no published version exists or resolution fails, fall back to the endpoint\'s **system prompt** field.' },
        { text: 'If neither is set, use the request messages as-is.' },
      ],
    },
    {
      type: 'heading',
      id: 'deleting-prompts',
      level: 2,
      text: 'Deleting prompts',
    },
    {
      type: 'paragraph',
      text: 'Click the trash icon on any row in the prompts list to delete it. Deleting a prompt removes all its versions and unlinks it from any bound endpoints (the endpoint\'s prompt_id is set to null). Existing requests in flight are not affected, but subsequent requests will fall back to the endpoint\'s system prompt or use raw messages.',
    },
    {
      type: 'heading',
      id: 'permissions',
      level: 2,
      text: 'Permissions',
    },
    {
      type: 'paragraph',
      text: 'All users can view prompts and their versions. Creating, editing, publishing, and deleting prompts requires the **Admin** role.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-gateway',
          articleId: 'endpoints',
          title: 'Endpoints',
          description: 'Configure LLM provider endpoints that prompts can be bound to.',
        },
        {
          collectionId: 'ai-gateway',
          articleId: 'guardrails',
          title: 'Guardrails',
          description: 'Set up PII detection and content filtering that applies to prompt test requests.',
        },
        {
          collectionId: 'ai-gateway',
          articleId: 'getting-started',
          title: 'Getting started',
          description: 'Set up the AI Gateway from scratch with API keys, endpoints, and first requests.',
        },
      ],
    },
  ],
};
