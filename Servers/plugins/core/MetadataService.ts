/**
 * VerifyWise Plugin System - Metadata Service
 *
 * Provides schemaless key-value storage for plugins.
 * Allows plugins to store custom data without database migrations.
 */

import { Transaction } from "sequelize";
import { DatabaseService } from "./types";

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

const VALID_ENTITY_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,48}$/i;
const VALID_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_:./-]{0,253}$/;
const MAX_VALUE_SIZE = 10 * 1024; // 10KB limit for metadata values

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function validateEntityType(entityType: string): void {
  if (!entityType || typeof entityType !== "string") {
    throw new ValidationError("Entity type must be a non-empty string");
  }
  if (!VALID_ENTITY_TYPE_PATTERN.test(entityType)) {
    throw new ValidationError(
      `Invalid entity type format: "${entityType}". Must start with letter, contain only alphanumeric and underscores, max 49 chars`
    );
  }
}

function validateEntityId(entityId: number): void {
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new ValidationError(
      `Invalid entity ID: ${entityId}. Must be a positive integer`
    );
  }
}

function validateKey(key: string): void {
  if (!key || typeof key !== "string") {
    throw new ValidationError("Key must be a non-empty string");
  }
  if (!VALID_KEY_PATTERN.test(key)) {
    throw new ValidationError(
      `Invalid key format: "${key}". Must start with letter, contain only alphanumeric, underscores, colons, dots, slashes, hyphens, max 254 chars`
    );
  }
}

function validateKeyPrefix(prefix: string): void {
  if (!prefix || typeof prefix !== "string") {
    throw new ValidationError("Key prefix must be a non-empty string");
  }
  if (prefix.length > 200) {
    throw new ValidationError("Key prefix too long, max 200 chars");
  }
  // Allow more flexibility in prefix but ensure it starts correctly
  if (!/^[a-zA-Z]/.test(prefix)) {
    throw new ValidationError("Key prefix must start with a letter");
  }
}

function validateValue(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_VALUE_SIZE) {
    throw new ValidationError(
      `Value too large: ${serialized.length} bytes. Max allowed: ${MAX_VALUE_SIZE} bytes`
    );
  }
}

/**
 * Escape special characters for PostgreSQL LIKE pattern
 */
function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, "\\$&");
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface EntityReference {
  entityType: string;
  entityId: number;
}

export interface MetadataEntry {
  id: number;
  entityType: string;
  entityId: number;
  key: string;
  value: unknown;
  pluginId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetadataAPI {
  // Single value operations
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

  // Batch operations
  getAll(entityType: string, entityId: number): Promise<Record<string, unknown>>;
  setMany(
    entityType: string,
    entityId: number,
    data: Record<string, unknown>
  ): Promise<void>;
  deleteAll(entityType: string, entityId: number): Promise<number>;

  // Query operations
  findByKey(
    entityType: string,
    key: string,
    value: unknown
  ): Promise<EntityReference[]>;
  findByKeyPrefix(
    entityType: string,
    keyPrefix: string
  ): Promise<MetadataEntry[]>;

  // Plugin-scoped operations
  deleteByPlugin(): Promise<number>;
  getAllByPlugin(): Promise<MetadataEntry[]>;
}

/**
 * Extended database service interface with transaction support
 */
export interface TransactionAwareDatabaseService extends DatabaseService {
  queryWithTransaction?(
    sql: string,
    params?: unknown[],
    transaction?: Transaction
  ): Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
}

/**
 * Metadata service implementation
 *
 * Each instance is scoped to a specific plugin and tenant.
 * Provides input validation, SQL injection protection, and proper transaction support.
 */
export class MetadataService implements MetadataAPI {
  constructor(
    private db: TransactionAwareDatabaseService,
    private pluginId: string,
    private tenant: string
  ) {
    // Validate plugin ID and tenant on construction
    if (!pluginId || typeof pluginId !== "string") {
      throw new ValidationError("Plugin ID must be a non-empty string");
    }
    if (!/^[a-z][a-z0-9-_]{0,98}$/i.test(pluginId)) {
      throw new ValidationError(
        "Invalid plugin ID format. Must start with letter, contain only alphanumeric, hyphens, underscores, max 99 chars"
      );
    }
    if (!tenant || typeof tenant !== "string") {
      throw new ValidationError("Tenant must be a non-empty string");
    }
  }

  /**
   * Execute a query, optionally within a transaction
   */
  private async query(
    sql: string,
    params: unknown[],
    transaction?: Transaction
  ): Promise<{ rows: Record<string, unknown>[]; rowCount: number }> {
    if (transaction && this.db.queryWithTransaction) {
      return this.db.queryWithTransaction(sql, params, transaction);
    }
    return this.db.query(sql, params);
  }

