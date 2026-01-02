import { IntakeFormStatus, IntakeEntityType } from "../../../domain/intake/enums";

/**
 * Field types supported in the intake form builder
 */
export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date"
  | "email"
  | "url"
  | "number";

/**
 * Validation rules for form fields
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/**
 * Option for select/multiselect fields
 */
export interface FieldOption {
  label: string;
  value: string;
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  defaultValue?: string | number | boolean | string[];
  entityFieldMapping?: string;
  order: number;
}

/**
 * Form schema structure
 */
export interface FormSchema {
  version: string;
  fields: FormField[];
}

/**
 * Intake form data structure
 */
export interface IntakeForm {
  id?: number;
  name: string;
  description: string;
  slug: string;
  entityType: IntakeEntityType;
  schema: FormSchema;
  submitButtonText: string;
  status: IntakeFormStatus;
  ttlExpiresAt?: Date | null;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Form creation input
 */
export interface CreateIntakeFormInput {
  name: string;
  description: string;
  slug?: string;
  entityType: IntakeEntityType;
  schema?: FormSchema;
  submitButtonText?: string;
  status?: IntakeFormStatus;
  ttlExpiresAt?: Date | null;
}

/**
 * Form update input
 */
export interface UpdateIntakeFormInput {
  name?: string;
  description?: string;
  slug?: string;
  schema?: FormSchema;
  submitButtonText?: string;
  status?: IntakeFormStatus;
  ttlExpiresAt?: Date | null;
}

/**
 * Field palette item for drag-and-drop
 */
export interface PaletteItem {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  defaultConfig: Partial<FormField>;
}

/**
 * Entity field mapping definitions for different entity types
 */
export interface EntityFieldMapping {
  field: string;
  label: string;
  description: string;
  requiredFieldType: FieldType[];
}

/**
 * Entity field mappings by entity type
 */
export const ENTITY_FIELD_MAPPINGS: Record<IntakeEntityType, EntityFieldMapping[]> = {
  [IntakeEntityType.MODEL]: [
    { field: "name", label: "Model name", description: "Name of the AI model", requiredFieldType: ["text"] },
    { field: "description", label: "Description", description: "Model description", requiredFieldType: ["text", "textarea"] },
    { field: "modelVersion", label: "Model version", description: "Version of the model", requiredFieldType: ["text"] },
    { field: "provider", label: "Provider", description: "Model provider/vendor", requiredFieldType: ["text", "select"] },
    { field: "owner", label: "Owner", description: "Model owner", requiredFieldType: ["text", "email"] },
    { field: "modelType", label: "Model type", description: "Type of AI model", requiredFieldType: ["text", "select"] },
    { field: "intendedUse", label: "Intended use", description: "Intended use of the model", requiredFieldType: ["text", "textarea"] },
    { field: "riskLevel", label: "Risk level", description: "Risk classification", requiredFieldType: ["select"] },
  ],
  [IntakeEntityType.USE_CASE]: [
    { field: "project_title", label: "Project title", description: "Title of the use case/project", requiredFieldType: ["text"] },
    { field: "goal", label: "Goal", description: "Goal of the project", requiredFieldType: ["text", "textarea"] },
    { field: "owner", label: "Owner", description: "Project owner", requiredFieldType: ["text", "email"] },
    { field: "start_date", label: "Start date", description: "Project start date", requiredFieldType: ["date"] },
    { field: "ai_risk_classification", label: "AI risk classification", description: "Risk classification", requiredFieldType: ["select"] },
    { field: "type_of_high_risk_role", label: "High risk role type", description: "Type of high-risk role", requiredFieldType: ["text", "select"] },
  ],
};

/**
 * Default palette items for drag-and-drop
 */
export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "text",
    label: "Short text",
    icon: "TextFields",
    description: "Single line text input",
    defaultConfig: {
      placeholder: "Enter text...",
      validation: { maxLength: 255 },
    },
  },
  {
    type: "textarea",
    label: "Long text",
    icon: "Notes",
    description: "Multi-line text area",
    defaultConfig: {
      placeholder: "Enter detailed text...",
      validation: { maxLength: 2000 },
    },
  },
  {
    type: "email",
    label: "Email",
    icon: "Email",
    description: "Email address input",
    defaultConfig: {
      placeholder: "email@example.com",
      validation: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternMessage: "Please enter a valid email address" },
    },
  },
  {
    type: "url",
    label: "URL",
    icon: "Link",
    description: "Web address input",
    defaultConfig: {
      placeholder: "https://example.com",
    },
  },
  {
    type: "number",
    label: "Number",
    icon: "Numbers",
    description: "Numeric input",
    defaultConfig: {
      placeholder: "0",
    },
  },
  {
    type: "date",
    label: "Date",
    icon: "CalendarMonth",
    description: "Date picker",
    defaultConfig: {},
  },
  {
    type: "select",
    label: "Dropdown",
    icon: "ArrowDropDownCircle",
    description: "Single selection dropdown",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "multiselect",
    label: "Multi-select",
    icon: "Checklist",
    description: "Multiple selection dropdown",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "CheckBox",
    description: "Single checkbox toggle",
    defaultConfig: {
      defaultValue: false,
    },
  },
];

/**
 * Drag-and-drop context types
 */
export interface DragData {
  type: "palette" | "canvas";
  field?: FormField;
  paletteItem?: PaletteItem;
}

/**
 * Form builder state
 */
export interface FormBuilderState {
  form: IntakeForm;
  selectedFieldId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
}

/**
 * Generate unique field ID
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a new form field from palette item
 */
export function createFieldFromPalette(paletteItem: PaletteItem, order: number): FormField {
  return {
    id: generateFieldId(),
    type: paletteItem.type,
    label: paletteItem.label,
    order,
    ...paletteItem.defaultConfig,
  };
}

/**
 * Default empty form
 */
export function createEmptyForm(): IntakeForm {
  return {
    name: "",
    description: "",
    slug: "",
    entityType: IntakeEntityType.MODEL,
    schema: {
      version: "1.0",
      fields: [],
    },
    submitButtonText: "Submit",
    status: IntakeFormStatus.DRAFT,
    ttlExpiresAt: null,
  };
}
