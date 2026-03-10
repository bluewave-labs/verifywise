import type { ArticleContent } from '@user-guide-content/contentTypes';

export const aiDetectionSettingsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'AI Detection settings',
    },
    {
      type: 'paragraph',
      text: 'The Settings page has two tabs: **GitHub integration** for configuring repository access tokens, and **Risk scoring** for enabling LLM-enhanced analysis, customizing dimension weights, and configuring vulnerability detection types.',
    },
    {
      type: 'heading',
      id: 'github-integration',
      level: 2,
      text: 'GitHub integration',
    },
    {
      type: 'paragraph',
      text: 'To scan private repositories, you need a GitHub Personal Access Token. Without a token, AI Detection can only scan public repositories.',
    },
    {
      type: 'heading',
      id: 'creating-token',
      level: 3,
      text: 'Creating a token',
    },
    {
      type: 'paragraph',
      text: 'Click the **Create a new token on GitHub** link to open GitHub\'s token creation page with the recommended scopes pre-selected:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'repo', text: 'Full access to private and public repositories. Required for scanning private repos.' },
        { bold: 'public_repo', text: 'Access to public repositories only. Use this if you only need to scan public repos.' },
      ],
    },
    {
      type: 'heading',
      id: 'saving-token',
      level: 3,
      text: 'Saving your token',
    },
    {
      type: 'paragraph',
      text: 'Paste your token into the **Personal access token** field. Optionally give it a descriptive name (e.g., "VerifyWise Scanner Token") to help identify it later. Click **Test token** to verify it works, then **Save token** to store it.',
    },
    {
      type: 'heading',
      id: 'managing-token',
      level: 3,
      text: 'Managing your token',
    },
    {
      type: 'paragraph',
      text: 'Once a token is configured, you\'ll see a status indicator showing it\'s active. You can update the token at any time by entering a new one and clicking **Update token**. To remove the token entirely, click the delete button.',
    },
    {
      type: 'callout',
      text: 'Tokens are stored securely on the server. They are never exposed in the browser after being saved.',
    },
    {
      type: 'heading',
      id: 'risk-scoring',
      level: 2,
      text: 'Risk scoring',
    },
    {
      type: 'paragraph',
      text: 'The Risk scoring tab controls how the AI Governance Risk Score (AGRS) is calculated for your scans.',
    },
    {
      type: 'heading',
      id: 'llm-enhanced-analysis',
      level: 3,
      text: 'LLM-enhanced analysis',
    },
    {
      type: 'paragraph',
      text: 'Toggle **LLM-enhanced analysis** to enable AI-powered scoring. When enabled, the risk scoring engine sends anonymized finding summaries to your configured LLM to produce a narrative analysis, actionable recommendations, and suggested risks.',
    },
    {
      type: 'paragraph',
      text: 'Select which LLM key to use from the dropdown. LLM keys are managed in **Settings → LLM keys** at the organization level. If no keys are configured, the dropdown shows a message directing you to set one up.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Without LLM enhancement, risk scores are calculated using rule-based analysis only. The score is still accurate but does not include narrative summaries, recommendations, or suggested risks.',
    },
    {
      type: 'heading',
      id: 'dimension-weights',
      level: 3,
      text: 'Dimension weights',
    },
    {
      type: 'paragraph',
      text: 'Adjust the sliders to control how much each risk dimension contributes to the overall score. The five dimensions are:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Data sovereignty', text: 'Weight for external data exposure and cloud API usage' },
        { bold: 'Transparency', text: 'Weight for documentation quality and audit readiness' },
        { bold: 'Security', text: 'Weight for vulnerabilities and credential exposure' },
        { bold: 'Autonomy', text: 'Weight for autonomous AI agent detection' },
        { bold: 'Supply chain', text: 'Weight for third-party dependencies and licensing' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The total weight across all dimensions must equal 100%. A validation message appears if the total is too high or too low. Click **Reset to defaults** to restore the original weight distribution. After changing weights, click **Save** and recalculate any existing scores to apply the new weights.',
    },
    {
      type: 'heading',
      id: 'vulnerability-types',
      level: 3,
      text: 'Vulnerability type toggles',
    },
    {
      type: 'paragraph',
      text: 'When LLM-enhanced analysis is enabled, a **Vulnerability detection** section appears with toggles for each of the 10 OWASP LLM Top 10 vulnerability types. Enable or disable individual types based on your organization\'s priorities:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Prompt injection (LLM01)', text: 'Detect untrusted input concatenated into LLM prompts' },
        { bold: 'Insecure output handling (LLM02)', text: 'Detect LLM output passed to dangerous sinks' },
        { bold: 'Training data poisoning (LLM03)', text: 'Detect insecure model deserialization and untrusted sources' },
        { bold: 'Model denial of service (LLM04)', text: 'Detect missing token limits and timeouts' },
        { bold: 'Supply chain (LLM05)', text: 'Detect unpinned versions and untrusted model URLs' },
        { bold: 'Sensitive info disclosure (LLM06)', text: 'Detect PII and credentials passed to LLM context' },
        { bold: 'Insecure plugin design (LLM07)', text: 'Detect tools without input validation or schemas' },
        { bold: 'Excessive agency (LLM08)', text: 'Detect agents with overly broad access and no human oversight' },
        { bold: 'Overreliance (LLM09)', text: 'Detect missing human review and confidence thresholds' },
        { bold: 'Model theft (LLM10)', text: 'Detect exposed model files and unauthenticated endpoints' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Disabled types are skipped during the LLM analysis phase, reducing both scan time and API costs. The regex pre-filter still runs for all types regardless of these settings.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Reducing noise',
      text: 'If certain vulnerability types consistently produce false positives for your codebase, disable them here to focus on the types most relevant to your technology stack.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-detection',
          articleId: 'risk-scoring',
          title: 'Risk scoring',
          description: 'Understanding the AI Governance Risk Score and suggested risks',
        },
        {
          collectionId: 'ai-detection',
          articleId: 'repositories',
          title: 'Repositories',
          description: 'Register and schedule repository scans',
        },
      ],
    },
  ],
};
