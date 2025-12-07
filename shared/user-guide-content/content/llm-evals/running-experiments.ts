import type { ArticleContent } from '../../contentTypes';

export const runningExperimentsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Experiments are the core of LLM Evals—each experiment runs your model against a dataset and measures performance using configured metrics. The experiment wizard guides you through a four-step process to configure and run evaluations.',
    },
    {
      type: 'heading',
      id: 'creating-experiment',
      level: 2,
      text: 'Creating a new experiment',
    },
    {
      type: 'paragraph',
      text: 'Click **New experiment** from the Overview or Experiments tab. The wizard walks you through four steps:',
    },
    {
      type: 'heading',
      id: 'step-1-model',
      level: 3,
      text: 'Step 1: Model configuration',
    },
    {
      type: 'paragraph',
      text: 'Select the model you want to evaluate. Supported providers include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'OpenAI', text: 'GPT-4, GPT-4 Turbo, GPT-3.5 Turbo' },
        { bold: 'Anthropic', text: 'Claude 3 Opus, Sonnet, Haiku' },
        { bold: 'Google Gemini', text: 'Gemini Pro, Gemini Ultra' },
        { bold: 'xAI', text: 'Grok models' },
        { bold: 'Mistral', text: 'Mistral Large, Mistral Medium' },
        { bold: 'HuggingFace', text: 'Open-source models like TinyLlama' },
        { bold: 'Ollama', text: 'Locally-hosted models (Llama2, Mistral, CodeLlama)' },
        { bold: 'Local', text: 'Custom local endpoints' },
        { bold: 'Custom API', text: 'Any OpenAI-compatible API endpoint' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Enter your API key and model name. For local or custom endpoints, provide the endpoint URL.',
    },
    {
      type: 'heading',
      id: 'step-2-dataset',
      level: 3,
      text: 'Step 2: Dataset selection',
    },
    {
      type: 'paragraph',
      text: 'Choose your evaluation dataset from three sources:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'My datasets', text: 'Previously uploaded custom datasets stored in your project' },
        { bold: 'Built-in datasets', text: 'Curated presets maintained by VerifyWise for common use cases' },
        { bold: 'Upload now', text: 'Upload a new JSON dataset file for immediate use' },
      ],
    },
    {
      type: 'paragraph',
      text: 'For chatbot evaluations, select the dataset form:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Single-turn', text: 'Evaluates isolated prompts and responses' },
        { bold: 'Conversational (multi-turn)', text: 'Evaluates assistant turns within a chat history—recommended for chatbots' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You can filter built-in datasets by category (coding, mathematics, reasoning, creative, knowledge) and limit the number of prompts to evaluate.',
    },
    {
      type: 'heading',
      id: 'step-3-judge',
      level: 3,
      text: 'Step 3: Judge LLM',
    },
    {
      type: 'paragraph',
      text: 'Select the model that will evaluate your model\'s outputs. The judge should typically be a capable model that can accurately assess quality. Configure:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Provider', text: 'Choose from OpenAI, Anthropic, Gemini, xAI, Mistral, HuggingFace, or Ollama' },
        { bold: 'Model', text: 'Specify the exact model (e.g., gpt-4, claude-3-opus)' },
        { bold: 'API key', text: 'Required for cloud providers' },
        { bold: 'Temperature', text: 'Controls randomness in judge responses (default: 0.7)' },
        { bold: 'Max tokens', text: 'Maximum response length for evaluations (default: 2048)' },
      ],
    },
    {
      type: 'heading',
      id: 'step-4-metrics',
      level: 3,
      text: 'Step 4: Metrics',
    },
    {
      type: 'paragraph',
      text: 'Select which evaluation metrics to include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Answer relevancy', text: 'Measures how relevant the model\'s answer is to the input prompt' },
        { bold: 'Bias detection', text: 'Detects biased or discriminatory content in responses' },
        { bold: 'Toxicity detection', text: 'Flags toxic or harmful language in outputs' },
        { bold: 'Faithfulness', text: 'Checks if the answer aligns with provided context (important for RAG)' },
        { bold: 'Hallucination detection', text: 'Identifies unsupported or fabricated statements' },
        { bold: 'Contextual relevancy', text: 'Measures whether retrieved/used context is relevant' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'All metrics are enabled by default. Disable metrics that don\'t apply to your use case to speed up evaluations.',
    },
    {
      type: 'heading',
      id: 'experiment-status',
      level: 2,
      text: 'Experiment statuses',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Pending', text: 'Experiment is queued and waiting to start' },
        { bold: 'Running', text: 'Evaluation is in progress—results will appear as they complete' },
        { bold: 'Completed', text: 'All prompts have been evaluated successfully' },
        { bold: 'Failed', text: 'An error occurred during evaluation' },
      ],
    },
    {
      type: 'heading',
      id: 'viewing-results',
      level: 2,
      text: 'Viewing results',
    },
    {
      type: 'paragraph',
      text: 'Click on any experiment to view detailed results. The results page shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overall scores', text: 'Aggregated metric scores across all prompts' },
        { bold: 'Per-prompt breakdown', text: 'Individual scores for each evaluation' },
        { bold: 'Model and judge details', text: 'Configuration used for the experiment' },
        { bold: 'Timestamps', text: 'When the experiment was created and completed' },
      ],
    },
    {
      type: 'heading',
      id: 'performance-tracking',
      level: 2,
      text: 'Performance tracking',
    },
    {
      type: 'paragraph',
      text: 'The Experiments tab includes a performance chart that tracks metric scores across all your evaluation runs. Use this to identify trends, regressions, or improvements as you iterate on your model.',
    },
  ],
};
