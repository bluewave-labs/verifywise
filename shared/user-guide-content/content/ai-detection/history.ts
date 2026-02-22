import type { ArticleContent } from '../../contentTypes';

export const historyContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The scan results page maintains a complete record of all repository scans performed by your organization. Each scan record is preserved indefinitely for audit purposes, providing a defensible trail of AI governance activities.',
    },
    {
      type: 'heading',
      id: 'history-table',
      level: 2,
      text: 'Results table',
    },
    {
      type: 'paragraph',
      text: 'The results table displays all scans with the following information:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Repository', text: 'Owner and name of the scanned repository' },
        { bold: 'Status', text: 'Current state — Completed, Failed, Cancelled, or Scanning' },
        { bold: 'Risk score', text: 'AI Governance Risk Score grade (A–F) and numeric score if calculated' },
        { bold: 'Findings', text: 'Total number of detections including libraries, API calls, secrets, and security issues' },
        { bold: 'Files scanned', text: 'Total source files analyzed' },
        { bold: 'Duration', text: 'Time taken to complete the scan' },
        { bold: 'Triggered by', text: 'User who initiated the scan, or "Scheduled" for automated scans' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click any completed scan row to view its full results, including risk score details, library findings, API calls, detected secrets, and security vulnerabilities.',
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-history.png',
      alt: 'Scan results table showing past repository scans with status and findings',
      caption: 'Complete scan results with repository, status, risk score, findings, and duration',
    },
    {
      type: 'heading',
      id: 'scan-status',
      level: 2,
      text: 'Scan status',
    },
    {
      type: 'paragraph',
      text: 'Each scan has one of the following statuses:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'CheckCircle',
          title: 'Completed',
          description: 'Scan finished successfully. Results are available for review.',
        },
        {
          icon: 'Clock',
          title: 'Scanning',
          description: 'Scan is currently in progress.',
        },
        {
          icon: 'AlertTriangle',
          title: 'Failed',
          description: 'Scan encountered an error. Check error message for details.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'risk-score-column',
      level: 2,
      text: 'Risk score column',
    },
    {
      type: 'paragraph',
      text: 'The risk score column shows the AI Governance Risk Score for each completed scan. A letter grade badge (A through F) appears alongside the numeric score. Scans without a calculated score show a dash. To generate a score, open the scan details page and click **Calculate risk score**.',
    },
    {
      type: 'heading',
      id: 'sorting-filtering',
      level: 2,
      text: 'Sorting, filtering, and search',
    },
    {
      type: 'paragraph',
      text: 'Click any column header to sort the table by that column. Use the filter button to narrow results by status, repository, or triggered-by user. The search box filters results by repository name in real time. The table supports pagination for organizations with extensive scan results.',
    },
    {
      type: 'heading',
      id: 'managing-history',
      level: 2,
      text: 'Managing scan results',
    },
    {
      type: 'paragraph',
      text: 'You can delete individual scan records by clicking the trash icon in the actions column. Deletion is permanent and removes all associated findings. Consider exporting or documenting important results before deletion.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Audit trail',
      text: 'For compliance purposes, maintain scan results as evidence of ongoing AI governance activities. Regular scanning demonstrates due diligence in monitoring AI usage.',
    },
    {
      type: 'heading',
      id: 'rescanning',
      level: 2,
      text: 'Rescanning repositories',
    },
    {
      type: 'paragraph',
      text: 'To rescan a previously analyzed repository, navigate to the scan results page and click **Rescan**. This creates a new scan record while preserving the original for comparison. Alternatively, start a new scan from the Scan page with the same repository URL, or configure a scheduled scan from the Repositories page.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Regular rescanning helps identify newly added AI dependencies. Consider configuring scheduled scans in the Repositories page for critical repositories.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-detection',
          articleId: 'scanning',
          title: 'Scanning repositories',
          description: 'How to scan repositories for AI/ML usage',
        },
        {
          collectionId: 'ai-detection',
          articleId: 'risk-scoring',
          title: 'Risk scoring',
          description: 'Understanding the AI Governance Risk Score',
        },
        {
          collectionId: 'ai-detection',
          articleId: 'repositories',
          title: 'Repositories',
          description: 'Register and schedule repository scans',
        },
        {
          collectionId: 'reporting',
          articleId: 'generating-reports',
          title: 'Generating reports',
          description: 'Include AI Detection findings in compliance reports',
        },
      ],
    },
  ],
};
