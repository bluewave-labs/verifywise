import type { ArticleContent } from '../../contentTypes';

export const playgroundContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Playground provides an interactive chat interface for testing your configured endpoints before routing production traffic. Send messages, observe streaming responses, and verify that guardrails work as expected.',
    },
    {
      type: 'heading',
      id: 'using-playground',
      level: 2,
      text: 'Using the Playground',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Select an endpoint from the dropdown. Only active endpoints with valid API keys appear.' },
        { text: 'Type a message and press Enter (or click the send button).' },
        { text: 'The response streams in real-time with markdown rendering.' },
        { text: 'Continue the conversation — full message history is sent with each request.' },
      ],
    },
    {
      type: 'heading',
      id: 'settings',
      level: 2,
      text: 'Playground settings',
    },
    {
      type: 'paragraph',
      text: 'Click the gear icon to open the settings modal:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Temperature', text: 'Controls randomness (0 = focused, 2 = creative). Default: 0.7' },
        { bold: 'Max tokens', text: 'Maximum number of tokens in the response. Default: 4096' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Settings are applied per-request and override any defaults configured on the endpoint.',
    },
    {
      type: 'heading',
      id: 'guardrail-testing',
      level: 2,
      text: 'Testing guardrails',
    },
    {
      type: 'paragraph',
      text: 'If guardrail rules are active, the Playground respects them. A message containing blocked content (e.g., personal data when PII detection is enabled) will be rejected before reaching the LLM. Masked content will be replaced with placeholders.',
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Guardrail errors',
      text: 'When a guardrail blocks a request, the Playground displays the reason (e.g., "Blocked by guardrail: content_filter: confidential detected"). This helps you verify that your guardrail rules work correctly before deploying to production.',
    },
    {
      type: 'heading',
      id: 'cost-tracking',
      level: 2,
      text: 'Cost tracking',
    },
    {
      type: 'paragraph',
      text: 'Every message sent through the Playground is logged in the Analytics dashboard with full cost and token tracking. Use the Playground to estimate production costs — if a conversation costs $0.02 per exchange, multiply by your expected daily volume to forecast monthly spend.',
    },
  ],
};
