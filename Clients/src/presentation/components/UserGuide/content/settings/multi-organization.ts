import type { ArticleContent } from '../../contentTypes';

export const multiOrganizationContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports multi-organization deployments for enterprises that need to manage AI governance across separate business units, subsidiaries, or client organizations. Each organization operates independently with its own data, users, and configuration while sharing the same VerifyWise infrastructure.',
    },
    {
      type: 'paragraph',
      text: 'Multi-organization architecture is useful when you need strict data separation between entities. Each organization has isolated data stores, meaning users in one organization cannot see or access data from another organization.',
    },
    {
      type: 'heading',
      id: 'when-to-use',
      level: 2,
      text: 'When to use multiple organizations',
    },
    {
      type: 'paragraph',
      text: 'Consider separate organizations when:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Regulatory separation', text: 'Different business units operate under different regulatory jurisdictions and need isolated compliance programs' },
        { bold: 'Client services', text: 'You provide AI governance services to multiple clients who should not see each other\'s data' },
        { bold: 'Acquisition integration', text: 'Newly acquired companies need their own governance space before integration' },
        { bold: 'Data residency', text: 'Legal requirements mandate that certain data remains isolated' },
        { bold: 'Independent operations', text: 'Business units operate autonomously with separate governance teams' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'If your business units share governance resources and need visibility across the portfolio, you may be better served by a single organization with multiple projects. Use separate organizations only when true data isolation is required.',
    },
    {
      type: 'heading',
      id: 'how-it-works',
      level: 2,
      text: 'How multi-organization works',
    },
    {
      type: 'paragraph',
      text: 'Each organization in VerifyWise operates within an isolated data environment. When you create an organization, VerifyWise provisions a dedicated database schema for that organization, ensuring complete data separation while maintaining efficient resource usage.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Schema-level isolation', text: 'Each organization has its own database schema containing all governance data' },
        { bold: 'Separate user base', text: 'Users belong to one organization and cannot access others' },
        { bold: 'Independent configuration', text: 'Settings, branding, and preferences are organization-specific' },
        { bold: 'Scoped API keys', text: 'API credentials are created within and work only for their organization' },
      ],
    },
    {
      type: 'paragraph',
      text: 'From a user perspective, working within an organization looks the same regardless of whether other organizations exist. You log in, see your organization\'s data, and work within that context.',
    },
    {
      type: 'heading',
      id: 'creating-organizations',
      level: 2,
      text: 'Creating an organization',
    },
    {
      type: 'paragraph',
      text: 'New organizations are created during the initial setup process or by system administrators in self-hosted deployments. The process involves:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Organization name', text: 'Choose a name that identifies the business entity' },
        { bold: 'Initial administrator', text: 'Designate the first user who will have admin rights' },
        { bold: 'Configuration', text: 'Set organization-level preferences and branding' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Once created, the organization is ready for use. The initial administrator can invite additional team members and begin setting up the governance program.',
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Self-hosted deployments',
      text: 'Multi-organization support is built into VerifyWise by default. Each new organization automatically receives its own isolated data schema during the setup process.',
    },
    {
      type: 'heading',
      id: 'organization-settings',
      level: 2,
      text: 'Organization settings',
    },
    {
      type: 'paragraph',
      text: 'Each organization can customize its own settings independent of other organizations. Configuration options include:',
    },
    {
      type: 'heading',
      id: 'branding',
      level: 3,
      text: 'Branding',
    },
    {
      type: 'paragraph',
      text: 'Upload your organization logo and set the organization name. These appear throughout the interface and in generated reports. If you use the AI Trust Center, your branding appears on the public-facing page.',
    },
    {
      type: 'heading',
      id: 'user-management-org',
      level: 3,
      text: 'User management',
    },
    {
      type: 'paragraph',
      text: 'Manage who has access to your organization. Invite new users, assign roles, and remove users who should no longer have access. Each organization maintains its own user directory.',
    },
    {
      type: 'paragraph',
      text: 'Users can only belong to one organization. If someone needs access to multiple organizations, they will need separate accounts with different email addresses.',
    },
    {
      type: 'heading',
      id: 'integrations-org',
      level: 3,
      text: 'Integrations',
    },
    {
      type: 'paragraph',
      text: 'Configure integrations like Slack notifications separately for each organization. This allows different business units to route notifications to their own channels and tools.',
    },
    {
      type: 'heading',
      id: 'data-isolation',
      level: 2,
      text: 'Data isolation',
    },
    {
      type: 'paragraph',
      text: 'The core benefit of multi-organization architecture is data isolation. VerifyWise uses schema-level separation within the database, meaning each organization has its own set of tables containing their governance data. Here is what this means in practice:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Models', text: 'AI models registered in one organization are not visible to other organizations' },
        { bold: 'Risks', text: 'Risk registers are completely separate' },
        { bold: 'Policies', text: 'Each organization maintains its own policy library' },
        { bold: 'Vendors', text: 'Vendor registries do not overlap' },
        { bold: 'Evidence', text: 'Uploaded files are isolated to their organization' },
        { bold: 'Reports', text: 'Generated reports contain only organization-specific data' },
        { bold: 'Audit logs', text: 'Event tracking is scoped to the organization' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'There is no way to share data between organizations within VerifyWise. If you need to share models, policies, or other assets, you would need to export from one organization and import into another.',
    },
    {
      type: 'heading',
      id: 'authentication',
      level: 2,
      text: 'Authentication',
    },
    {
      type: 'paragraph',
      text: 'Users authenticate to VerifyWise and are then associated with their organization. The authentication flow ensures users can only access the organization they belong to.',
    },
    {
      type: 'paragraph',
      text: 'Key authentication behaviors:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'User accounts are associated with a specific organization' },
        { text: 'Session tokens include organization context for data access' },
        { text: 'API keys are scoped to the organization that created them' },
        { text: 'Password policies apply at the platform level' },
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'heading',
      id: 'naming-conventions',
      level: 3,
      text: 'Naming conventions',
    },
    {
      type: 'paragraph',
      text: 'Use clear, consistent naming for organizations. Include identifiers that make it obvious which business entity the organization represents. This is especially important when administrators manage multiple organizations.',
    },
    {
      type: 'heading',
      id: 'admin-access',
      level: 3,
      text: 'Administrator access',
    },
    {
      type: 'paragraph',
      text: 'Limit the number of administrators in each organization. While you need at least one admin to manage settings and users, having too many increases the risk of configuration errors or unintended changes.',
    },
    {
      type: 'heading',
      id: 'documentation',
      level: 3,
      text: 'Documentation',
    },
    {
      type: 'paragraph',
      text: 'Maintain documentation about your organization structure outside of VerifyWise. Record which business entities map to which organizations, who the administrators are, and any special configuration requirements.',
    },
    {
      type: 'heading',
      id: 'regular-review',
      level: 3,
      text: 'Regular review',
    },
    {
      type: 'paragraph',
      text: 'Periodically review your organization structure. As your business evolves, you may need to create new organizations, merge existing ones, or adjust user assignments. Build this review into your governance processes.',
    },
    {
      type: 'heading',
      id: 'limitations',
      level: 2,
      text: 'Limitations',
    },
    {
      type: 'paragraph',
      text: 'Be aware of these constraints when working with multiple organizations:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'No cross-organization reporting', text: 'You cannot generate reports that span multiple organizations' },
        { bold: 'No shared users', text: 'Users cannot belong to multiple organizations with a single account' },
        { bold: 'No data sharing', text: 'There is no built-in mechanism to share data between organizations' },
        { bold: 'Separate administration', text: 'Each organization must be administered independently' },
      ],
    },
    {
      type: 'paragraph',
      text: 'If you need capabilities that span organizations, consider whether a single organization with multiple projects might better serve your needs.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'settings',
          articleId: 'organization-settings',
          title: 'Organization settings',
          description: 'Configure your organization name and branding',
        },
        {
          collectionId: 'settings',
          articleId: 'user-management',
          title: 'User management',
          description: 'Invite and manage team members',
        },
        {
          collectionId: 'settings',
          articleId: 'role-configuration',
          title: 'Role configuration',
          description: 'Understand Admin, Editor, and Viewer permissions',
        },
      ],
    },
  ],
};
