import path from "path";

/**
 * Centralized email template constants
 *
 * Template alias format: entity.action.role
 * Maps semantic aliases to actual MJML template filenames
 */

// Resolve templates directory relative to this constants file
// __dirname points to Servers/constants after transpilation
export const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

export const EMAIL_TEMPLATES = {
  // Account management templates
  ACCOUNT_CREATION: "account-creation-email.mjml",
  PASSWORD_RESET: "password-reset-email.mjml",

  // Project templates
  PROJECT_CREATED_ADMIN: "project-created-admin.mjml",

  // User role templates
  USER_ADDED_PROJECT_ADMIN: "user-added-project-admin.mjml",
  USER_ADDED_PROJECT_AUDITOR: "user-added-project-auditor.mjml",
  USER_ADDED_PROJECT_EDITOR: "user-added-project-editor.mjml",
  USER_ADDED_PROJECT_REVIEWER: "user-added-project-reviewer.mjml",

  // Role change templates
  MEMBER_ROLE_CHANGED_EDITOR_TO_ADMIN: "member-role-changed-editor-to-admin.mjml",

  // Policy templates
  POLICY_DUE_SOON: "policy-due-soon.mjml",

  // Task templates
  TASK_ASSIGNED: "task-assigned.mjml",

  // Review templates
  REVIEW_REQUESTED: "review-requested.mjml",
  REVIEW_APPROVED: "review-approved.mjml",
  REVIEW_REJECTED: "review-rejected.mjml",

  // Approval workflow templates
  APPROVAL_REQUESTED: "approval-requested.mjml",
  APPROVAL_COMPLETE: "approval-complete.mjml",
  APPROVAL_REJECTED: "approval-rejected.mjml",

  // Training templates
  TRAINING_ASSIGNED: "training-assigned.mjml",

  // Vendor templates
  VENDOR_REVIEW_DUE: "vendor-review-due.mjml",
} as const;

// Type-safe template keys
export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;

// Helper function to get template by key
export const getEmailTemplate = (key: EmailTemplateKey): string => {
  return EMAIL_TEMPLATES[key];
};