/**
 * Built-in Plugin Manifest
 *
 * Plugins defined here live in the main repo and use the plugin infrastructure
 * for install/uninstall per tenant without remote download.
 */

interface BuiltinPlugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: string;
  region?: string;
  frameworkType?: "organizational" | "project";
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  isBuiltIn: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: Array<{
    name: string;
    description: string;
    displayOrder: number;
  }>;
  tags: string[];
  pluginPath: string;
  entryPoint: string;
  dependencies?: Record<string, string>;
  ui?: {
    bundleUrl: string;
    slots: Array<{
      slotId: string;
      componentName: string;
      renderType: string;
      props?: Record<string, any>;
      trigger?: string;
    }>;
  };
}

const BUILTIN_PLUGINS: BuiltinPlugin[] = [
  {
    key: "model-lifecycle",
    name: "model-lifecycle",
    displayName: "Model Lifecycle",
    description:
      "Configurable lifecycle phase tracking for AI model inventory items. Define phases, track progress, attach files, and manage governance workflows.",
    longDescription:
      "The Model Lifecycle plugin provides a structured approach to tracking AI models through their development and deployment lifecycle. " +
      "Administrators can define custom phases (e.g., Development, Testing, Staging, Production, Retirement) with configurable items within each phase. " +
      "Users can track progress per model, attach evidence files, and view completion metrics. " +
      "All lifecycle data is preserved when uninstalled and restored when reinstalled.",
    version: "1.0.0",
    author: "VerifyWise",
    category: "ml_ops",
    isOfficial: true,
    isPublished: true,
    isBuiltIn: true,
    requiresConfiguration: false,
    installationType: "built-in",
    features: [
      {
        name: "Lifecycle Phases",
        description: "Define and manage custom lifecycle phases for model governance",
        displayOrder: 1,
      },
      {
        name: "Progress Tracking",
        description: "Track completion progress per model across all lifecycle phases",
        displayOrder: 2,
      },
      {
        name: "File Attachments",
        description: "Attach evidence and documentation files to lifecycle items",
        displayOrder: 3,
      },
      {
        name: "Admin Configuration",
        description: "Admins can create, reorder, and manage phases and items",
        displayOrder: 4,
      },
    ],
    tags: ["lifecycle", "model", "governance", "phases"],
    pluginPath: "__builtin__",
    entryPoint: "__builtin__",
    ui: {
      bundleUrl: "__builtin__",
      slots: [
        {
          slotId: "page.model-detail.lifecycle",
          componentName: "ModelLifecycleContent",
          renderType: "raw",
        },
      ],
    },
  },
  {
    key: "dataset-bulk-upload",
    name: "dataset-bulk-upload",
    displayName: "Dataset Bulk Upload",
    description:
      "Upload multiple CSV/XLSX files in bulk and auto-generate governance dataset metadata records (EU AI Act Article 10).",
    longDescription:
      "The Dataset Bulk Upload plugin enables users to drag-and-drop multiple data files (CSV, XLSX) " +
      "and automatically extract governance metadata including column counts, row counts, and PII detection. " +
      "Each file is stored and linked to an auto-created dataset record with pre-filled metadata that can be " +
      "reviewed and edited before committing. Supports up to 20 files per batch with 30MB per file limit.",
    version: "1.0.0",
    author: "VerifyWise",
    category: "data_governance",
    isOfficial: true,
    isPublished: true,
    isBuiltIn: true,
    requiresConfiguration: false,
    installationType: "built-in",
    features: [
      {
        name: "Multi-File Upload",
        description: "Drag-and-drop up to 20 CSV/XLSX files at once",
        displayOrder: 1,
      },
      {
        name: "Auto Metadata Extraction",
        description: "Automatically extract column names, row counts, and format from uploaded files",
        displayOrder: 2,
      },
      {
        name: "PII Detection",
        description: "Scan column headers for personally identifiable information keywords",
        displayOrder: 3,
      },
      {
        name: "Batch Dataset Creation",
        description: "Create governance dataset records with pre-filled metadata for each file",
        displayOrder: 4,
      },
    ],
    tags: ["dataset", "bulk-upload", "csv", "xlsx", "pii", "data-governance"],
    pluginPath: "__builtin__",
    entryPoint: "__builtin__",
    ui: {
      bundleUrl: "__builtin__",
      slots: [
        {
          slotId: "page.datasets.toolbar",
          componentName: "BulkUploadButton",
          renderType: "button",
        },
        {
          slotId: "page.datasets.toolbar",
          componentName: "BulkUploadModal",
          renderType: "modal",
          trigger: "BulkUploadButton",
        },
      ],
    },
  },
];

/**
 * Returns all built-in plugin definitions.
 */
export function getBuiltinPlugins(): BuiltinPlugin[] {
  return BUILTIN_PLUGINS;
}

/**
 * Checks whether a plugin key refers to a built-in plugin.
 */
export function isBuiltinPlugin(key: string): boolean {
  return BUILTIN_PLUGINS.some((p) => p.key === key);
}
