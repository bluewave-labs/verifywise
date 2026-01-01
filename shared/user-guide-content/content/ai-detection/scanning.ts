import type { ArticleContent } from '../../contentTypes';

export const scanningContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'AI Detection scans GitHub repositories to identify AI and machine learning libraries in your codebase. It helps organizations discover "shadow AI" — AI usage that may not be formally documented or approved — and supports compliance efforts by maintaining an inventory of AI technologies.',
    },
    {
      type: 'paragraph',
      text: 'The scanner analyzes source files, dependency manifests, and model files to detect over 50 AI/ML frameworks including OpenAI, TensorFlow, PyTorch, LangChain, and more. Results are stored for audit purposes and can be reviewed at any time from the scan history.',
    },
    {
      type: 'heading',
      id: 'starting-scan',
      level: 2,
      text: 'Starting a scan',
    },
    {
      type: 'paragraph',
      text: 'To scan a repository, enter the GitHub URL in the input field. You can use either the full URL format (`https://github.com/owner/repo`) or the short format (`owner/repo`). Click **Scan** to begin the analysis.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'By default, only public repositories can be scanned. To scan private repositories, configure a GitHub Personal Access Token in **AI Detection → Settings**.',
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-scan-page.png',
      alt: 'AI Detection scan page with repository URL input field',
      caption: 'Enter a GitHub repository URL to start scanning',
    },
    {
      type: 'heading',
      id: 'scan-progress',
      level: 2,
      text: 'Scan progress',
    },
    {
      type: 'paragraph',
      text: 'Once initiated, the scan proceeds through several stages. A progress indicator shows real-time status including the current file being analyzed, total files processed, and findings discovered.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Cloning', text: 'Downloads the repository to a temporary cache' },
        { bold: 'Scanning', text: 'Analyzes files for AI/ML patterns and security issues' },
        { bold: 'Completed', text: 'Results are ready for review' },
      ],
    },
    {
      type: 'paragraph',
      text: 'You can cancel an in-progress scan at any time by clicking **Cancel**. The partial results are discarded and the scan is marked as cancelled in the history.',
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-scan-progress.png',
      alt: 'Scan progress indicator showing files being analyzed',
      caption: 'Real-time progress shows current file, total processed, and findings discovered',
    },
    {
      type: 'heading',
      id: 'statistics-dashboard',
      level: 2,
      text: 'Statistics dashboard',
    },
    {
      type: 'paragraph',
      text: 'The scan page displays key statistics about your AI Detection activity. These cards provide a quick overview of your scanning efforts and findings.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Total scans', text: 'Number of scans performed, with a count of completed scans' },
        { bold: 'Repositories', text: 'Unique repositories that have been scanned' },
        { bold: 'Total findings', text: 'Combined count of all AI/ML detections across all scans' },
        { bold: 'Libraries', text: 'AI/ML library imports and dependencies detected' },
        { bold: 'API calls', text: 'Direct API calls to AI providers (OpenAI, Anthropic, etc.)' },
        { bold: 'Security issues', text: 'Hardcoded secrets and model file vulnerabilities combined' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Statistics are only displayed after you have completed at least one scan. The dashboard automatically updates as new scans are completed.',
    },
    {
      type: 'heading',
      id: 'understanding-results',
      level: 2,
      text: 'Understanding results',
    },
    {
      type: 'paragraph',
      text: 'Scan results are organized into four tabs: **Libraries** for detected AI/ML frameworks, **API Calls** for direct provider integrations, **Secrets** for hardcoded credentials, and **Security** for model file vulnerabilities.',
    },
    {
      type: 'heading',
      id: 'libraries-tab',
      level: 3,
      text: 'Libraries tab',
    },
    {
      type: 'paragraph',
      text: 'The Libraries tab displays all detected AI/ML technologies. Each finding shows the library name, provider, risk level, confidence level, and number of files where it was found. Click any row to expand and view specific file paths and line numbers.',
    },
    {
      type: 'paragraph',
      text: 'Risk levels indicate the potential data exposure:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'High risk', text: 'Data sent to external cloud APIs. Risk of data leakage, vendor lock-in, and compliance violations.' },
        { bold: 'Medium risk', text: 'Framework that can connect to cloud APIs depending on configuration. Review usage to assess actual risk.' },
        { bold: 'Low risk', text: 'Local processing only. Data stays on your infrastructure with minimal external exposure.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Confidence levels indicate detection certainty:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'High', text: 'Direct, unambiguous match such as explicit imports or dependency declarations' },
        { bold: 'Medium', text: 'Likely match with some ambiguity, such as generic utility imports' },
        { bold: 'Low', text: 'Possible match requiring manual verification' },
      ],
    },
    {
      type: 'heading',
      id: 'governance-status',
      level: 3,
      text: 'Governance status',
    },
    {
      type: 'paragraph',
      text: 'Each library finding can be assigned a governance status to track review progress. Click the status icon on any finding row to set or change its status:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Reviewed', text: 'Finding has been examined but no decision made yet' },
        { bold: 'Approved', text: 'Usage is authorized and compliant with organization policies' },
        { bold: 'Flagged', text: 'Requires attention or is not approved for use' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-libraries-tab.png',
      alt: 'Libraries tab showing detected AI/ML frameworks with risk and confidence levels',
      caption: 'Detected AI/ML libraries with provider, risk level, confidence, and governance status',
    },
    {
      type: 'heading',
      id: 'api-calls-tab',
      level: 3,
      text: 'API Calls tab',
    },
    {
      type: 'paragraph',
      text: 'The API Calls tab shows direct integrations with AI provider APIs detected in your codebase. These represent active usage of AI models and services, such as calls to OpenAI, Anthropic, Google AI, and other providers.',
    },
    {
      type: 'paragraph',
      text: 'API call findings include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'REST API endpoints', text: 'Direct HTTP calls to AI provider APIs (e.g., api.openai.com)' },
        { bold: 'SDK method calls', text: 'Usage of official SDKs (e.g., openai.chat.completions.create())' },
        { bold: 'Framework integrations', text: 'LangChain, LlamaIndex, and other framework API calls' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'All API call findings are marked as high confidence since they indicate direct integration with AI services.',
    },
    {
      type: 'heading',
      id: 'secrets-tab',
      level: 3,
      text: 'Secrets tab',
    },
    {
      type: 'paragraph',
      text: 'The Secrets tab identifies hardcoded API keys and credentials in your codebase. These should be moved to environment variables or a secrets manager to prevent accidental exposure.',
    },
    {
      type: 'paragraph',
      text: 'The scanner detects common AI provider API key patterns:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'OpenAI API keys', text: 'Keys starting with sk-...' },
        { bold: 'Anthropic API keys', text: 'Keys starting with sk-ant-...' },
        { bold: 'Google AI API keys', text: 'Keys starting with AIza...' },
        { bold: 'Other provider keys', text: 'AWS, Azure, Cohere, and other AI service credentials' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Security risk',
      text: 'Hardcoded secrets in source code can be exposed if the repository is made public or accessed by unauthorized users. Rotate any exposed credentials immediately.',
    },
    {
      type: 'heading',
      id: 'security-tab',
      level: 3,
      text: 'Security tab',
    },
    {
      type: 'paragraph',
      text: 'The Security tab shows findings from model file analysis. Serialized model files (`.pkl`, `.pt`, `.h5`) can contain malicious code that executes when loaded. The scanner detects dangerous patterns such as system command execution, network access, and code injection.',
    },
    {
      type: 'paragraph',
      text: 'Security findings include severity levels and compliance references:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Critical', text: 'Direct code execution risk — immediate investigation required' },
        { bold: 'High', text: 'Indirect execution or data exfiltration risk' },
        { bold: 'Medium', text: 'Potentially dangerous depending on context' },
        { bold: 'Low', text: 'Informational or minimal risk' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Security risk',
      text: 'Model files flagged with Critical severity should not be loaded until verified. Malicious models can execute arbitrary code on your system when loaded with standard ML frameworks.',
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-security-tab.png',
      alt: 'Security tab showing model file vulnerabilities with severity levels',
      caption: 'Security findings with severity, CWE references, and OWASP ML Top 10 mappings',
    },
    {
      type: 'heading',
      id: 'compliance-references',
      level: 2,
      text: 'Compliance references',
    },
    {
      type: 'paragraph',
      text: 'Security findings include industry-standard references to help with compliance reporting:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'CWE', text: 'Common Weakness Enumeration — industry standard for software security weaknesses (e.g., CWE-502 for deserialization vulnerabilities)' },
        { bold: 'OWASP ML Top 10', text: 'OWASP Machine Learning Security Top 10 — identifies critical security risks in ML systems (e.g., ML06 for AI Supply Chain Attacks)' },
      ],
    },
    {
      type: 'heading',
      id: 'private-repositories',
      level: 2,
      text: 'Scanning private repositories',
    },
    {
      type: 'paragraph',
      text: 'To scan private repositories, you must configure a GitHub Personal Access Token (PAT) with the `repo` scope. Navigate to **AI Detection → Settings** to add your token. The token is encrypted at rest and used only for git clone operations.',
    },
    {
      type: 'paragraph',
      text: 'For instructions on creating a GitHub PAT, see the official GitHub documentation at `https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token`.',
    },
    {
      type: 'image',
      src: '/images/user-guide/ai-detection-settings.png',
      alt: 'AI Detection settings page with GitHub token configuration',
      caption: 'Configure GitHub Personal Access Token for private repository scanning',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-detection',
          articleId: 'history',
          title: 'Scan history',
          description: 'View and manage past scan results',
        },
        {
          collectionId: 'compliance',
          articleId: 'eu-ai-act',
          title: 'EU AI Act compliance',
          description: 'How AI Detection supports regulatory requirements',
        },
      ],
    },
  ],
};
