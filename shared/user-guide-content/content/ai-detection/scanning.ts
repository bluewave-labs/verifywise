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
      type: 'heading',
      id: 'understanding-results',
      level: 2,
      text: 'Understanding results',
    },
    {
      type: 'paragraph',
      text: 'Scan results are organized into two tabs: **Libraries** for detected AI/ML frameworks, and **Security** for model file vulnerabilities.',
    },
    {
      type: 'heading',
      id: 'libraries-tab',
      level: 3,
      text: 'Libraries tab',
    },
    {
      type: 'paragraph',
      text: 'The Libraries tab displays all detected AI/ML technologies. Each finding shows the library name, provider, confidence level, and number of files where it was found. Click any row to expand and view specific file paths and line numbers.',
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
