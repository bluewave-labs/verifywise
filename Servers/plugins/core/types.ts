/**
 * VerifyWise Plugin System - Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the plugin system.
 */

import { Router, Request, Response } from "express";
import { Transaction } from "sequelize";

// ============================================================================
// PLUGIN MANIFEST
// ============================================================================

export type PluginType = "framework" | "integration" | "feature" | "reporting";

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  license?: string;
  type: PluginType;
  icon?: string; // SVG data URL or inline SVG string (64x64)

  compatibility?: {
    minCoreVersion?: string;
    maxCoreVersion?: string;
  };

  dependencies?: Record<string, string>;

  config?: Record<string, PluginConfigSchema>;

  permissions?: PluginPermission[];

  exports?: {
    routes?: boolean;
    models?: boolean;
    migrations?: boolean;
  };
}

export interface FrameworkManifest extends PluginManifest {
  type: "framework";
  frameworkId: number;
}

export interface IntegrationManifest extends PluginManifest {
  type: "integration";
}

export interface PluginConfigSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  label?: string; // Display label for UI
  required?: boolean;
  default?: unknown;
  secret?: boolean;
  description?: string;
  enum?: string[];
  min?: number;
  max?: number;
  properties?: Record<string, PluginConfigSchema>;
}

export type PluginPermission =
  | "database:read"
  | "database:write"
  | "events:emit"
  | "events:listen"
  | "filters:add"
  | "config:read"
  | "config:write"
  | "http:outbound"
  | "filesystem:read"
  | "filesystem:write"
  | "models:define"
  | "middleware:inject";

// ============================================================================
// PLUGIN INTERFACES
// ============================================================================

export interface Plugin {
  manifest: PluginManifest;

  // Installation lifecycle (permanent, data-related)
  onInstall?(context: PluginContext): Promise<void>;
  onUninstall?(context: PluginContext): Promise<void>;

  // Runtime lifecycle (temporary, session-related)
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(context: PluginContext): Promise<void>;
  onEnable?(context: PluginContext): Promise<void>;
  onDisable?(context: PluginContext): Promise<void>;

  // Optional capabilities
  routes?(router: Router): void;
  eventHandlers?(): EventHandlerMap;
  filterHandlers?(): FilterHandlerMap;
}

export interface FrameworkPlugin extends Plugin {
  manifest: FrameworkManifest;

  createForProject(
    projectId: number,
    tenant: string,
    transaction: Transaction,
    options?: FrameworkCreateOptions
  ): Promise<FrameworkData>;

  deleteForProject(
    projectFrameworkId: number,
    tenant: string,
    transaction: Transaction
  ): Promise<boolean>;

  getReportData(
    projectFrameworkId: number,
    tenant: string
  ): Promise<ReportData>;

  getStructure(): FrameworkStructure;

  validateCompliance?(data: unknown): ValidationResult;
  calculateProgress?(projectFrameworkId: number): Promise<ProgressInfo>;
}

export interface IntegrationPlugin extends Plugin {
  manifest: IntegrationManifest;

  connect(credentials: unknown): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  sync?(options: SyncOptions): Promise<SyncResult>;
  webhook?(payload: unknown): Promise<void>;
}

// ============================================================================
// PLUGIN CONTEXT
// ============================================================================

export interface PluginContext {
  pluginId: string;
  tenant: string;

  // Core services
  db: DatabaseService;
  logger: PluginLogger;
  config: PluginConfig;
  metadata: PluginMetadataAPI;

  // Event system (fire-and-forget notifications)
  emit<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E],
    options?: { transaction?: Transaction }
  ): Promise<void>;
  on<E extends PluginEvent>(event: E, handler: EventHandler<E>): void;
  off<E extends PluginEvent>(event: E, handler: EventHandler<E>): void;

  // Filter system (data transformation pipeline)
  applyFilters<F extends PluginFilter>(
    filter: F,
    data: FilterPayloads[F]
  ): Promise<FilterPayloads[F]>;
  addFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>,
    priority?: number
  ): void;
  removeFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>
  ): void;

  // Plugin access
  getPlugin<T extends Plugin>(id: string): T | undefined;
  isPluginEnabled(id: string): boolean;

  // Scheduler (for background/recurring jobs)
  scheduler: PluginSchedulerAPI;

  // Model system (Sequelize models for plugins)
  models: PluginModelAPI;

  // Middleware system (inject middleware into routes)
  middleware: PluginMiddlewareAPI;

  // HTTP context (if in request)
  request?: Request;
  response?: Response;
}

