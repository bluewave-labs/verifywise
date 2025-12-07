import type { ArticleContent } from '../../contentTypes';

export const managingDatasetsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Datasets are collections of prompts and expected outputs used to evaluate your LLM applications. LLM Evals provides both built-in datasets for common use cases and the ability to upload custom datasets tailored to your specific needs.',
    },
    {
      type: 'heading',
      id: 'dataset-types',
      level: 2,
      text: 'Dataset types',
    },
    {
      type: 'heading',
      id: 'builtin-datasets',
      level: 3,
      text: 'Built-in datasets',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise maintains curated datasets organized by use case:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Chatbot', text: 'Prompts for testing conversational AI systems, available in single-turn and multi-turn formats' },
        { bold: 'RAG', text: 'Prompts with retrieval context for evaluating retrieval-augmented generation systems' },
        { bold: 'Agent', text: 'Prompts for testing AI agents and tool-using systems' },
        { bold: 'Safety', text: 'Prompts designed to test model safety and guardrails' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Click "Browse datasets" to explore all available built-in datasets. You can view prompts before using them in an experiment.',
    },
    {
      type: 'heading',
      id: 'custom-datasets',
      level: 3,
      text: 'Custom datasets',
    },
    {
      type: 'paragraph',
      text: 'Upload your own datasets to evaluate domain-specific scenarios. Custom datasets appear with a "Custom" badge and are stored in your project.',
    },
    {
      type: 'heading',
      id: 'uploading-datasets',
      level: 2,
      text: 'Uploading a dataset',
    },
    {
      type: 'paragraph',
      text: 'Click **Upload dataset** to upload a JSON file. Your file must follow this structure:',
    },
    {
      type: 'code',
      language: 'json',
      code: `[
  {
    "id": "unique_id",
    "category": "category_name",
    "prompt": "The question or prompt",
    "expected_output": "Expected response",
    "expected_keywords": ["optional", "keywords"],
    "difficulty": "easy|medium|hard",
    "retrieval_context": ["optional", "for RAG"]
  }
]`,
    },
    {
      type: 'heading',
      id: 'field-descriptions',
      level: 3,
      text: 'Field descriptions',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'id', text: '(required) Unique identifier for the test case' },
        { bold: 'category', text: '(required) Category or topic of the test (e.g., "coding", "reasoning")' },
        { bold: 'prompt', text: '(required) The input question or prompt to send to the model' },
        { bold: 'expected_output', text: '(required) The expected model response for comparison' },
        { bold: 'expected_keywords', text: '(optional) Keywords that should appear in the response' },
        { bold: 'difficulty', text: '(optional) Difficulty level: easy, medium, or hard' },
        { bold: 'retrieval_context', text: '(optional) Context documents for RAG evaluations' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You can download an example dataset from the upload modal to see the expected format.',
    },
    {
      type: 'heading',
      id: 'managing-datasets',
      level: 2,
      text: 'Managing datasets',
    },
    {
      type: 'paragraph',
      text: 'From the Datasets tab, you can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'View prompts', text: 'Click any dataset to open a drawer showing all prompts' },
        { bold: 'Open in editor', text: 'Edit prompts and save as a new custom dataset' },
        { bold: 'Remove dataset', text: 'Delete custom datasets you no longer need' },
        { bold: 'Filter and search', text: 'Find datasets by name or use case' },
      ],
    },
    {
      type: 'heading',
      id: 'editing-datasets',
      level: 2,
      text: 'Editing datasets',
    },
    {
      type: 'paragraph',
      text: 'The inline editor allows you to modify any dataset:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Open the editor', text: '— Click the action menu on a dataset and select "Open in editor"' },
        { bold: 'Edit prompts', text: '— Click any row to modify the prompt, expected output, category, difficulty, or keywords' },
        { bold: 'Save as copy', text: '— Enter a name and click "Save copy" to create a new custom dataset' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Editing creates a copy of the dataset—built-in datasets cannot be modified directly.',
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Representative prompts', text: 'Include prompts that reflect real user interactions with your model' },
        { bold: 'Clear expected outputs', text: 'Write specific expected responses to enable accurate evaluation' },
        { bold: 'Diverse categories', text: 'Cover different topics and difficulty levels for comprehensive testing' },
        { bold: 'Edge cases', text: 'Include challenging prompts that test model limitations' },
        { bold: 'Regular updates', text: 'Update datasets as you discover new failure modes or use cases' },
      ],
    },
  ],
};
