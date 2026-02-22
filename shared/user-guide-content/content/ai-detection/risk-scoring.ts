import type { ArticleContent } from '../../contentTypes';

export const riskScoringContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The AI Governance Risk Score (AGRS) evaluates scan findings across multiple risk dimensions to produce a single numeric score (0–100) and letter grade (A–F). The score helps your team quickly assess the governance risk posture of a scanned repository.',
    },
    {
      type: 'paragraph',
      text: 'Risk scores appear on the scan details page after a scan completes. You can calculate the score manually or enable LLM-enhanced analysis for deeper insights including narrative summaries, recommendations, and suggested risks.',
    },
    {
      type: 'heading',
      id: 'score-cards',
      level: 2,
      text: 'Score cards',
    },
    {
      type: 'paragraph',
      text: 'Once calculated, four cards display across the top of the scan details page:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overall score', text: 'Numeric score from 0 to 100 with a risk level label — Low risk (80+), Moderate risk (60–79), or High risk (below 60)' },
        { bold: 'Grade', text: 'Letter grade from A (Excellent) to F (Critical) with the calculation timestamp' },
        { bold: 'Dimensions at risk', text: 'Count of dimensions scoring below the 70-point threshold' },
        { bold: 'Dimension breakdown', text: 'Horizontal progress bars showing the score for each risk dimension' },
      ],
    },
    {
      type: 'heading',
      id: 'risk-dimensions',
      level: 2,
      text: 'Risk dimensions',
    },
    {
      type: 'paragraph',
      text: 'The overall score is composed of five weighted dimensions. Each dimension starts at 100 and receives penalties based on the types of findings detected:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Data sovereignty', text: 'Penalized when data is sent to external cloud APIs. High-risk library imports, API calls to external providers, and hardcoded secrets contribute to penalties.' },
        { bold: 'Transparency', text: 'Penalized when AI usage is poorly documented or hard to audit. Undocumented model references, missing licenses, and low-confidence findings increase risk.' },
        { bold: 'Security', text: 'Penalized by model file vulnerabilities, hardcoded credentials, and critical security findings. Severity levels (Critical, High, Medium, Low) determine penalty weights.' },
        { bold: 'Autonomy', text: 'Penalized when autonomous AI agents are detected. Agent frameworks, MCP servers, and tool-using agents increase this dimension\'s risk.' },
        { bold: 'Supply chain', text: 'Penalized by external dependencies and third-party AI components. Libraries with restrictive licenses, numerous external providers, and RAG components contribute.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Hover over any dimension bar in the breakdown card to see the top contributors to that dimension\'s penalties.',
    },
    {
      type: 'heading',
      id: 'grades',
      level: 2,
      text: 'Grade scale',
    },
    {
      type: 'table',
      columns: [
        { key: 'grade', label: 'Grade', width: '80px' },
        { key: 'range', label: 'Score range', width: '120px' },
        { key: 'label', label: 'Label' },
      ],
      rows: [
        { grade: 'A', range: '90–100', label: 'Excellent — minimal governance risk' },
        { grade: 'B', range: '75–89', label: 'Good — low governance risk' },
        { grade: 'C', range: '60–74', label: 'Moderate — some areas need attention' },
        { grade: 'D', range: '40–59', label: 'Poor — significant governance gaps' },
        { grade: 'F', range: '0–39', label: 'Critical — immediate action required' },
      ],
    },
    {
      type: 'heading',
      id: 'calculating',
      level: 2,
      text: 'Calculating the score',
    },
    {
      type: 'paragraph',
      text: 'On the scan details page, click **Calculate risk score** (or **Recalculate score** if a score already exists) to generate the AGRS. A progress dialog shows each step of the calculation process. The score is stored with the scan and displayed on future visits.',
    },
    {
      type: 'paragraph',
      text: 'You can recalculate at any time — for example, after enabling LLM analysis in settings or after adjusting dimension weights. The previous score is replaced with the new calculation.',
    },
    {
      type: 'heading',
      id: 'llm-analysis',
      level: 2,
      text: 'LLM-enhanced analysis',
    },
    {
      type: 'paragraph',
      text: 'When enabled in **AI Detection → Settings → Risk scoring**, the scoring engine sends anonymized finding summaries to your configured LLM for deeper analysis. The LLM provides:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Narrative summary', text: 'A written analysis of the repository\'s risk posture, highlighting key areas of concern with important findings in bold' },
        { bold: 'Recommendations', text: 'Actionable steps to improve the governance score' },
        { bold: 'Dimension adjustments', text: 'Fine-tuned score adjustments based on contextual analysis that rule-based scoring alone may miss' },
        { bold: 'Suggested risks', text: 'Structured risk suggestions that can be added to your risk register' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The AI analysis section appears below the score cards as a collapsible panel. Click the chevron to expand or collapse it.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'LLM analysis requires an LLM key to be configured in **Settings → LLM keys**. The analysis uses your organization\'s own API key and no scan data is stored by the LLM provider.',
    },
    {
      type: 'heading',
      id: 'suggested-risks',
      level: 2,
      text: 'Suggested risks',
    },
    {
      type: 'paragraph',
      text: 'When LLM analysis is enabled, the system may suggest concrete risks based on the scan findings. These appear in a collapsible "Suggested risks" section below the AI analysis.',
    },
    {
      type: 'paragraph',
      text: 'Each suggestion includes:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Risk name', text: 'A concise title describing the risk' },
        { bold: 'Risk dimension', text: 'Which AGRS dimension this risk relates to' },
        { bold: 'Risk level', text: 'Likelihood and severity assessment' },
        { bold: 'Description', text: 'Explanation of the risk and its potential impact' },
        { bold: 'Risk categories', text: 'Classification tags (e.g., Cybersecurity risk, Compliance risk)' },
      ],
    },
    {
      type: 'heading',
      id: 'adding-to-register',
      level: 3,
      text: 'Adding a suggestion to the risk register',
    },
    {
      type: 'paragraph',
      text: 'Click **Add to risk register** on any suggestion to open the risk creation form with pre-filled values. The form includes the suggested risk name, description, category, lifecycle phase, likelihood, severity, impact, and mitigation plan. Review and adjust the values as needed, then save to add the risk to your organization\'s risk register.',
    },
    {
      type: 'paragraph',
      text: 'The review notes field is automatically populated with a reference to the scan and the specific findings that prompted the suggestion.',
    },
    {
      type: 'heading',
      id: 'dismissing-suggestions',
      level: 3,
      text: 'Dismissing suggestions',
    },
    {
      type: 'paragraph',
      text: 'Click **Ignore** on a suggestion to dismiss it. You can choose a reason — "Not relevant" or "Already mitigated" — from the dropdown menu. Dismissed suggestions are hidden from the current view but do not affect the underlying score.',
    },
    {
      type: 'heading',
      id: 'dimension-weights',
      level: 2,
      text: 'Customizing dimension weights',
    },
    {
      type: 'paragraph',
      text: 'Navigate to **AI Detection → Settings → Risk scoring** to adjust how much each dimension contributes to the overall score. Use the sliders to increase or decrease the weight of each dimension. The total weight across all dimensions must equal 100%. Click **Save** to apply your changes, then recalculate existing scores to reflect the new weights.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Weight customization',
      text: 'Adjust weights to match your organization\'s priorities. For example, increase the Security weight if your primary concern is vulnerability management, or increase Data sovereignty if data residency is a regulatory requirement.',
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
          articleId: 'settings',
          title: 'AI Detection settings',
          description: 'Configure LLM analysis and dimension weights',
        },
        {
          collectionId: 'risk-management',
          articleId: 'risk-assessment',
          title: 'Conducting risk assessments',
          description: 'Learn about the risk register and risk management workflow',
        },
      ],
    },
  ],
};