/**
 * Metadata API interface for plugin context
 * Provides schemaless key-value storage for plugins
 */
export interface PluginMetadataAPI {
  get<T = unknown>(
    entityType: string,
    entityId: number,
    key: string
  ): Promise<T | null>;
  set<T = unknown>(
    entityType: string,
    entityId: number,
    key: string,
    value: T
  ): Promise<void>;
  delete(entityType: string, entityId: number, key: string): Promise<boolean>;
  getAll(entityType: string, entityId: number): Promise<Record<string, unknown>>;
  setMany(
    entityType: string,
    entityId: number,
    data: Record<string, unknown>
  ): Promise<void>;
  deleteAll(entityType: string, entityId: number): Promise<number>;
  findByKey(
    entityType: string,
    key: string,
    value: unknown
  ): Promise<Array<{ entityType: string; entityId: number }>>;
  deleteByPlugin(): Promise<number>;
}

/**
 * Options for scheduling a job
 */
export interface ScheduleJobOptions {
  /** Cron pattern (e.g., "0 * * * *" for every hour) */
  cron?: string;
  /** Interval in milliseconds (alternative to cron) */
  every?: number;
  /** Delay before first execution in milliseconds */
  delay?: number;
  /** Maximum number of times to repeat (undefined = forever) */
  limit?: number;
  /** Job priority (lower = higher priority) */
  priority?: number;
  /** Number of retry attempts on failure */
  attempts?: number;
  /** Backoff strategy for retries */
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
}

/**
 * Scheduled job info returned after scheduling
 */
export interface ScheduledJobInfo {
  jobId: string;
  name: string;
  pluginId: string;
  nextRun?: Date;
}

/**
 * Job handler function type
 */
export type PluginJobHandler = (
  data: Record<string, unknown>,
  context: {
    jobId: string;
    attemptsMade: number;
    pluginId: string;
    tenant: string;
  }
) => Promise<void>;

/**
 * Plugin Scheduler API interface for plugin context
 * Provides scheduled/recurring job capabilities for plugins
 */
export interface PluginSchedulerAPI {
  /**
   * Schedule a recurring job
   * @param name - Unique job name within this plugin
   * @param handler - Function to execute
   * @param options - Scheduling options (cron or interval)
   * @param data - Optional data to pass to handler
   */
  schedule(
    name: string,
    handler: PluginJobHandler,
    options: ScheduleJobOptions,
    data?: Record<string, unknown>
  ): Promise<ScheduledJobInfo>;

  /**
   * Schedule a one-time job
   * @param name - Job name
   * @param handler - Function to execute
   * @param delay - Delay in milliseconds
   * @param data - Optional data to pass to handler
   */
  scheduleOnce(
    name: string,
    handler: PluginJobHandler,
    delay: number,
    data?: Record<string, unknown>
  ): Promise<ScheduledJobInfo>;

  /**
   * Cancel a scheduled job
   * @param name - Job name to cancel
   */
  cancel(name: string): Promise<boolean>;

  /**
   * Cancel all jobs for this plugin
   */
  cancelAll(): Promise<number>;

  /**
   * List all scheduled jobs for this plugin
   */
  list(): Promise<ScheduledJobInfo[]>;

  /**
   * Check if a job exists
   */
  exists(name: string): Promise<boolean>;
}

export interface DatabaseService {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  transaction<T>(
    callback: (t: Transaction) => Promise<T>
  ): Promise<T>;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface PluginConfig {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): Promise<void>;
  getAll(): Record<string, unknown>;
}

// ============================================================================
// PLUGIN MODEL API
// ============================================================================

/**
 * Model definition attributes for Sequelize
 */
