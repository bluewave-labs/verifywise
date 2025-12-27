import { User } from "../types/User";

/**
 * Domain-layer policy interfaces
 * Contains pure data types without React or UI dependencies
 */

/**
 * Input structure for creating/updating policies
 */
export interface PolicyInput {
  title: string;
  status: string;
  tags?: string[];
  content_html: string;
  next_review_date?: Date | undefined;
  assigned_reviewer_ids?: number[];
}

/**
 * Form data structure for policy editing
 */
export interface PolicyFormData {
  title: string;
  status: string;
  tags: string[];
  nextReviewDate?: string;
  assignedReviewers: User[];
  content: string;
}

/**
 * Policy template structure
 */
export interface PolicyTemplate {
  title: string;
  tags: string[];
  content: string;
}

/**
 * Form validation errors structure
 */
export interface PolicyFormErrors {
  title?: string;
  status?: string;
  tags?: string;
  nextReviewDate?: string;
  assignedReviewers?: string;
  content?: string;
}

// Note: Presentation-specific interfaces (PolicyTableProps, PolicyStatusCardProps,
// PolicyDetailModalProps, PolicyFormProps, PolicyManagerProps, PolicyTemplatesProps)
// have been moved to: presentation/types/interfaces/i.policy.ts
