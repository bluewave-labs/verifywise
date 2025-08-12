// src/domain/types/policy.types.ts

export interface Policy {
  id: string;
  title: string;
  content_html: string;
  status: string;
  tags?: string[];
  next_review_date?: string; // ISO date string
  author_id: number;
  assigned_reviewer_ids?: number[];
  last_updated_by: number;
  last_updated_at?: string; // ISO date string
}

export interface PolicyInput {
  title: string;
  status: string;
  tags?: string[];
  content_html: string;
  next_review_date?: Date | undefined; // ISO date string
  assigned_reviewer_ids?: number[];
}