export interface PluginModelAttributes {
  [key: string]: PluginModelAttributeDefinition;
}

export interface PluginModelAttributeDefinition {
  type: "STRING" | "TEXT" | "INTEGER" | "BIGINT" | "FLOAT" | "DOUBLE" | "DECIMAL" | "BOOLEAN" | "DATE" | "DATEONLY" | "JSON" | "JSONB" | "UUID" | "ENUM";
  allowNull?: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  references?: {
    model: string;
    key: string;
  };
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  values?: string[]; // For ENUM type
}

/**
 * Model options for Sequelize
 */
export interface PluginModelOptions {
  timestamps?: boolean;
  paranoid?: boolean;
  indexes?: Array<{
    name?: string;
    unique?: boolean;
    fields: string[];
  }>;
}

/**
 * Plugin Model API interface for plugin context
 * Provides Sequelize model capabilities for plugins
 */
export interface PluginModelAPI {
  /**
   * Define a new model for this plugin
   * Table name will be auto-prefixed: plugin_{pluginId}_{modelName}
   * @param name - Model name (e.g., "ConsentRecord")
   * @param attributes - Model attributes/columns
   * @param options - Optional model options
   */
  define(
    name: string,
    attributes: PluginModelAttributes,
    options?: PluginModelOptions
  ): void;

  /**
   * Get a previously defined model
   * @param name - Model name
   */
  get<T = unknown>(name: string): T | undefined;

  /**
   * Get a core VerifyWise model (e.g., User, Project)
   * @param name - Core model name
   */
  getCoreModel<T = unknown>(name: string): T | undefined;

  /**
   * Sync all defined models to the database
   * Call this after defining models in onInstall
   * @param options - Sync options
   */
  sync(options?: { force?: boolean; alter?: boolean }): Promise<void>;

  /**
   * Drop all tables created by this plugin
   * Use with caution - data will be lost
   */
  dropAll(): Promise<void>;

  /**
   * List all models defined by this plugin
   */
  list(): string[];

  /**
   * Check if a model is defined
   */
  has(name: string): boolean;
}

// ============================================================================
// PLUGIN MIDDLEWARE API
// ============================================================================

/**
 * Context passed to middleware handlers
 */
export interface MiddlewareContext {
  req: Request;
  res: Response;
  pluginId: string;
  tenant: string;
}

/**
 * Middleware handler function type
 */
export type PluginMiddlewareHandler = (
  ctx: MiddlewareContext,
  next: () => Promise<void>
) => void | Promise<void>;

/**
 * Registered middleware entry
 */
export interface RegisteredMiddleware {
  id: string;
  pluginId: string;
  pattern: string;
  position: "before" | "after";
  handler: PluginMiddlewareHandler;
  registeredAt: Date;
}

/**
 * Plugin Middleware API interface for plugin context
 * Provides route middleware injection for plugins
 */
export interface PluginMiddlewareAPI {
  /**
   * Add middleware to a route pattern
   * @param pattern - Route pattern (e.g., "/api/projects/:id", "/api/risks/*")
   * @param position - Execute before or after the route handler
   * @param handler - Middleware function
   * @returns Middleware ID for later removal
   */
  add(
    pattern: string,
    position: "before" | "after",
    handler: PluginMiddlewareHandler
  ): string;

  /**
   * Remove a middleware by ID
   * @param id - Middleware ID returned from add()
   */
  remove(id: string): boolean;

  /**
   * Remove all middleware registered by this plugin
   */
  removeAll(): number;

  /**
   * List all middleware registered by this plugin
   */
  list(): RegisteredMiddleware[];

  /**
   * Check if middleware exists
   */
  has(id: string): boolean;
}

// ============================================================================
// EVENTS
// ============================================================================

export enum PluginEvent {
  // Plugin lifecycle
  PLUGIN_LOADED = "plugin:loaded",
  PLUGIN_UNLOADED = "plugin:unloaded",
  PLUGIN_ENABLED = "plugin:enabled",
  PLUGIN_DISABLED = "plugin:disabled",

