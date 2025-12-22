import { PolicyManagerModel } from "../models/Common/policy/policyManager.model";
import { User } from "../types/User";

export interface PolicyTableProps {
  data: PolicyManagerModel[];
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  hidePagination?: boolean;
  flashRowId?: number | null;
}

export interface PolicyInput {
  title: string;
  status: string;
  tags?: string[];
  content_html: string;
  next_review_date?: Date | undefined; // ISO date string
  assigned_reviewer_ids?: number[];
}

export interface PolicyStatusCardProps {
  policies: PolicyManagerModel[];
}

export interface PolicyFormData {
  title: string;
  status: string;
  tags: string[];
  nextReviewDate?: string;
  assignedReviewers: User[];
  content: string;
}

export interface PolicyTemplate {
  title: string;
  tags: string[];
  content: string;
}

export interface PolicyDetailModalProps {
  policy: PolicyManagerModel | null;
  tags: string[];
  template?: PolicyTemplate;
  onClose: () => void;
  onSaved: (successMessage?: string) => void;
}

export interface PolicyFormErrors {
  title?: string;
  status?: string;
  tags?: string;
  nextReviewDate?: string;
  assignedReviewers?: string;
  content?: string;
}

export interface PolicyFormProps {
  formData: PolicyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PolicyFormData>>;
  tags: string[];
  errors: PolicyFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<PolicyFormErrors>>;
}

export interface PolicyManagerProps {
  policies: PolicyManagerModel[];
  tags: string[];
  fetchAll: () => void;
}

export interface PolicyTemplatesProps {
  tags: string[];
  fetchAll: () => void;
}
