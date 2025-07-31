export interface IPolicy {
  id?: string;
  title: string;
  content_html: string;
  status: string;
  tags?: string[];
  next_review_date?: Date;
  author_id: number;
  assigned_reviewer_ids?: number[];
  last_updated_by: number;
  last_updated_at?: Date;
}

export const POLICY_TAGS = [
  'AI ethics',
  'Fairness', 
  'Transparency',
  'Explainability',
  'Bias mitigation',
  'Privacy',
  'Data governance',
  'Model risk',
  'Accountability',
  'Security',
  'LLM',
  'Human oversight',
  'EU AI Act',
  'ISO 42001',
  'NIST RMF',
  'Red teaming',
  'Audit',
  'Monitoring',
  'Vendor management'
];