  // Project events
  PROJECT_CREATED = "project:created",
  PROJECT_UPDATED = "project:updated",
  PROJECT_DELETED = "project:deleted",

  // Framework events
  FRAMEWORK_ADDED = "framework:added",
  FRAMEWORK_REMOVED = "framework:removed",
  FRAMEWORK_PROGRESS_CHANGED = "framework:progress_changed",

  // Assessment events
  ASSESSMENT_UPDATED = "assessment:updated",
  QUESTION_ANSWERED = "question:answered",

  // Control events
  CONTROL_UPDATED = "control:updated",
  SUBCONTROL_UPDATED = "subcontrol:updated",

  // Risk events (project-level risks)
  RISK_CREATED = "risk:created",
  RISK_UPDATED = "risk:updated",
  RISK_DELETED = "risk:deleted",
  RISK_MITIGATED = "risk:mitigated",

  // Vendor events
  VENDOR_CREATED = "vendor:created",
  VENDOR_UPDATED = "vendor:updated",
  VENDOR_DELETED = "vendor:deleted",

  // Vendor Risk events
  VENDOR_RISK_CREATED = "vendor_risk:created",
  VENDOR_RISK_UPDATED = "vendor_risk:updated",
  VENDOR_RISK_DELETED = "vendor_risk:deleted",
  VENDOR_RISK_MITIGATED = "vendor_risk:mitigated",

  // Model Risk events
  MODEL_RISK_CREATED = "model_risk:created",
  MODEL_RISK_UPDATED = "model_risk:updated",
  MODEL_RISK_DELETED = "model_risk:deleted",
  MODEL_RISK_MITIGATED = "model_risk:mitigated",

  // Model Inventory events
  MODEL_CREATED = "model:created",
  MODEL_UPDATED = "model:updated",
  MODEL_DELETED = "model:deleted",
  MODEL_STATUS_CHANGED = "model:status_changed",

  // Incident events
  INCIDENT_CREATED = "incident:created",
  INCIDENT_UPDATED = "incident:updated",
  INCIDENT_DELETED = "incident:deleted",
  INCIDENT_RESOLVED = "incident:resolved",

  // Policy events
  POLICY_CREATED = "policy:created",
  POLICY_UPDATED = "policy:updated",
  POLICY_DELETED = "policy:deleted",
  POLICY_PUBLISHED = "policy:published",

  // Task events
  TASK_CREATED = "task:created",
  TASK_UPDATED = "task:updated",
  TASK_DELETED = "task:deleted",
  TASK_COMPLETED = "task:completed",
  TASK_ASSIGNED = "task:assigned",

  // Training events
  TRAINING_CREATED = "training:created",
  TRAINING_UPDATED = "training:updated",
  TRAINING_DELETED = "training:deleted",
  TRAINING_COMPLETED = "training:completed",
  TRAINING_ASSIGNED = "training:assigned",

  // Notes events
  NOTE_CREATED = "note:created",
  NOTE_UPDATED = "note:updated",
  NOTE_DELETED = "note:deleted",

  // File/Evidence events
  FILE_UPLOADED = "file:uploaded",
  FILE_UPDATED = "file:updated",
  FILE_DELETED = "file:deleted",

  // User events
  USER_LOGIN = "user:login",
  USER_LOGOUT = "user:logout",
  USER_CREATED = "user:created",
  USER_UPDATED = "user:updated",
  USER_DELETED = "user:deleted",

  // Report events
  REPORT_GENERATED = "report:generated",
  REPORT_EXPORTED = "report:exported",
}

// ============================================================================
// BASE EVENT PAYLOAD TYPE (Option C: Full entity + triggeredBy + timestamp)
// ============================================================================

/**
 * User reference for event payloads
 */
export interface EventTriggeredBy {
  userId: number;
  email?: string;
  name?: string;
}

/**
 * Base event payload structure - all events include these fields
 */
export interface BaseEventPayload {
  tenant: string;
  timestamp: Date;
  triggeredBy: EventTriggeredBy;
}

