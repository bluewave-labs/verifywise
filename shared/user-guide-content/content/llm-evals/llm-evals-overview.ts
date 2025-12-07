import type { ArticleContent } from '../../contentTypes';

export const llmEvalsOverviewContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'LLM Evals is a comprehensive evaluation platform for benchmarking and assessing the quality, safety, and performance of your large language model applications. Whether you\'re building chatbots, RAG systems, or AI agents, LLM Evals helps you systematically measure how well your models perform against defined criteria.',
    },
    {
      type: 'paragraph',
      text: 'The evaluation system uses a **Judge LLM** approach—a separate, typically more capable model that assesses your model\'s outputs against expected results, checking for relevancy, accuracy, bias, toxicity, and hallucinations.',
    },
    {
      type: 'heading',
      id: 'key-concepts',
      level: 2,
      text: 'Key concepts',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Projects', text: 'Containers for organizing related evaluations. Each project can have multiple experiments, datasets, and scorers.' },
        { bold: 'Experiments', text: 'Individual evaluation runs that test your model against a dataset using specific metrics.' },
        { bold: 'Datasets', text: 'Collections of prompts with expected outputs used to evaluate your model.' },
        { bold: 'Scorers', text: 'Configurable metrics that measure specific aspects of model performance.' },
        { bold: 'Judge LLM', text: 'The model used to evaluate outputs—typically a capable model like GPT-4 or Claude.' },
      ],
    },
    {
      type: 'heading',
      id: 'navigation',
      level: 2,
      text: 'Navigating LLM Evals',
    },
    {
      type: 'paragraph',
      text: 'Access LLM Evals from the main sidebar. The interface includes a project selector and sidebar navigation with the following tabs:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overview', text: 'Dashboard showing recent experiments and project status' },
        { bold: 'Experiments', text: 'List and manage all evaluation runs with performance tracking' },
        { bold: 'Datasets', text: 'Browse, upload, and manage evaluation datasets' },
        { bold: 'Scorers', text: 'Configure evaluation metrics and thresholds' },
        { bold: 'Configuration', text: 'Project-specific settings' },
        { bold: 'Organizations', text: 'Manage organization-level settings and API keys' },
      ],
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Getting started',
    },
    {
      type: 'paragraph',
      text: 'To run your first evaluation:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Create a project', text: '— Click the project dropdown and select "Create new project"' },
        { bold: 'Configure your model', text: '— Select the model provider and enter API credentials' },
        { bold: 'Choose a dataset', text: '— Use built-in datasets or upload your own' },
        { bold: 'Run an experiment', text: '— Click "New experiment" and follow the wizard' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Start with built-in datasets to quickly understand how the evaluation system works before creating custom datasets.',
    },
  ],
};
