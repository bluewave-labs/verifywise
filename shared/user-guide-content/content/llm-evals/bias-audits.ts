import type { ArticleContent } from '../../contentTypes';

export const biasAuditsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'What is a bias audit?',
    },
    {
      type: 'paragraph',
      text: 'A bias audit analyzes whether an AI system treats demographic groups fairly. You upload applicant data with demographic categories and outcomes (selected or not), and the system calculates selection rates and impact ratios for each group. If any group\'s selection rate falls below the threshold compared to the most-selected group, it gets flagged.',
    },
    {
      type: 'paragraph',
      text: 'This matters for regulatory compliance. NYC Local Law 144, for example, requires annual independent bias audits for any automated employment decision tool. The EU AI Act and EEOC guidelines have similar expectations. VerifyWise supports 15 compliance frameworks out of the box, each with pre-configured categories, thresholds, and reporting requirements.',
    },
    {
      type: 'heading',
      id: 'accessing',
      level: 2,
      text: 'Accessing bias audits',
    },
    {
      type: 'paragraph',
      text: 'Open the LLM Evals module from the sidebar and click **Bias audits**. You\'ll see a list of all audits for your organization, sortable by date, status, framework, or mode. Running audits update automatically every few seconds.',
    },
    {
      type: 'heading',
      id: 'creating',
      level: 2,
      text: 'Creating a new audit',
    },
    {
      type: 'paragraph',
      text: 'Click **New bias audit** to open the setup wizard. It walks you through four steps.',
    },
    {
      type: 'heading',
      id: 'step-1',
      level: 3,
      text: 'Step 1: Select a compliance framework',
    },
    {
      type: 'paragraph',
      text: 'Pick the law or standard that applies to your situation. Each framework card shows the jurisdiction and a short description of what it requires. Frameworks are grouped by audit mode:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Quantitative audit', text: 'Computes selection rates and impact ratios with statistical flagging. Used by NYC LL144, EEOC guidelines, and California FEHA.' },
        { bold: 'Impact assessment', text: 'Structured assessment with optional quantitative supplement. Used by Colorado SB 205, EU AI Act, and South Korea.' },
        { bold: 'Compliance checklist', text: 'Checklist-based evaluation with recommended quantitative analysis. Used by Illinois HB 3773, New Jersey, Texas TRAIGA, and others.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Selecting a framework auto-fills everything: protected categories, group labels, threshold values, and intersectional analysis settings. You can override any of these in step 4.',
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Not sure which framework applies? If you\'re hiring in New York City using an AI tool, start with NYC LL144. For general US employment, EEOC guidelines is a safe default. The "Custom" preset lets you configure everything from scratch.',
    },
    {
      type: 'heading',
      id: 'step-2',
      level: 3,
      text: 'Step 2: Enter system information',
    },
    {
      type: 'paragraph',
      text: 'Provide details about the AI system being audited. The form adapts based on your framework. For NYC LL144, you\'ll see fields specific to AEDTs (automated employment decision tools). For other frameworks, the labels adjust accordingly.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'System name', text: 'The name of the AI tool or model being audited.' },
        { bold: 'Description', text: 'What the system does and how it\'s used in decision-making.' },
        { bold: 'Distribution date', text: 'When the tool was first deployed or made available.' },
        { bold: 'Data source description', text: 'Where the demographic and outcome data came from.' },
      ],
    },
    {
      type: 'heading',
      id: 'step-3',
      level: 3,
      text: 'Step 3: Upload demographic data',
    },
    {
      type: 'paragraph',
      text: 'Upload a CSV file where each row represents one applicant. The file needs demographic columns and a binary outcome column.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'The wizard shows required columns based on your selected framework. For NYC LL144, you need sex and race/ethnicity columns plus an outcome column. Categories with empty group definitions are marked as optional.',
    },
    {
      type: 'paragraph',
      text: 'After uploading, you\'ll see:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Column mapping', text: 'Dropdowns that map each required demographic category to a column in your CSV. For example, map "Sex" to your CSV\'s "Gender" column.' },
        { bold: 'Outcome column', text: 'Select the column that indicates selection outcomes. Accepted values: 1, true, yes, selected, hired, promoted (and their inverses for non-selection).' },
        { bold: 'Data preview', text: 'A preview of the first five rows so you can confirm the data looks correct before proceeding.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The wizard validates that required categories are mapped, no duplicate mappings exist, and the outcome column isn\'t reused as a demographic column.',
    },
    {
      type: 'heading',
      id: 'step-4',
      level: 3,
      text: 'Step 4: Review and run',
    },
    {
      type: 'paragraph',
      text: 'Review all settings before running the audit. The framework auto-fills these values, but you can adjust them:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Adverse impact threshold', text: 'Groups with an impact ratio below this value are flagged. NYC LL144 and EEOC use 0.80 (the "four-fifths rule").' },
        { bold: 'Small sample exclusion', text: 'Groups representing less than this percentage of total applicants are excluded from impact ratio calculations. Prevents unreliable results from very small groups.' },
        { bold: 'Intersectional analysis', text: 'When enabled, the audit computes cross-tabulated results (e.g., Male + Hispanic, Female + Asian) in addition to per-category results.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click **Run audit** to start. The audit runs in the background and typically completes in a few seconds. You\'ll be redirected to the audit list where the status updates automatically.',
    },
    {
      type: 'heading',
      id: 'results',
      level: 2,
      text: 'Reading audit results',
    },
    {
      type: 'paragraph',
      text: 'Click into a completed audit to see the results. The detail page has three sections: summary cards, a text summary, and the impact ratio tables.',
    },
    {
      type: 'heading',
      id: 'summary-cards',
      level: 3,
      text: 'Summary cards',
    },
    {
      type: 'paragraph',
      text: 'At the top you\'ll see cards for total applicants, total selected, overall selection rate, and number of flags. If rows were excluded due to missing demographic data, an "Unknown" card also appears.',
    },
    {
      type: 'heading',
      id: 'impact-tables',
      level: 3,
      text: 'Impact ratio tables',
    },
    {
      type: 'paragraph',
      text: 'Each demographic category gets its own table. For NYC LL144, you\'ll see separate tables for sex, race/ethnicity, and (if enabled) intersectional categories. Each table shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Group', text: 'The demographic group name (e.g., "Female", "Hispanic or Latino").' },
        { bold: 'Applicants', text: 'Number of applicants in this group.' },
        { bold: 'Selected', text: 'Number selected/hired from this group.' },
        { bold: 'Selection rate', text: 'Percentage of the group that was selected.' },
        { bold: 'Impact ratio', text: 'This group\'s selection rate divided by the highest group\'s selection rate. A value of 1.000 means equal treatment.' },
        { bold: 'Status', text: 'Pass (above threshold), Flag (below threshold), or N/A (excluded due to small sample size).' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Flagged rows are highlighted in red. The table header shows which group had the highest selection rate, since all impact ratios are calculated relative to that group.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'A flag doesn\'t automatically mean discrimination. It means the data shows a statistical disparity that warrants further investigation. The four-fifths rule is a screening tool, not a legal conclusion.',
    },
    {
      type: 'heading',
      id: 'intersectional',
      level: 3,
      text: 'Intersectional results',
    },
    {
      type: 'paragraph',
      text: 'When intersectional analysis is enabled, an additional table shows compound groups like "Male - Hispanic or Latino" or "Female - Asian". This reveals disparities that single-category analysis might miss. For example, a system might treat women and men equally overall, but show significant differences for women of a specific racial group.',
    },
    {
      type: 'heading',
      id: 'actions',
      level: 2,
      text: 'Audit actions',
    },
    {
      type: 'paragraph',
      text: 'From the results page, you can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Download JSON', text: 'Export the full results as a JSON file for external reporting or record-keeping.' },
        { bold: 'Delete', text: 'Permanently remove the audit and all its results. This requires confirmation.' },
      ],
    },
    {
      type: 'heading',
      id: 'frameworks',
      level: 2,
      text: 'Supported frameworks',
    },
    {
      type: 'table',
      columns: [
        { key: 'framework', label: 'Framework', width: '30%' },
        { key: 'jurisdiction', label: 'Jurisdiction', width: '25%' },
        { key: 'mode', label: 'Mode', width: '20%' },
        { key: 'threshold', label: 'Default threshold', width: '25%' },
      ],
      rows: [
        { framework: 'NYC Local Law 144', jurisdiction: 'New York City', mode: 'Quantitative audit', threshold: '0.80' },
        { framework: 'EEOC guidelines', jurisdiction: 'United States', mode: 'Quantitative audit', threshold: '0.80' },
        { framework: 'California FEHA', jurisdiction: 'California', mode: 'Quantitative audit', threshold: '0.80' },
        { framework: 'Colorado SB 205', jurisdiction: 'Colorado', mode: 'Impact assessment', threshold: '0.80' },
        { framework: 'EU AI Act', jurisdiction: 'European Union', mode: 'Impact assessment', threshold: '0.80' },
        { framework: 'South Korea AI Act', jurisdiction: 'South Korea', mode: 'Impact assessment', threshold: '0.80' },
        { framework: 'Illinois HB 3773', jurisdiction: 'Illinois', mode: 'Compliance checklist', threshold: '0.80' },
        { framework: 'New Jersey AI guidance', jurisdiction: 'New Jersey', mode: 'Compliance checklist', threshold: '—' },
        { framework: 'Texas TRAIGA', jurisdiction: 'Texas', mode: 'Compliance checklist', threshold: '—' },
        { framework: 'UK GDPR & Equality Act', jurisdiction: 'United Kingdom', mode: 'Compliance checklist', threshold: '0.80' },
        { framework: 'Singapore WFA', jurisdiction: 'Singapore', mode: 'Compliance checklist', threshold: '—' },
        { framework: 'Brazil Bill 2338', jurisdiction: 'Brazil', mode: 'Compliance checklist', threshold: '—' },
        { framework: 'NIST AI RMF', jurisdiction: 'International', mode: 'Impact assessment', threshold: '0.80' },
        { framework: 'ISO 42001', jurisdiction: 'International', mode: 'Impact assessment', threshold: '0.80' },
        { framework: 'Custom', jurisdiction: '—', mode: 'Quantitative audit', threshold: 'User-defined' },
      ],
    },
    {
      type: 'heading',
      id: 'csv-format',
      level: 2,
      text: 'Preparing your CSV file',
    },
    {
      type: 'paragraph',
      text: 'Your CSV needs at minimum a demographic column and an outcome column. Here\'s what a typical file looks like for an NYC LL144 audit:',
    },
    {
      type: 'code',
      language: 'csv',
      code: 'Gender,Race,Selected\nMale,White,1\nFemale,Hispanic or Latino,0\nMale,Black or African American,1\nFemale,Asian,1\nMale,White,0',
    },
    {
      type: 'paragraph',
      text: 'A few things to keep in mind:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Column names are flexible', text: 'You map them in step 3, so they don\'t need to match the framework\'s category names exactly.' },
        { bold: 'Outcome values', text: 'The outcome column accepts 1/true/yes/selected/hired/promoted as positive outcomes. Everything else (0/false/no/rejected/declined) is treated as not selected.' },
        { bold: 'Missing data', text: 'Rows with empty values in any mapped demographic column are excluded and counted separately as "unknown".' },
        { bold: 'File size', text: 'Maximum 50 MB. Quoted fields with commas are supported (RFC 4180).' },
        { bold: 'Encoding', text: 'UTF-8 is preferred. The parser also handles UTF-8 with BOM, Latin-1, and Windows-1252.' },
      ],
    },
    {
      type: 'heading',
      id: 'understanding-math',
      level: 2,
      text: 'How the math works',
    },
    {
      type: 'paragraph',
      text: 'The core calculation is straightforward. For each demographic group:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: '**Selection rate** = number selected / total applicants in that group' },
        { text: '**Impact ratio** = this group\'s selection rate / highest group\'s selection rate' },
        { text: 'If the impact ratio falls below the threshold (typically 0.80), the group is **flagged**' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The 0.80 threshold is the "four-fifths rule" from the EEOC Uniform Guidelines on Employee Selection Procedures. It means a group\'s selection rate should be at least 80% of the most-selected group\'s rate. A ratio of 0.75 means that group is selected at 75% the rate of the top group, which falls below the threshold.',
    },
    {
      type: 'paragraph',
      text: 'Groups that make up less than the small sample exclusion percentage (default 2%) are excluded from the calculation entirely, since small samples produce unreliable ratios.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        { collectionId: 'llm-evals', articleId: 'llm-evals-overview', title: 'LLM Evals overview', description: 'Introduction to the evaluation platform' },
        { collectionId: 'llm-evals', articleId: 'running-experiments', title: 'Running experiments', description: 'Create evaluation experiments for your models' },
      ],
    },
  ],
};
