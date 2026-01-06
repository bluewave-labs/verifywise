/**
 * Types for IntakeFormBuilder
 */

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
}

export interface IntakeForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaletteItem {
  type: FieldType;
  label: string;
  icon: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: "text", label: "Short text", icon: "TextFields" },
  { type: "textarea", label: "Long text", icon: "Notes" },
  { type: "email", label: "Email", icon: "Email" },
  { type: "url", label: "URL", icon: "Link" },
  { type: "number", label: "Number", icon: "Numbers" },
  { type: "date", label: "Date", icon: "CalendarMonth" },
  { type: "select", label: "Dropdown", icon: "ArrowDropDownCircle" },
  { type: "multiselect", label: "Multi-select", icon: "Checklist" },
  { type: "checkbox", label: "Checkbox", icon: "CheckBox" },
];