export interface EventPayloads {
  // Plugin lifecycle events (system-triggered, no triggeredBy)
  [PluginEvent.PLUGIN_LOADED]: { pluginId: string; timestamp: Date };
  [PluginEvent.PLUGIN_UNLOADED]: { pluginId: string; timestamp: Date };
  [PluginEvent.PLUGIN_ENABLED]: { pluginId: string; timestamp: Date };
  [PluginEvent.PLUGIN_DISABLED]: { pluginId: string; timestamp: Date };

  // Project events
  [PluginEvent.PROJECT_CREATED]: BaseEventPayload & {
    projectId: number;
    project: Record<string, unknown>;
  };
  [PluginEvent.PROJECT_UPDATED]: BaseEventPayload & {
    projectId: number;
    project: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.PROJECT_DELETED]: BaseEventPayload & {
    projectId: number;
    project: Record<string, unknown>; // Snapshot before deletion
  };

  // Framework events
  [PluginEvent.FRAMEWORK_ADDED]: BaseEventPayload & {
    projectId: number;
    projectFrameworkId: number;
    frameworkId: number;
    framework: Record<string, unknown>;
  };
  [PluginEvent.FRAMEWORK_REMOVED]: BaseEventPayload & {
    projectId: number;
    projectFrameworkId: number;
    frameworkId: number;
    framework: Record<string, unknown>; // Snapshot before removal
  };
  [PluginEvent.FRAMEWORK_PROGRESS_CHANGED]: BaseEventPayload & {
    projectId: number;
    projectFrameworkId: number;
    frameworkId: number;
    previousProgress: number;
    progress: number;
  };

  // Assessment events
  [PluginEvent.ASSESSMENT_UPDATED]: BaseEventPayload & {
    projectId: number;
    assessmentId: number;
    assessment: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.QUESTION_ANSWERED]: BaseEventPayload & {
    projectId: number;
    questionId: number;
    question: Record<string, unknown>;
    answer: string;
    previousAnswer?: string;
  };

  // Control events
  [PluginEvent.CONTROL_UPDATED]: BaseEventPayload & {
    projectId: number;
    controlId: number;
    control: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.SUBCONTROL_UPDATED]: BaseEventPayload & {
    projectId: number;
    subcontrolId: number;
    subcontrol: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };

  // Risk events (project-level)
  [PluginEvent.RISK_CREATED]: BaseEventPayload & {
    riskId: number;
    projectId: number;
    risk: Record<string, unknown>;
  };
  [PluginEvent.RISK_UPDATED]: BaseEventPayload & {
    riskId: number;
    projectId: number;
    risk: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.RISK_DELETED]: BaseEventPayload & {
    riskId: number;
    projectId: number;
    risk: Record<string, unknown>; // Snapshot before deletion
  };
  [PluginEvent.RISK_MITIGATED]: BaseEventPayload & {
    riskId: number;
    projectId: number;
    risk: Record<string, unknown>;
    mitigationStatus: string;
    previousStatus: string;
  };

  // Vendor events
  [PluginEvent.VENDOR_CREATED]: BaseEventPayload & {
    vendorId: number;
    projectId: number;
    vendor: Record<string, unknown>;
  };
  [PluginEvent.VENDOR_UPDATED]: BaseEventPayload & {
    vendorId: number;
    projectId: number;
    vendor: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.VENDOR_DELETED]: BaseEventPayload & {
    vendorId: number;
    projectId: number;
    vendor: Record<string, unknown>; // Snapshot before deletion
  };

  // Vendor Risk events
  [PluginEvent.VENDOR_RISK_CREATED]: BaseEventPayload & {
    vendorRiskId: number;
    vendorId: number;
    projectId: number;
    vendorRisk: Record<string, unknown>;
  };
  [PluginEvent.VENDOR_RISK_UPDATED]: BaseEventPayload & {
    vendorRiskId: number;
    vendorId: number;
    projectId: number;
    vendorRisk: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.VENDOR_RISK_DELETED]: BaseEventPayload & {
    vendorRiskId: number;
    vendorId: number;
    projectId: number;
    vendorRisk: Record<string, unknown>;
  };
  [PluginEvent.VENDOR_RISK_MITIGATED]: BaseEventPayload & {
    vendorRiskId: number;
    vendorId: number;
    projectId: number;
    vendorRisk: Record<string, unknown>;
    mitigationStatus: string;
    previousStatus: string;
  };

