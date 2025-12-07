import type { ArticleContent } from '../../contentTypes';

export const configuringScorersContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Scorers are evaluation metrics that measure specific aspects of your model\'s outputs. LLM Evals supports three types of scorers: LLM-based metrics that use a judge model, built-in metrics with predefined logic, and custom scorers for specialized evaluations.',
    },
    {
      type: 'heading',
      id: 'accessing-scorers',
      level: 2,
      text: 'Accessing scorers',
    },
    {
      type: 'paragraph',
      text: 'Navigate to the **Scorers** tab within your project. The table displays all configured scorers with their name, judge model, type, metric key, and status.',
    },
    {
      type: 'heading',
      id: 'scorer-types',
      level: 2,
      text: 'Scorer types',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'LLM', text: 'Uses a judge LLM to evaluate outputs. Flexible and can assess nuanced qualities like relevancy and coherence.' },
        { bold: 'Builtin', text: 'Pre-defined metrics with fixed logic. Fast and consistent but less flexible.' },
        { bold: 'Custom', text: 'User-defined scoring logic for specialized evaluation needs.' },
      ],
    },
    {
      type: 'heading',
      id: 'default-metrics',
      level: 2,
      text: 'Default metrics',
    },
    {
      type: 'paragraph',
      text: 'LLM Evals includes these built-in evaluation metrics:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Answer relevancy', text: 'Evaluates whether the response directly addresses the prompt. Scores range from 0 (irrelevant) to 1 (highly relevant).' },
        { bold: 'Bias detection', text: 'Identifies biased, discriminatory, or unfair content in model outputs. Flags gender, racial, political, or other forms of bias.' },
        { bold: 'Toxicity detection', text: 'Detects harmful, offensive, or inappropriate language. Essential for safety-critical applications.' },
        { bold: 'Faithfulness', text: 'Measures whether the response accurately reflects provided context. Critical for RAG systems to prevent misrepresentation.' },
        { bold: 'Hallucination detection', text: 'Identifies fabricated facts, unsupported claims, or made-up information. Key metric for factual accuracy.' },
        { bold: 'Contextual relevancy', text: 'Assesses whether the model uses relevant context effectively. Important for RAG and context-aware applications.' },
      ],
    },
    {
      type: 'heading',
      id: 'creating-scorers',
      level: 2,
      text: 'Creating a new scorer',
    },
    {
      type: 'paragraph',
      text: 'Click **New scorer** and configure:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Name', text: '— A descriptive name for the scorer' },
        { bold: 'Metric key', text: '— Unique identifier used in API responses (e.g., answer_correctness)' },
        { bold: 'Description', text: '— Optional explanation of what this scorer evaluates' },
        { bold: 'Type', text: '— LLM, builtin, or custom' },
        { bold: 'Judge model', text: '— For LLM scorers, the model used for evaluation (e.g., gpt-4o-mini)' },
        { bold: 'Default threshold', text: '— Minimum score to pass (e.g., 0.7 means 70%)' },
        { bold: 'Weight', text: '— Relative importance when aggregating scores (default: 1.0)' },
      ],
    },
    {
      type: 'heading',
      id: 'editing-scorers',
      level: 2,
      text: 'Editing scorers',
    },
    {
      type: 'paragraph',
      text: 'Click any scorer row to open the edit modal, or click the gear icon for additional options:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Edit', text: 'Modify scorer configuration' },
        { bold: 'Delete', text: 'Remove the scorer from your project' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Deleting a scorer does not affect past experiment results, but the scorer will not be available for future experiments.',
    },
    {
      type: 'heading',
      id: 'scorer-status',
      level: 2,
      text: 'Scorer status',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Enabled', text: 'Scorer is active and will be used in new experiments' },
        { bold: 'Disabled', text: 'Scorer is inactive and will be skipped during evaluation' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Toggle status by editing the scorer and changing the enabled setting.',
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
        { bold: 'Appropriate thresholds', text: 'Set thresholds based on your quality requirements. Start with 0.5-0.7 and adjust based on results.' },
        { bold: 'Weighted scoring', text: 'Assign higher weights to metrics that matter most for your use case.' },
        { bold: 'Consistent judge models', text: 'Use the same judge model across experiments for comparable results.' },
        { bold: 'Regular calibration', text: 'Periodically review scores manually to ensure the judge model is evaluating correctly.' },
      ],
    },
  ],
};
