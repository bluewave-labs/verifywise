/**
 * VerifyWise Plugin System - Model Manager
 *
 * Provides Sequelize model capabilities for plugins.
 * Each plugin can define its own models with auto-prefixed table names.
 */

import { Sequelize, Model, ModelStatic, DataTypes, ModelAttributes, InitOptions, ModelAttributeColumnOptions } from "sequelize";
import {
  PluginModelAPI,
  PluginModelAttributes,
  PluginModelAttributeDefinition,
  PluginModelOptions,
  PluginLogger,
} from "./types";

/**
 * Maps our simplified type names to Sequelize DataTypes
 * Supports both uppercase (STRING) and lowercase (string) for convenience
 */
const typeMap: Record<string, typeof DataTypes[keyof typeof DataTypes]> = {
  // Uppercase variants
  STRING: DataTypes.STRING,
  TEXT: DataTypes.TEXT,
  INTEGER: DataTypes.INTEGER,
  BIGINT: DataTypes.BIGINT,
  FLOAT: DataTypes.FLOAT,
  DOUBLE: DataTypes.DOUBLE,
  DECIMAL: DataTypes.DECIMAL,
  BOOLEAN: DataTypes.BOOLEAN,
  DATE: DataTypes.DATE,
  DATEONLY: DataTypes.DATEONLY,
  JSON: DataTypes.JSON,
  JSONB: DataTypes.JSONB,
  UUID: DataTypes.UUID,
  ENUM: DataTypes.ENUM,
  // Lowercase variants (for convenience)
  string: DataTypes.STRING,
  text: DataTypes.TEXT,
  integer: DataTypes.INTEGER,
  bigint: DataTypes.BIGINT,
  float: DataTypes.FLOAT,
  double: DataTypes.DOUBLE,
  decimal: DataTypes.DECIMAL,
  boolean: DataTypes.BOOLEAN,
  date: DataTypes.DATE,
  dateonly: DataTypes.DATEONLY,
  json: DataTypes.JSON,
  jsonb: DataTypes.JSONB,
  uuid: DataTypes.UUID,
  enum: DataTypes.ENUM,
};

/**
 * Core models that plugins can reference
 */
const coreModelNames = [
  "User",
  "Project",
  "Risk",
  "Vendor",
  "VendorRisk",
  "Model",
  "ModelRisk",
  "Task",
  "Incident",
  "Policy",
  "Training",
  "Note",
  "File",
];

/**
 * Plugin Model Manager
 *
 * Manages Sequelize models for a specific plugin.
 * Tables are prefixed with plugin_{pluginId}_ to avoid conflicts.
 */
export class PluginModelManager implements PluginModelAPI {
  private pluginId: string;
  private sequelize: Sequelize;
  private logger: PluginLogger;
  private models: Map<string, ModelStatic<Model>> = new Map();
  private coreModels: Map<string, ModelStatic<Model>> = new Map();

  constructor(
    pluginId: string,
    sequelize: Sequelize,
    logger: PluginLogger,
    coreModelsRegistry?: Map<string, ModelStatic<Model>>
  ) {
    this.pluginId = pluginId;
    this.sequelize = sequelize;
    this.logger = logger;

    // Load core models if provided
    if (coreModelsRegistry) {
      this.coreModels = coreModelsRegistry;
    }
  }

  /**
   * Define a new model for this plugin
   */
  define(
    name: string,
    attributes: PluginModelAttributes,
    options?: PluginModelOptions
  ): void {
    const tableName = this.getTableName(name);

    this.logger.debug(`Defining model "${name}" with table "${tableName}"`);

    // Convert our simplified attributes to Sequelize format
    const sequelizeAttributes = this.convertAttributes(attributes);

    // Convert options - note: sequelize.define() handles the sequelize instance
    const sequelizeOptions: InitOptions<Model> = {
      sequelize: this.sequelize,
      modelName: name,
      tableName,
      timestamps: options?.timestamps ?? true,
      paranoid: options?.paranoid ?? false,
      indexes: options?.indexes,
    };

    // Define the model
    const ModelClass = this.sequelize.define(name, sequelizeAttributes, sequelizeOptions);

    this.models.set(name, ModelClass);
    this.logger.info(`Model "${name}" defined with table "${tableName}"`);
  }

  /**
   * Get a previously defined model
   */
  get<T = ModelStatic<Model>>(name: string): T | undefined {
    return this.models.get(name) as T | undefined;
  }

  /**
   * Get a core VerifyWise model
   */
  getCoreModel<T = ModelStatic<Model>>(name: string): T | undefined {
    if (!coreModelNames.includes(name)) {
      this.logger.warn(`Unknown core model: ${name}`);
      return undefined;
    }

    // Try to get from registry
    if (this.coreModels.has(name)) {
      return this.coreModels.get(name) as T | undefined;
    }

    // Try to get from sequelize models
    const model = this.sequelize.models[name];
    if (model) {
      return model as unknown as T;
    }

    this.logger.warn(`Core model "${name}" not found in registry`);
    return undefined;
  }

  /**
   * Sync all defined models to the database
   */
  async sync(options?: { force?: boolean; alter?: boolean }): Promise<void> {
    const modelCount = this.models.size;
    this.logger.info(`Syncing ${modelCount} models for plugin "${this.pluginId}"...`);

    for (const [name, model] of this.models) {
      try {
        await model.sync({
          force: options?.force ?? false,
          alter: options?.alter ?? false,
        });
        this.logger.debug(`Synced model "${name}"`);
      } catch (error) {
        this.logger.error(`Failed to sync model "${name}":`, { error });
        throw error;
      }
    }

    this.logger.info(`Successfully synced ${modelCount} models`);
  }