  // Model Risk events
  [PluginEvent.MODEL_RISK_CREATED]: BaseEventPayload & {
    modelRiskId: number;
    modelId: number;
    projectId: number;
    modelRisk: Record<string, unknown>;
  };
  [PluginEvent.MODEL_RISK_UPDATED]: BaseEventPayload & {
    modelRiskId: number;
    modelId: number;
    projectId: number;
    modelRisk: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.MODEL_RISK_DELETED]: BaseEventPayload & {
    modelRiskId: number;
    modelId: number;
    projectId: number;
    modelRisk: Record<string, unknown>;
  };
  [PluginEvent.MODEL_RISK_MITIGATED]: BaseEventPayload & {
    modelRiskId: number;
    modelId: number;
    projectId: number;
    modelRisk: Record<string, unknown>;
    mitigationStatus: string;
    previousStatus: string;
  };

  // Model Inventory events
  [PluginEvent.MODEL_CREATED]: BaseEventPayload & {
    modelId: number;
    projectId: number;
    model: Record<string, unknown>;
  };
  [PluginEvent.MODEL_UPDATED]: BaseEventPayload & {
    modelId: number;
    projectId: number;
    model: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.MODEL_DELETED]: BaseEventPayload & {
    modelId: number;
    projectId: number;
    model: Record<string, unknown>;
  };
  [PluginEvent.MODEL_STATUS_CHANGED]: BaseEventPayload & {
    modelId: number;
    projectId: number;
    model: Record<string, unknown>;
    previousStatus: string;
    newStatus: string;
  };

  // Incident events
  [PluginEvent.INCIDENT_CREATED]: BaseEventPayload & {
    incidentId: number;
    projectId?: number;
    incident: Record<string, unknown>;
  };
  [PluginEvent.INCIDENT_UPDATED]: BaseEventPayload & {
    incidentId: number;
    projectId?: number;
    incident: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.INCIDENT_DELETED]: BaseEventPayload & {
    incidentId: number;
    projectId?: number;
    incident: Record<string, unknown>;
  };
  [PluginEvent.INCIDENT_RESOLVED]: BaseEventPayload & {
    incidentId: number;
    projectId?: number;
    incident: Record<string, unknown>;
    resolution: string;
  };

  // Policy events
  [PluginEvent.POLICY_CREATED]: BaseEventPayload & {
    policyId: number;
    projectId?: number;
    policy: Record<string, unknown>;
  };
  [PluginEvent.POLICY_UPDATED]: BaseEventPayload & {
    policyId: number;
    projectId?: number;
    policy: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.POLICY_DELETED]: BaseEventPayload & {
    policyId: number;
    projectId?: number;
    policy: Record<string, unknown>;
  };
  [PluginEvent.POLICY_PUBLISHED]: BaseEventPayload & {
    policyId: number;
    projectId?: number;
    policy: Record<string, unknown>;
    version: string;
  };

  // Task events
  [PluginEvent.TASK_CREATED]: BaseEventPayload & {
    taskId: number;
    projectId?: number;
    task: Record<string, unknown>;
  };
  [PluginEvent.TASK_UPDATED]: BaseEventPayload & {
    taskId: number;
    projectId?: number;
    task: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.TASK_DELETED]: BaseEventPayload & {
    taskId: number;
    projectId?: number;
    task: Record<string, unknown>;
  };
  [PluginEvent.TASK_COMPLETED]: BaseEventPayload & {
    taskId: number;
    projectId?: number;
    task: Record<string, unknown>;
  };
  [PluginEvent.TASK_ASSIGNED]: BaseEventPayload & {
    taskId: number;
    projectId?: number;
    task: Record<string, unknown>;
    assigneeId: number;
    previousAssigneeId?: number;
  };