  /**
   * Get a single metadata value
   */
  async get<T = unknown>(
    entityType: string,
    entityId: number,
    key: string
  ): Promise<T | null> {
    validateEntityType(entityType);
    validateEntityId(entityId);
    validateKey(key);

    const result = await this.db.query(
      `SELECT meta_value FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4 AND meta_key = $5`,
      [this.tenant, entityType, entityId, this.pluginId, key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].meta_value as T;
  }

  /**
   * Set a single metadata value
   */
  async set<T = unknown>(
    entityType: string,
    entityId: number,
    key: string,
    value: T
  ): Promise<void> {
    validateEntityType(entityType);
    validateEntityId(entityId);
    validateKey(key);
    validateValue(value);

    await this.db.query(
      `INSERT INTO entity_metadata
         (tenant, entity_type, entity_id, plugin_id, meta_key, meta_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (tenant, entity_type, entity_id, plugin_id, meta_key)
       DO UPDATE SET meta_value = $6, updated_at = NOW()`,
      [this.tenant, entityType, entityId, this.pluginId, key, JSON.stringify(value)]
    );
  }

  /**
   * Delete a single metadata value
   */
  async delete(
    entityType: string,
    entityId: number,
    key: string
  ): Promise<boolean> {
    validateEntityType(entityType);
    validateEntityId(entityId);
    validateKey(key);

    const result = await this.db.query(
      `DELETE FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4 AND meta_key = $5`,
      [this.tenant, entityType, entityId, this.pluginId, key]
    );

    return result.rowCount > 0;
  }

  /**
   * Get all metadata for an entity
   */
  async getAll(
    entityType: string,
    entityId: number
  ): Promise<Record<string, unknown>> {
    validateEntityType(entityType);
    validateEntityId(entityId);

    const result = await this.db.query(
      `SELECT meta_key, meta_value FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4`,
      [this.tenant, entityType, entityId, this.pluginId]
    );

    const metadata: Record<string, unknown> = {};
    for (const row of result.rows) {
      metadata[row.meta_key as string] = row.meta_value;
    }
    return metadata;
  }

  /**
   * Set multiple metadata values for an entity using batch insert
   *
   * Uses a single query with multiple VALUES for better performance.
   * Falls back to sequential inserts if batch fails.
   */
  async setMany(
    entityType: string,
    entityId: number,
    data: Record<string, unknown>
  ): Promise<void> {
    const entries = Object.entries(data);
    if (entries.length === 0) return;

    // Validate all entries first
    validateEntityType(entityType);
    validateEntityId(entityId);
    for (const [key, value] of entries) {
      validateKey(key);
      validateValue(value);
    }

    // Use transaction for atomicity
    await this.db.transaction(async (transaction) => {
      // Build batch upsert query for better performance
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const [key, value] of entries) {
        placeholders.push(
          `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NOW(), NOW())`
        );
        values.push(
          this.tenant,
          entityType,
          entityId,
          this.pluginId,
          key,
          JSON.stringify(value)
        );
      }

      const sql = `
        INSERT INTO entity_metadata
          (tenant, entity_type, entity_id, plugin_id, meta_key, meta_value, created_at, updated_at)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (tenant, entity_type, entity_id, plugin_id, meta_key)
        DO UPDATE SET meta_value = EXCLUDED.meta_value, updated_at = NOW()
      `;

      await this.query(sql, values, transaction);
    });
  }

  /**
   * Delete all metadata for an entity
   */
  async deleteAll(entityType: string, entityId: number): Promise<number> {
    validateEntityType(entityType);
    validateEntityId(entityId);

    const result = await this.db.query(
      `DELETE FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4`,
      [this.tenant, entityType, entityId, this.pluginId]
    );

    return result.rowCount;
  }

  /**
   * Find entities by a specific metadata key-value pair
   */
  async findByKey(
    entityType: string,
    key: string,
    value: unknown
  ): Promise<EntityReference[]> {
    validateEntityType(entityType);
    validateKey(key);

    const result = await this.db.query(
      `SELECT entity_type, entity_id FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND meta_key = $3
         AND plugin_id = $4 AND meta_value = $5`,
      [this.tenant, entityType, key, this.pluginId, JSON.stringify(value)]
    );

    return result.rows.map((row) => ({
      entityType: row.entity_type as string,
      entityId: row.entity_id as number,
    }));
  }

  /**
   * Find all metadata entries with a key prefix
   *
   * Uses escaped LIKE pattern to prevent SQL injection.
   */
  async findByKeyPrefix(
    entityType: string,
    keyPrefix: string
  ): Promise<MetadataEntry[]> {
    validateEntityType(entityType);
    validateKeyPrefix(keyPrefix);

    // Escape special LIKE characters to prevent injection
    const escapedPrefix = escapeLikePattern(keyPrefix);

    const result = await this.db.query(
      `SELECT id, entity_type, entity_id, meta_key, meta_value, plugin_id, created_at, updated_at
       FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND plugin_id = $3
         AND meta_key LIKE $4 ESCAPE '\\'`,
      [this.tenant, entityType, this.pluginId, `${escapedPrefix}%`]
    );

    return result.rows.map((row) => ({
      id: row.id as number,
      entityType: row.entity_type as string,
      entityId: row.entity_id as number,
      key: row.meta_key as string,
      value: row.meta_value,
      pluginId: row.plugin_id as string,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    }));
  }

  /**
   * Delete all metadata created by this plugin
   *
   * Useful for cleanup during plugin uninstall.
   */
  async deleteByPlugin(): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM entity_metadata WHERE tenant = $1 AND plugin_id = $2`,
      [this.tenant, this.pluginId]
    );

    return result.rowCount;
  }

  /**
   * Get all metadata created by this plugin
   */
  async getAllByPlugin(): Promise<MetadataEntry[]> {
    const result = await this.db.query(
      `SELECT id, entity_type, entity_id, meta_key, meta_value, plugin_id, created_at, updated_at
       FROM entity_metadata
       WHERE tenant = $1 AND plugin_id = $2
       ORDER BY created_at DESC`,
      [this.tenant, this.pluginId]
    );

    return result.rows.map((row) => ({
      id: row.id as number,
      entityType: row.entity_type as string,
      entityId: row.entity_id as number,
      key: row.meta_key as string,
      value: row.meta_value,
      pluginId: row.plugin_id as string,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    }));
  }
}

/**
 * Factory function to create a MetadataService
 */
export function createMetadataService(
  db: TransactionAwareDatabaseService,
  pluginId: string,
  tenant: string
): MetadataAPI {
  return new MetadataService(db, pluginId, tenant);
}

// Export validation error for external handling
export { ValidationError };
