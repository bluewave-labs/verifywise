/**
 * Policy presentation-layer interfaces
 * Contains UI component props with callbacks and React dependencies
 */

import React from "react";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";

// Re-export domain types for convenience
export type {
  PolicyInput,
  PolicyFormData,
  PolicyTemplate,
  PolicyFormErrors,
} from "../../../domain/interfaces/i.policy";

/**
 * Props for policy table component
 */
export interface PolicyTableProps {
  data: PolicyManagerModel[];
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onLinkedObjects: (id: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  hidePagination?: boolean;
}

/**
 * Props for policy status card component
 */
export interface PolicyStatusCardProps {
  policies: PolicyManagerModel[];
}

/**
 * Props for policy detail modal component
 */
export interface PolicyDetailModalProps {
  policy: PolicyManagerModel | null;
  tags: string[];
  template?: import("../../../domain/interfaces/i.policy").PolicyTemplate;
  onClose: () => void;
  onSaved: (successMessage?: string) => void;
}

/**
 * Props for policy form component - contains React types
 */
export interface PolicyFormProps {
  formData: import("../../../domain/interfaces/i.policy").PolicyFormData;
  setFormData: React.Dispatch<React.SetStateAction<import("../../../domain/interfaces/i.policy").PolicyFormData>>;
  tags: string[];
  errors: import("../../../domain/interfaces/i.policy").PolicyFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<import("../../../domain/interfaces/i.policy").PolicyFormErrors>>;
}

/**
 * Props for policy manager component
 */
export interface PolicyManagerProps {
  policies: PolicyManagerModel[];
  tags: string[];
  fetchAll: () => void;
}

/**
 * Props for policy templates component
 */
export interface PolicyTemplatesProps {
  tags: string[];
  fetchAll: () => void;
}
