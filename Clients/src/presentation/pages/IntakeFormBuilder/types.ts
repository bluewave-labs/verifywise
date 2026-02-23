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
  guidanceText?: string;
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
 * Design / styling settings for intake forms
 */
export interface FormDesignSettings {
  format: "narrow" | "wide";
  alignment: "left" | "center" | "right";
  colorTheme: string;
  backgroundColor: string;
  logoUrl: string;
  fontFamily: string;
}

/**
 * Default design settings
 */
export const DEFAULT_DESIGN_SETTINGS: FormDesignSettings = {
  format: "narrow",
  alignment: "left",
  colorTheme: "#13715B",
  backgroundColor: "#fafafa",
  logoUrl: "",
  fontFamily: "Inter",
};

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
  publicId?: string | null;
  recipients?: number[];
  riskTierSystem?: string;
  riskAssessmentConfig?: Record<string, unknown> | null;
  llmKeyId?: number | null;
  suggestedQuestionsEnabled?: boolean;
  designSettings?: FormDesignSettings;
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
  recipients?: number[];
  riskTierSystem?: string;
  llmKeyId?: number | null;
  suggestedQuestionsEnabled?: boolean;
  designSettings?: FormDesignSettings;
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
  recipients?: number[];
  riskTierSystem?: string;
  llmKeyId?: number | null;
  suggestedQuestionsEnabled?: boolean;
  designSettings?: FormDesignSettings;
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
 * Default use case fields pre-populated for new forms
 */
export const DEFAULT_USE_CASE_FIELDS: FormField[] = [
  {
    id: generateFieldId(),
    type: "text",
    label: "Use case name",
    placeholder: "Enter the name of your AI use case",
    guidanceText: "A clear name helps reviewers quickly understand the scope of this AI system.",
    validation: { required: true, maxLength: 255 },
    entityFieldMapping: "project_title",
    order: 0,
  },
  {
    id: generateFieldId(),
    type: "textarea",
    label: "What does this AI system do?",
    placeholder: "Describe the core functionality and purpose",
    guidanceText: "Understanding what the system does is critical for risk assessment and compliance review.",
    validation: { required: true, maxLength: 2000 },
    entityFieldMapping: "description",
    order: 1,
  },
  {
    id: generateFieldId(),
    type: "textarea",
    label: "What business goal does this serve?",
    placeholder: "Explain the business objective this AI system addresses",
    guidanceText: "Connecting AI systems to business goals helps prioritize governance efforts.",
    validation: { maxLength: 2000 },
    entityFieldMapping: "goal",
    order: 2,
  },
  {
    id: generateFieldId(),
    type: "select",
    label: "AI risk classification",
    guidanceText: "This classification determines the level of regulatory scrutiny required.",
    options: [
      { label: "Minimal risk", value: "minimal" },
      { label: "Limited risk", value: "limited" },
      { label: "High risk", value: "high" },
      { label: "Unacceptable risk", value: "unacceptable" },
    ],
    entityFieldMapping: "ai_risk_classification",
    order: 3,
  },
  {
    id: generateFieldId(),
    type: "select",
    label: "Does this system make autonomous decisions?",
    guidanceText: "Autonomous decision-making increases risk and may require human oversight measures.",
    options: [
      { label: "No — always requires human approval", value: "no" },
      { label: "Partially — recommends but human decides", value: "partial" },
      { label: "Yes — makes decisions without human review", value: "yes" },
    ],
    order: 4,
  },
  {
    id: generateFieldId(),
    type: "select",
    label: "What type of personal data does this system process?",
    guidanceText: "Personal data processing determines GDPR and privacy compliance requirements.",
    options: [
      { label: "No personal data", value: "none" },
      { label: "Basic personal data (name, email)", value: "basic" },
      { label: "Sensitive personal data (health, biometric)", value: "sensitive" },
      { label: "Special category data (racial, political)", value: "special" },
    ],
    order: 5,
  },
];

/**
 * Hardcoded suggested questions grouped by category
 */
export interface SuggestedQuestion {
  label: string;
  fieldType: FieldType;
  category: string;
  guidanceText?: string;
  options?: FieldOption[];
}

export const HARDCODED_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  // Risks
  { label: "What happens if this AI system fails?", fieldType: "textarea", category: "Risks", guidanceText: "Understanding failure modes helps plan mitigation strategies." },
  { label: "How many people are affected by this system's decisions?", fieldType: "select", category: "Risks", guidanceText: "Impact scope is a key factor in risk assessment.", options: [{ label: "Less than 100", value: "small" }, { label: "100–10,000", value: "medium" }, { label: "More than 10,000", value: "large" }] },
  // Compliance
  { label: "Has a data protection impact assessment been conducted?", fieldType: "select", category: "Compliance", guidanceText: "DPIAs are required for high-risk data processing under GDPR.", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }, { label: "In progress", value: "in_progress" }] },
  { label: "Which regulations apply to this use case?", fieldType: "textarea", category: "Compliance", guidanceText: "Identifying applicable regulations early prevents compliance gaps." },
  // Operations
  { label: "Who is responsible for monitoring this system in production?", fieldType: "text", category: "Operations", guidanceText: "Clear ownership ensures ongoing governance after deployment." },
  { label: "How frequently will this system be retrained or updated?", fieldType: "select", category: "Operations", guidanceText: "Retraining frequency affects model drift and ongoing risk.", options: [{ label: "Never", value: "never" }, { label: "Quarterly", value: "quarterly" }, { label: "Monthly", value: "monthly" }, { label: "Continuously", value: "continuous" }] },
  // Vendors
  { label: "Are any third-party AI vendors or APIs used?", fieldType: "textarea", category: "Vendors", guidanceText: "Third-party dependencies create supply chain risks that need governance." },
  { label: "Where is the AI model hosted?", fieldType: "select", category: "Vendors", guidanceText: "Hosting location affects data sovereignty and regulatory compliance.", options: [{ label: "On-premises", value: "on_prem" }, { label: "Cloud (same region)", value: "cloud_local" }, { label: "Cloud (different region)", value: "cloud_remote" }] },
  // Models
  { label: "Can the AI system explain its decisions?", fieldType: "select", category: "Models", guidanceText: "Explainability is required under EU AI Act for high-risk systems.", options: [{ label: "Yes — fully explainable", value: "full" }, { label: "Partially", value: "partial" }, { label: "No — black box", value: "none" }] },
  { label: "What training data was used?", fieldType: "textarea", category: "Models", guidanceText: "Training data quality and provenance are key governance concerns." },
];

/**
 * Default empty form — defaults to USE_CASE with pre-populated fields.
 * Pass entityType to create a form for a specific entity type.
 */
export function createEmptyForm(entityType?: IntakeEntityType): IntakeForm {
  const type = entityType ?? IntakeEntityType.USE_CASE;
  return {
    name: "",
    description: "",
    slug: "",
    entityType: type,
    schema: {
      version: "1.0",
      fields: type === IntakeEntityType.USE_CASE
        ? DEFAULT_USE_CASE_FIELDS.map((f, i) => ({ ...f, id: generateFieldId(), order: i }))
        : [],
    },
    submitButtonText: "Submit",
    status: IntakeFormStatus.DRAFT,
    ttlExpiresAt: null,
    recipients: [],
    riskTierSystem: "generic",
    llmKeyId: null,
    suggestedQuestionsEnabled: false,
    designSettings: { ...DEFAULT_DESIGN_SETTINGS },
  };
}
