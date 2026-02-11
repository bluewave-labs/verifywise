/**
 * Model Lifecycle type definitions
 *
 * Defines types for the configurable model lifecycle system where
 * each model goes through predefined phases with configurable items.
 */

export type LifecycleItemType =
  | "text"
  | "textarea"
  | "documents"
  | "people"
  | "classification"
  | "checklist"
  | "approval";

// ============================================================================
// Phase & Item definitions (admin-configurable)
// ============================================================================

export interface LifecyclePhase {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  items?: LifecycleItem[];
}

export interface LifecycleItem {
  id: number;
  phase_id: number;
  name: string;
  description?: string;
  item_type: LifecycleItemType;
  is_required: boolean;
  display_order: number;
  config: LifecycleItemConfig;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// ============================================================================
// Type-specific config interfaces
// ============================================================================

export type LifecycleItemConfig =
  | TextItemConfig
  | TextareaItemConfig
  | DocumentsItemConfig
  | PeopleItemConfig
  | ClassificationItemConfig
  | ChecklistItemConfig
  | ApprovalItemConfig
  | Record<string, unknown>;

export interface TextItemConfig {
  maxLength?: number;
  placeholder?: string;
}

export interface TextareaItemConfig {
  maxLength?: number;
  placeholder?: string;
}

export interface DocumentsItemConfig {
  maxFiles?: number;
  allowedTypes?: string[];
}

export interface PeopleItemConfig {
  maxPeople?: number;
  roles?: string[];
}

export interface ClassificationItemConfig {
  levels: string[];
}

export interface ChecklistItemConfig {
  defaultItems?: string[];
}

export interface ApprovalItemConfig {
  requiredApprovers?: number;
}

// ============================================================================
// Value storage (per-model data)
// ============================================================================

export interface LifecycleValue {
  id: number;
  model_inventory_id: number;
  item_id: number;
  value_text?: string | null;
  value_json?: unknown;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  files?: LifecycleItemFile[];
}

export interface LifecycleItemFile {
  id: number;
  value_id: number;
  file_id: number;
  created_at?: Date;
  filename?: string;
  mimetype?: string;
  size?: number;
}

// ============================================================================
// Type-specific value interfaces
// ============================================================================

export interface PeopleValue {
  userId: number;
  role?: string;
}

export interface ClassificationValue {
  level: string;
}

export interface ChecklistValue {
  label: string;
  checked: boolean;
}

export interface ApprovalValue {
  userId: number;
  status: "pending" | "approved" | "rejected";
  date?: string;
  comment?: string;
}

// ============================================================================
// Progress tracking
// ============================================================================

export interface LifecyclePhaseProgress {
  phase_id: number;
  phase_name: string;
  total_items: number;
  filled_items: number;
  required_items: number;
  filled_required_items: number;
}

export interface LifecycleProgress {
  phases: LifecyclePhaseProgress[];
  total_items: number;
  filled_items: number;
  total_required: number;
  filled_required: number;
  completion_percentage: number;
}

// ============================================================================
// Input types for creating/updating
// ============================================================================

export interface CreatePhaseInput {
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdatePhaseInput {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateItemInput {
  phase_id: number;
  name: string;
  description?: string;
  item_type: LifecycleItemType;
  is_required?: boolean;
  display_order?: number;
  config?: LifecycleItemConfig;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  item_type?: LifecycleItemType;
  is_required?: boolean;
  display_order?: number;
  config?: LifecycleItemConfig;
  is_active?: boolean;
}

export interface UpsertValueInput {
  value_text?: string | null;
  value_json?: unknown;
}
