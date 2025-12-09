import type { ArticleContent } from '../../contentTypes';

export const llmEvalsOverviewContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'What is LLM Evals?',
    },
    {
      type: 'paragraph',
      text: 'Building an LLM application is one thing—knowing whether it actually works well is another. LLM Evals gives you a systematic way to measure how your models perform before they reach users, and to catch regressions as you iterate on prompts, fine-tune models, or swap providers.',
    },
    {
      type: 'paragraph',
      text: 'Think of it as automated quality assurance for your AI. Instead of manually testing outputs or waiting for user complaints, you can run structured evaluations that check for the things that matter: Is the response relevant? Is it accurate? Does it contain harmful content? Is the model making things up?',
    },
    {
      type: 'heading',
      id: 'how-it-works',
      level: 2,
      text: 'How it works',
    },
    {
      type: 'paragraph',
      text: 'LLM Evals uses what\'s called a **Judge LLM** approach. Here\'s the basic idea: you send prompts to your model, collect its responses, and then have a separate (usually more capable) model evaluate those responses against your criteria.',
    },
    {
      type: 'paragraph',
      text: 'For example, if you\'re building a customer support chatbot, you might have a dataset of 100 common questions with ideal answers. LLM Evals sends each question to your chatbot, then asks GPT-4 or Claude to score how well your chatbot\'s response matches the expected answer, whether it stays on topic, and whether it contains any problematic content.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Why use a judge model? Human evaluation is the gold standard but doesn\'t scale. LLM judges provide consistent, repeatable evaluations that correlate well with human judgment—especially for clear-cut quality signals like relevancy and toxicity.',
    },
    {
      type: 'heading',
      id: 'key-concepts',
      level: 2,
      text: 'Key concepts',
    },
    {
      type: 'paragraph',
      text: 'Before diving in, it helps to understand how the pieces fit together:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Projects', text: 'Your workspace for a specific application or use case. A customer support bot would be one project; an internal knowledge assistant would be another. Each project has its own experiments, datasets, and configuration.' },
        { bold: 'Experiments', text: 'A single evaluation run. Each experiment tests a specific model configuration against a dataset and produces scores. Run experiments whenever you change prompts, switch models, or want to compare approaches.' },
        { bold: 'Datasets', text: 'Collections of test cases—prompts paired with expected outputs or evaluation criteria. Good datasets reflect real usage patterns and cover edge cases your model might struggle with.' },
        { bold: 'Scorers', text: 'The metrics you\'re measuring. Out of the box, you get answer relevancy, bias detection, toxicity detection, faithfulness, hallucination detection, and contextual relevancy. You can also create custom scorers for domain-specific needs.' },
        { bold: 'Judge LLM', text: 'The model that evaluates your model\'s outputs. This is typically a frontier model like GPT-4 or Claude that can reliably assess quality. You configure the judge separately from the model being evaluated.' },
      ],
    },
    {
      type: 'heading',
      id: 'when-to-use',
      level: 2,
      text: 'When to run evaluations',
    },
    {
      type: 'paragraph',
      text: 'Evaluations are most valuable at these moments:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Before launch', text: 'Establish baseline performance and catch issues before users see them' },
        { bold: 'After prompt changes', text: 'Verify that improvements in one area don\'t cause regressions elsewhere' },
        { bold: 'When switching models', text: 'Compare performance across providers or model versions objectively' },
        { bold: 'Periodically in production', text: 'Catch drift or degradation over time as the underlying models update' },
      ],
    },
    {
      type: 'heading',
      id: 'navigation',
      level: 2,
      text: 'Finding your way around',
    },
    {
      type: 'paragraph',
      text: 'Access LLM Evals from the main sidebar. Once inside, you\'ll see a project dropdown at the top and a navigation panel on the left:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overview', text: 'Your project dashboard. See recent experiments, quick stats, and jump into common actions.' },
        { bold: 'Experiments', text: 'The full history of evaluation runs. Track performance over time with the built-in chart, dig into individual results, or start new experiments.' },
        { bold: 'Datasets', text: 'Manage your test cases. Browse built-in datasets, upload your own, or edit existing ones to better match your use cases.' },
        { bold: 'Scorers', text: 'Configure what you\'re measuring. Enable or disable metrics, adjust thresholds, or create custom scorers.' },
        { bold: 'Configuration', text: 'Project-level settings like default models and evaluation preferences.' },
        { bold: 'Organizations', text: 'Manage API keys for different providers. These are stored securely and used when running evaluations.' },
      ],
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Running your first evaluation',
    },
    {
      type: 'paragraph',
      text: 'Ready to try it out? Here\'s the quickest path to your first results:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Create a project', text: '— Click the project dropdown and select "Create new project." Give it a descriptive name like "Customer Support Bot" or "Document Q&A."' },
        { bold: 'Add your API keys', text: '— Go to Organizations and add API keys for the model you\'re testing and the judge model. You\'ll need at least one of each.' },
        { bold: 'Start a new experiment', text: '— Click "New experiment" and follow the wizard. Select your model, pick a built-in dataset to start, choose your judge, and select which metrics to evaluate.' },
        { bold: 'Review results', text: '— Once the experiment completes, click into it to see per-metric scores and drill down into individual test cases.' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Start with a small dataset (10-20 prompts) and the default metrics. Once you understand how the results look, expand to larger datasets and customize the scorers for your specific needs.',
    },
    {
      type: 'heading',
      id: 'next-steps',
      level: 2,
      text: 'What\'s next',
    },
    {
      type: 'paragraph',
      text: 'Once you\'re comfortable with the basics, explore these areas:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Learn how to configure experiments in detail, including model selection and metric customization' },
        { text: 'Upload custom datasets that reflect your actual user queries and expected responses' },
        { text: 'Create custom scorers for domain-specific evaluation criteria' },
        { text: 'Set up regular evaluation runs to track model performance over time' },
      ],
    },
  ],
};