  /**
   * Drop all tables created by this plugin
   */
  async dropAll(): Promise<void> {
    const modelCount = this.models.size;
    this.logger.warn(`Dropping ${modelCount} tables for plugin "${this.pluginId}"...`);

    for (const [name, model] of this.models) {
      try {
        await model.drop();
        this.logger.debug(`Dropped table for model "${name}"`);
      } catch (error) {
        this.logger.error(`Failed to drop table for model "${name}":`, { error });
        throw error;
      }
    }

    this.models.clear();
    this.logger.info(`Successfully dropped ${modelCount} tables`);
  }

  /**
   * List all models defined by this plugin
   */
  list(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Check if a model is defined
   */
  has(name: string): boolean {
    return this.models.has(name);
  }

  /**
   * Get the prefixed table name for a model
   */
  private getTableName(modelName: string): string {
    // Convert model name to snake_case for table name
    const snakeCaseName = modelName
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");

    return `plugin_${this.pluginId.replace(/-/g, "_")}_${snakeCaseName}`;
  }

  /**
   * Convert our simplified attributes to Sequelize format
   */
  private convertAttributes(
    attributes: PluginModelAttributes
  ): ModelAttributes<Model> {
    const result: ModelAttributes<Model> = {};

    for (const [key, def] of Object.entries(attributes)) {
      result[key] = this.convertAttributeDefinition(def);
    }

    return result;
  }

  /**
   * Convert a single attribute definition
   */
  private convertAttributeDefinition(
    def: PluginModelAttributeDefinition
  ): ModelAttributeColumnOptions {
    const result: ModelAttributeColumnOptions = {} as ModelAttributeColumnOptions;

    // Handle ENUM type specially
    if (def.type === "ENUM" && def.values) {
      result.type = DataTypes.ENUM(...def.values);
    } else {
      const dataType = typeMap[def.type];
      if (!dataType) {
        throw new Error(`Unknown data type: ${def.type}`);
      }
      result.type = dataType;
    }

    // Copy other options
    if (def.allowNull !== undefined) result.allowNull = def.allowNull;
    if (def.defaultValue !== undefined) result.defaultValue = def.defaultValue;
    if (def.primaryKey !== undefined) result.primaryKey = def.primaryKey;
    if (def.autoIncrement !== undefined) result.autoIncrement = def.autoIncrement;
    if (def.unique !== undefined) result.unique = def.unique;

    // Handle references (foreign keys)
    if (def.references) {
      result.references = {
        model: def.references.model,
        key: def.references.key,
      };
      if (def.onDelete) result.onDelete = def.onDelete;
      if (def.onUpdate) result.onUpdate = def.onUpdate;
    }

    return result;
  }

  /**
   * Set up associations between plugin models
   */
  associate(
    modelName: string,
    associationType: "belongsTo" | "hasOne" | "hasMany" | "belongsToMany",
    targetModelName: string,
    options?: Record<string, unknown>
  ): void {
    const sourceModel = this.models.get(modelName);
    if (!sourceModel) {
      throw new Error(`Model "${modelName}" not found`);
    }

    // Try plugin models first, then core models
    let targetModel = this.models.get(targetModelName);
    if (!targetModel) {
      targetModel = this.getCoreModel(targetModelName);
    }
    if (!targetModel) {
      throw new Error(`Target model "${targetModelName}" not found`);
    }

    // Create the association
    switch (associationType) {
      case "belongsTo":
        (sourceModel as unknown as { belongsTo: (target: ModelStatic<Model>, opts?: Record<string, unknown>) => void }).belongsTo(targetModel, options);
        break;
      case "hasOne":
        (sourceModel as unknown as { hasOne: (target: ModelStatic<Model>, opts?: Record<string, unknown>) => void }).hasOne(targetModel, options);
        break;
      case "hasMany":
        (sourceModel as unknown as { hasMany: (target: ModelStatic<Model>, opts?: Record<string, unknown>) => void }).hasMany(targetModel, options);
        break;
      case "belongsToMany":
        (sourceModel as unknown as { belongsToMany: (target: ModelStatic<Model>, opts?: Record<string, unknown>) => void }).belongsToMany(targetModel, options);
        break;
    }

    this.logger.debug(`Created ${associationType} association: ${modelName} -> ${targetModelName}`);
  }
}

/**
 * Global registry for plugin model managers
 */
export class PluginModelRegistry {
  private managers: Map<string, PluginModelManager> = new Map();
  private sequelize: Sequelize;
  private coreModels: Map<string, ModelStatic<Model>> = new Map();

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.loadCoreModels();
  }

  /**
   * Load core models from sequelize
   */
  private loadCoreModels(): void {
    for (const modelName of coreModelNames) {
      const model = this.sequelize.models[modelName];
      if (model) {
        this.coreModels.set(modelName, model);
      }
    }
  }

  /**
   * Get or create a model manager for a plugin
   */
  getManager(pluginId: string, logger: PluginLogger): PluginModelManager {
    if (!this.managers.has(pluginId)) {
      const manager = new PluginModelManager(
        pluginId,
        this.sequelize,
        logger,
        this.coreModels
      );
      this.managers.set(pluginId, manager);
    }
    return this.managers.get(pluginId)!;
  }

  /**
   * Remove a model manager when plugin is uninstalled
   */
  removeManager(pluginId: string): boolean {
    return this.managers.delete(pluginId);
  }

  /**
   * Get stats about registered models
   */
  getStats(): { pluginCount: number; totalModels: number } {
    let totalModels = 0;
    for (const manager of this.managers.values()) {
      totalModels += manager.list().length;
    }
    return {
      pluginCount: this.managers.size,
      totalModels,
    };
  }
}
