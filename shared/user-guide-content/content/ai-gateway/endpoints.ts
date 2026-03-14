import type { ArticleContent } from '../../contentTypes';

export const endpointsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Each endpoint maps a URL-safe slug to a provider, model, and API key. Applications call the slug, not the model directly, so you can swap models without changing any application code.',
    },
    {
      type: 'heading',
      id: 'creating-endpoint',
      level: 2,
      text: 'Creating an endpoint',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click "Add endpoint" in the top right' },
        { text: 'Enter a display name (e.g., "Production GPT-4o"). A URL-safe slug is generated automatically.' },
        { text: 'Select a model from the dropdown. Models are grouped by provider.' },
        { text: 'Select an API key to authenticate with the provider. If no keys are available, add one in Settings first.' },
        { text: 'Optionally set max tokens, temperature, and a system prompt.' },
        { text: 'Click "Create endpoint"' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'System prompts',
      text: 'If you set a system prompt on an endpoint, it gets prepended to every request. Good for enforcing consistent behavior or response formatting without changing your application.',
    },
    {
      type: 'heading',
      id: 'endpoint-slugs',
      level: 2,
      text: 'Endpoint slugs',
    },
    {
      type: 'paragraph',
      text: 'Each endpoint has a unique slug (e.g., "prod-gpt4o") that is used to route requests. Slugs must be lowercase alphanumeric with hyphens only. They are auto-generated from the display name but can be customized.',
    },
    {
      type: 'heading',
      id: 'managing-endpoints',
      level: 2,
      text: 'Managing endpoints',
    },
    {
      type: 'paragraph',
      text: 'The endpoint list shows each endpoint with its provider icon, display name, model, associated API key, guardrail status, and active/inactive state. You can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Delete', text: 'Removes the endpoint. Requests using this slug will fail.' },
        { bold: 'View guardrail status', text: 'Shows how many guardrail rules are currently active across all endpoints.' },
      ],
    },
    {
      type: 'heading',
      id: 'supported-providers',
      level: 2,
      text: 'Supported providers',
    },
    {
      type: 'paragraph',
      text: 'The AI Gateway supports 100+ LLM providers through LiteLLM, including:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Direct providers', text: 'OpenAI, Anthropic, Google Gemini, Mistral, xAI, Cohere' },
        { bold: 'Cloud providers', text: 'AWS Bedrock, Azure OpenAI, Google Vertex AI' },
        { bold: 'Aggregators', text: 'OpenRouter, Together AI' },
        { bold: 'Self-hosted', text: 'Ollama, vLLM, NVIDIA NIM' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Model format',
      text: 'Models follow the LiteLLM format: "provider/model-name" (e.g., "openai/gpt-4o", "anthropic/claude-sonnet-4-20250514"). For OpenRouter, use "openrouter/provider/model" (e.g., "openrouter/meta-llama/llama-3.3-70b-instruct").',
    },
  ],
};
