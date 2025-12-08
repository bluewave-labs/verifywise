import type { ArticleContent } from '@user-guide-content/contentTypes';

export const roleConfigurationContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise uses role-based access control (RBAC) to manage what users can see and do within the platform. Each user is assigned a role that determines their permissions across all features.',
    },
    {
      type: 'paragraph',
      text: 'Understanding roles helps you ensure that team members have appropriate access levels for their responsibilities while maintaining security and governance controls.',
    },
    {
      type: 'heading',
      id: 'available-roles',
      level: 2,
      text: 'Available roles',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides three predefined roles to cover common organizational needs:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Shield',
          title: 'Admin',
          description: 'Full access to all features including user management, organization settings, and integrations.',
        },
        {
          icon: 'Edit',
          title: 'Editor',
          description: 'Can create, edit, and manage most content but has limited access to administrative functions.',
        },
        {
          icon: 'Eye',
          title: 'Viewer',
          description: 'Read-only access to view content and reports but cannot make changes.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'admin-role',
      level: 2,
      text: 'Admin role',
    },
    {
      type: 'paragraph',
      text: 'Administrators have complete control over the VerifyWise platform. This role should be assigned to users responsible for platform governance and user management.',
    },
    {
      type: 'paragraph',
      text: 'Admin capabilities include:',
    },
    {
      type: 'checklist',
      items: [
        'Full access to all platform features',
        'Create, edit, and delete use cases and assessments',
        'Manage models, vendors, policies, and training records',
        'Invite new users and change user roles',
        'Configure organization settings and branding',
        'Set up and manage integrations (Slack, MLflow)',
        'Create and manage API keys',
        'Generate all report types',
        'Access all settings tabs',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Admins cannot delete their own account if they are the only administrator. Ensure at least one other admin exists before removing an admin user.',
    },
    {
      type: 'heading',
      id: 'editor-role',
      level: 2,
      text: 'Editor role',
    },
    {
      type: 'paragraph',
      text: 'Editors can work with most platform content but have restricted access to administrative functions. This role is appropriate for team members who need to contribute to governance activities without full system control.',
    },
    {
      type: 'paragraph',
      text: 'Editor capabilities include:',
    },
    {
      type: 'checklist',
      items: [
        'Create, edit, and delete use cases and assessments',
        'Manage models, vendors, policies, and training records',
        'Invite new team members',
        'Update organization settings (name and logo)',
        'Generate reports',
        'Access most settings tabs',
      ],
    },
    {
      type: 'paragraph',
      text: 'Editors cannot:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Manage integrations (Slack, MLflow)' },
        { text: 'Create or delete API keys' },
        { text: 'Change their own role' },
      ],
    },
    {
      type: 'heading',
      id: 'viewer-role',
      level: 2,
      text: 'Viewer role',
    },
    {
      type: 'paragraph',
      text: 'Viewers have read-only access to the platform. This role is appropriate for stakeholders who need to review governance information without making changes, such as auditors or executives.',
    },
    {
      type: 'paragraph',
      text: 'Viewer capabilities include:',
    },
    {
      type: 'checklist',
      items: [
        'View use cases, assessments, and compliance status',
        'View models, vendors, policies, and training records',
        'View reports (cannot generate new reports)',
        'Access dashboard and analytics',
        'Update personal profile and preferences',
      ],
    },
    {
      type: 'paragraph',
      text: 'Viewers cannot:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Create, edit, or delete any content' },
        { text: 'Invite users or manage team members' },
        { text: 'Access organization settings' },
        { text: 'Generate reports' },
        { text: 'Access integrations or API keys' },
      ],
    },
    {
      type: 'heading',
      id: 'assigning-roles',
      level: 2,
      text: 'Assigning roles',
    },
    {
      type: 'paragraph',
      text: 'Roles are assigned in two ways:',
    },
    {
      type: 'heading',
      id: 'during-invitation',
      level: 3,
      text: 'During invitation',
    },
    {
      type: 'paragraph',
      text: 'When inviting a new team member, select the appropriate role in the invitation modal. The user will have this role when they create their account.',
    },
    {
      type: 'heading',
      id: 'changing-existing-role',
      level: 3,
      text: 'Changing an existing user\'s role',
    },
    {
      type: 'paragraph',
      text: 'To change a user\'s role after they have joined:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Settings > Team' },
        { text: 'Find the user in the team table' },
        { text: 'Click on the role dropdown in their row' },
        { text: 'Select the new role' },
        { text: 'The change takes effect immediately' },
      ],
    },
    {
      type: 'heading',
      id: 'permission-reference',
      level: 2,
      text: 'Permission reference',
    },
    {
      type: 'paragraph',
      text: 'The following table summarizes key permissions by role:',
    },
    {
      type: 'table',
      columns: [
        { key: 'feature', label: 'Feature', width: '2fr' },
        { key: 'admin', label: 'Admin', width: '1fr' },
        { key: 'editor', label: 'Editor', width: '1fr' },
        { key: 'viewer', label: 'Viewer', width: '1fr' },
      ],
      rows: [
        { feature: 'Use cases', admin: 'Full access', editor: 'Full access', viewer: 'View only' },
        { feature: 'Models', admin: 'Full access', editor: 'Full access', viewer: 'View only' },
        { feature: 'Vendors', admin: 'Full access', editor: 'Full access', viewer: 'View only' },
        { feature: 'Policies', admin: 'Full access', editor: 'Full access', viewer: 'View only' },
        { feature: 'Training', admin: 'Full access', editor: 'Full access', viewer: 'View only' },
        { feature: 'Reports', admin: 'Generate', editor: 'Generate', viewer: 'View only' },
        { feature: 'Team management', admin: 'Full access', editor: 'Invite only', viewer: '—' },
        { feature: 'Organization settings', admin: 'Full access', editor: 'Edit', viewer: 'View only' },
        { feature: 'Integrations', admin: 'Full access', editor: '—', viewer: '—' },
        { feature: 'API keys', admin: 'Full access', editor: '—', viewer: '—' },
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
        { bold: 'Limit admin accounts', text: 'Assign the Admin role only to users who need full platform control. Most users should be Editors or Viewers.' },
        { bold: 'Review roles regularly', text: 'Periodically review user roles to ensure they match current responsibilities.' },
        { bold: 'Use Viewer for external access', text: 'For auditors or external stakeholders who need to review your governance, use the Viewer role.' },
        { bold: 'Document role decisions', text: 'Keep a record of why users were assigned specific roles for audit purposes.' },
      ],
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-custom-roles',
      level: 3,
      text: 'Can I create custom roles with specific permissions?',
    },
    {
      type: 'paragraph',
      text: 'Currently, VerifyWise provides three predefined roles (Admin, Editor, Viewer). Custom role configuration is not available in this version. The predefined roles cover most organizational needs.',
    },
    {
      type: 'heading',
      id: 'faq-change-own-role',
      level: 3,
      text: 'Can I change my own role?',
    },
    {
      type: 'paragraph',
      text: 'No, users cannot change their own role. Another administrator must update your role if a change is needed. This prevents accidental loss of admin access.',
    },
    {
      type: 'heading',
      id: 'faq-multiple-admins',
      level: 3,
      text: 'How many administrators should we have?',
    },
    {
      type: 'paragraph',
      text: 'We recommend having at least two administrators to ensure continuity. If one admin is unavailable, another can manage the platform. However, limit the number of admins to those who truly need full access.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'settings',
          articleId: 'user-management',
          title: 'User management',
          description: 'Manage team members and access',
        },
        {
          collectionId: 'integrations',
          articleId: 'api-access',
          title: 'API access',
          description: 'Manage API keys for integrations',
        },
      ],
    },
  ],
};