  // Training events
  [PluginEvent.TRAINING_CREATED]: BaseEventPayload & {
    trainingId: number;
    training: Record<string, unknown>;
  };
  [PluginEvent.TRAINING_UPDATED]: BaseEventPayload & {
    trainingId: number;
    training: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.TRAINING_DELETED]: BaseEventPayload & {
    trainingId: number;
    training: Record<string, unknown>;
  };
  [PluginEvent.TRAINING_COMPLETED]: BaseEventPayload & {
    trainingId: number;
    training: Record<string, unknown>;
    completedByUserId: number;
  };
  [PluginEvent.TRAINING_ASSIGNED]: BaseEventPayload & {
    trainingId: number;
    training: Record<string, unknown>;
    assignedUserIds: number[];
  };

  // Notes events
  [PluginEvent.NOTE_CREATED]: BaseEventPayload & {
    noteId: number;
    entityType: string; // What entity the note is attached to
    entityId: number;
    note: Record<string, unknown>;
  };
  [PluginEvent.NOTE_UPDATED]: BaseEventPayload & {
    noteId: number;
    entityType: string;
    entityId: number;
    note: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.NOTE_DELETED]: BaseEventPayload & {
    noteId: number;
    entityType: string;
    entityId: number;
    note: Record<string, unknown>;
  };

  // File/Evidence events
  [PluginEvent.FILE_UPLOADED]: BaseEventPayload & {
    fileId: number;
    entityType?: string; // What entity the file is attached to
    entityId?: number;
    file: Record<string, unknown>;
  };
  [PluginEvent.FILE_UPDATED]: BaseEventPayload & {
    fileId: number;
    entityType?: string;
    entityId?: number;
    file: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.FILE_DELETED]: BaseEventPayload & {
    fileId: number;
    entityType?: string;
    entityId?: number;
    file: Record<string, unknown>;
  };

  // User events
  [PluginEvent.USER_LOGIN]: BaseEventPayload & {
    userId: number;
    user: Record<string, unknown>;
  };
  [PluginEvent.USER_LOGOUT]: BaseEventPayload & {
    userId: number;
  };
  [PluginEvent.USER_CREATED]: BaseEventPayload & {
    userId: number;
    user: Record<string, unknown>;
  };
  [PluginEvent.USER_UPDATED]: BaseEventPayload & {
    userId: number;
    user: Record<string, unknown>;
    changes: Record<string, { before: unknown; after: unknown }>;
  };
  [PluginEvent.USER_DELETED]: BaseEventPayload & {
    userId: number;
    user: Record<string, unknown>;
  };

  // Report events
  [PluginEvent.REPORT_GENERATED]: BaseEventPayload & {
    reportId: number;
    reportType: string;
    projectId: number;
    report: Record<string, unknown>;
  };
  [PluginEvent.REPORT_EXPORTED]: BaseEventPayload & {
    reportId: number;
    format: string;
    projectId: number;
    report: Record<string, unknown>;
  };
}

export type EventHandler<E extends PluginEvent> = (
  payload: EventPayloads[E],
  context: PluginContext
) => Promise<void>;

export type EventHandlerMap = {
  [E in PluginEvent]?: EventHandler<E>;
};

// ============================================================================
// FILTERS
// ============================================================================

export enum PluginFilter {
  // Risk filters
  RISK_BEFORE_SAVE = "risk:before_save",
  RISK_AFTER_LOAD = "risk:after_load",
  RISK_BEFORE_EXPORT = "risk:before_export",

  // Project filters
  PROJECT_BEFORE_SAVE = "project:before_save",
  PROJECT_AFTER_LOAD = "project:after_load",

  // Assessment filters
  ASSESSMENT_BEFORE_SAVE = "assessment:before_save",
  ASSESSMENT_CALCULATE_SCORE = "assessment:calculate_score",

  // Report filters
  REPORT_BEFORE_GENERATE = "report:before_generate",
  REPORT_AFTER_GENERATE = "report:after_generate",

  // Control filters
  CONTROL_BEFORE_SAVE = "control:before_save",
  CONTROL_CALCULATE_STATUS = "control:calculate_status",

  // Vendor filters
  VENDOR_BEFORE_SAVE = "vendor:before_save",
  VENDOR_AFTER_LOAD = "vendor:after_load",

