import type { ArticleContent } from '../../contentTypes';

export const aiTrustCenterContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The AI Trust Center is your public-facing transparency portal for AI governance. It allows you to share information about your AI practices, policies, and commitments with customers, partners, regulators, and other stakeholders.',
    },
    {
      type: 'paragraph',
      text: 'In an era of increasing AI regulation and public scrutiny, demonstrating responsible AI practices builds trust and differentiates your organization. The Trust Center makes it easy to communicate your AI governance story.',
    },
    {
      type: 'heading',
      id: 'why-trust-center',
      level: 2,
      text: 'Why use an AI Trust Center?',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Build customer trust', text: 'Demonstrate your commitment to responsible AI through transparency' },
        { bold: 'Regulatory compliance', text: 'Meet disclosure requirements under the EU AI Act and other regulations' },
        { bold: 'Competitive advantage', text: 'Differentiate from competitors by showcasing governance maturity' },
        { bold: 'Streamline inquiries', text: 'Reduce repetitive questions by publishing information publicly' },
      ],
    },
    {
      type: 'heading',
      id: 'accessing-trust-center',
      level: 2,
      text: 'Accessing the AI Trust Center',
    },
    {
      type: 'paragraph',
      text: 'Navigate to **AI Trust Center** from the main sidebar to configure your public transparency portal. You can customize what information to display and generate a shareable link for external stakeholders.',
    },
    {
      type: 'heading',
      id: 'content-sections',
      level: 2,
      text: 'Content sections',
    },
    {
      type: 'paragraph',
      text: 'The AI Trust Center can include the following sections:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'AI principles', text: 'Your organization\'s guiding principles for AI development and deployment' },
        { bold: 'Governance framework', text: 'Overview of your AI governance structure and processes' },
        { bold: 'Model inventory', text: 'Public-facing information about AI models you use or develop' },
        { bold: 'Compliance certifications', text: 'Certifications and standards you adhere to (ISO 42001, etc.)' },
        { bold: 'Contact information', text: 'How stakeholders can reach your AI governance team' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You control exactly what information appears in your Trust Center. Sensitive or internal-only data is never exposed without explicit configuration.',
    },
    {
      type: 'heading',
      id: 'customization',
      level: 2,
      text: 'Customization options',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Branding', text: 'Add your logo and customize colors to match your brand' },
        { bold: 'Content selection', text: 'Choose which sections and data points to include' },
        { bold: 'Access controls', text: 'Make the portal public or require authentication' },
        { bold: 'Custom domain', text: 'Host on your own domain for seamless integration' },
      ],
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
        { bold: 'Keep it current', text: 'Regularly update your Trust Center to reflect current practices' },
        { bold: 'Be authentic', text: 'Share genuine commitments and progress, not just marketing' },
        { bold: 'Link from your website', text: 'Make the Trust Center easily discoverable from your main site' },
        { bold: 'Respond to feedback', text: 'Monitor for stakeholder questions and update content accordingly' },
      ],
    },
  ],
};