  // User data filters
  USER_DATA_BEFORE_EXPORT = "user:data_before_export",
}

export interface FilterPayloads {
  [PluginFilter.RISK_BEFORE_SAVE]: {
    risk: Record<string, unknown>;
    projectId: number;
    userId: number;
    isNew: boolean;
  };
  [PluginFilter.RISK_AFTER_LOAD]: {
    risk: Record<string, unknown>;
    includeMetadata: boolean;
  };
  [PluginFilter.RISK_BEFORE_EXPORT]: {
    risk: Record<string, unknown>;
    format: string;
  };

  [PluginFilter.PROJECT_BEFORE_SAVE]: {
    project: Record<string, unknown>;
    userId: number;
    isNew: boolean;
  };
  [PluginFilter.PROJECT_AFTER_LOAD]: {
    project: Record<string, unknown>;
    includeMetadata: boolean;
  };

  [PluginFilter.ASSESSMENT_BEFORE_SAVE]: {
    assessment: Record<string, unknown>;
    projectId: number;
    userId: number;
  };
  [PluginFilter.ASSESSMENT_CALCULATE_SCORE]: {
    projectId: number;
    frameworkId: number;
    answers: Record<string, unknown>[];
    baseScore: number;
  };

  [PluginFilter.REPORT_BEFORE_GENERATE]: {
    reportType: string;
    projectId: number;
    sections: Record<string, unknown>[];
    options: Record<string, unknown>;
  };
  [PluginFilter.REPORT_AFTER_GENERATE]: {
    report: Record<string, unknown>;
    projectId: number;
    options: Record<string, unknown>;
  };

  [PluginFilter.CONTROL_BEFORE_SAVE]: {
    control: Record<string, unknown>;
    projectId: number;
    userId: number;
  };
  [PluginFilter.CONTROL_CALCULATE_STATUS]: {
    controlId: number;
    subcontrols: Record<string, unknown>[];
    currentStatus: string;
  };

  [PluginFilter.VENDOR_BEFORE_SAVE]: {
    vendor: Record<string, unknown>;
    projectId: number;
    userId: number;
    isNew: boolean;
  };
  [PluginFilter.VENDOR_AFTER_LOAD]: {
    vendor: Record<string, unknown>;
    includeMetadata: boolean;
  };

  [PluginFilter.USER_DATA_BEFORE_EXPORT]: {
    userId: number;
    data: Record<string, unknown>;
    format: "json" | "csv" | "pdf";
  };
}

export type FilterHandler<F extends PluginFilter> = (
  data: FilterPayloads[F]
) => Promise<FilterPayloads[F]>;

export type FilterHandlerMap = {
  [F in PluginFilter]?: FilterHandler<F>;
};

// ============================================================================
// FRAMEWORK TYPES
// ============================================================================

export interface FrameworkCreateOptions {
  enableAI?: boolean;
  customConfig?: Record<string, unknown>;
}

export interface FrameworkData {
  assessmentTracker?: unknown;
  complianceTracker?: unknown;
  [key: string]: unknown;
}

export interface ReportData {
  sections: ReportSection[];
  summary: ReportSummary;
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  id: string;
  title: string;
  content: unknown;
  order: number;
}

export interface ReportSummary {
  overallScore: number;
  completionPercentage: number;
  findings: string[];
}

export interface FrameworkStructure {
  topics: unknown[];
  questions: unknown[];
  controls: unknown[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ProgressInfo {
  overall: number;
  bySection: Record<string, number>;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface ConnectionResult {
  success: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncOptions {
  fullSync?: boolean;
  since?: Date;
  entities?: string[];
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  timestamp: Date;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

export interface PluginState {
  plugin: Plugin;
  enabled: boolean;
  installed: boolean;
  loadedAt?: Date;
  enabledAt?: Date;
  config: Record<string, unknown>;
}

export interface QueuedEvent {
  event: PluginEvent;
  payload: EventPayloads[PluginEvent];
}

export interface FilterHandlerEntry<F extends PluginFilter> {
  handler: FilterHandler<F>;
  priority: number;
  pluginId: string;
}
