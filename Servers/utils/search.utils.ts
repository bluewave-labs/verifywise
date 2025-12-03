/**
 * @fileoverview Wise Search Utilities
 *
 * Provides unified search functionality across all database tables.
 * Implements ILIKE-based case-insensitive search with multi-tenant isolation.
 *
 * Search Features:
 * - Case-insensitive search using PostgreSQL ILIKE
 * - Multi-tenant schema isolation
 * - Organization-scoped filtering where applicable
 * - Project-based access control
 * - Result grouping by entity type
 * - Match highlighting support
 *
 * @module utils/search
 */

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

/**
 * Search constants
 */
export const SEARCH_CONSTANTS = {
  MIN_QUERY_LENGTH: 3,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * Sanitize tenant ID to prevent SQL injection
 * Only allows alphanumeric characters, underscores, and hyphens
 */
function sanitizeTenantId(tenantId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
    throw new Error("Invalid tenant ID format");
  }
  return tenantId;
}

/**
 * Whitelist of allowed table names for search queries
 * This prevents SQL injection via table name manipulation
 */
const ALLOWED_TABLE_NAMES = new Set([
  "projects",
  "tasks",
  "vendors",
  "vendor_risks",
  "model_inventories",
  "evidence_hub",
  "risks",
  "file_manager",
  "policy_manager",
  "ai_trust_center_resources",
  "ai_trust_center_subprocessor",
  "trainingregistar",
  "ai_incident_managements",
]);

/**
 * Validate table name against whitelist to prevent SQL injection
 */
function validateTableName(tableName: string): string {
  if (!ALLOWED_TABLE_NAMES.has(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  return tableName;
}

/**
 * Escape ILIKE special characters in search query
 * Escapes %, _, and \ which have special meaning in ILIKE
 */
function escapeILikePattern(query: string): string {
  return query
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Search result interface for individual matches
 */
export interface SearchResult {
  id: number;
  entityType: string;
  title: string;
  subtitle?: string;
  matchedField: string;
  matchedValue: string;
  route: string;
  icon?: string;
}

/**
 * Grouped search results by entity type
 */
export interface GroupedSearchResults {
  [entityType: string]: {
    results: SearchResult[];
    count: number;
    icon: string;
  };
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  tenantId: string;
  organizationId: number;
  userId: number;
  limit?: number;
  offset?: number;
}

/**
 * Entity configuration for search
 */
interface EntityConfig {
  tableName: string;
  searchColumns: string[];
  titleColumn: string;
  subtitleColumn?: string;
  icon: string;
  route: (id: number) => string;
  requiresProjectAccess?: boolean;
  requiresVendorAccess?: boolean;
  organizationColumn?: string;
  projectColumn?: string;
}

/**
 * Entity configurations for all searchable tables
 */
const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  projects: {
    tableName: "projects",
    searchColumns: ["project_title", "goal", "target_industry", "description"],
    titleColumn: "project_title",
    subtitleColumn: "description",
    icon: "FolderTree",
    route: (id) => `/overview?projectId=${id}`,
    requiresProjectAccess: true,
  },
  tasks: {
    tableName: "tasks",
    searchColumns: ["title", "description"],
    titleColumn: "title",
    icon: "Flag",
    route: (id) => `/tasks?taskId=${id}`,
    organizationColumn: "organization_id",
  },
  vendors: {
    tableName: "vendors",
    searchColumns: ["vendor_name", "vendor_provides", "website", "vendor_contact_person", "review_result"],
    titleColumn: "vendor_name",
    subtitleColumn: "vendor_provides",
    icon: "Building2",
    route: (id) => `/vendors?vendorId=${id}`,
    // No project access required - vendors are visible to all users in tenant (matches Vendors page behavior)
  },
  vendor_risks: {
    tableName: "vendor_risks",
    searchColumns: ["risk_description", "impact_description", "action_plan"],
    titleColumn: "risk_description",
    subtitleColumn: "impact_description",
    icon: "AlertTriangle",
    route: (id) => `/vendors?tab=risks&riskId=${id}`,
    requiresVendorAccess: true,
  },
  model_inventories: {
    tableName: "model_inventories",
    searchColumns: ["provider", "model", "version", "approver", "capabilities", "biases", "limitations", "hosting_provider"],
    titleColumn: "model",
    subtitleColumn: "provider",
    icon: "GitBranch",
    route: (id) => `/model-inventory?modelId=${id}`,
    // Note: model_inventories links to projects via junction table model_inventories_projects_frameworks
    // For now, we search all model inventories in the tenant schema (tenant isolation provides security)
  },
  evidence_hub: {
    tableName: "evidence_hub",
    searchColumns: ["evidence_name", "evidence_type", "description"],
    titleColumn: "evidence_name",
    subtitleColumn: "description",
    icon: "FileCheck",
    route: (id) => `/model-inventory/evidence-hub?evidenceId=${id}`,
  },
  project_risks: {
    tableName: "risks",
    searchColumns: ["risk_name", "risk_description", "impact", "mitigation_plan", "review_notes"],
    titleColumn: "risk_name",
    subtitleColumn: "risk_description",
    icon: "AlertTriangle",
    route: (id) => `/risk-management?riskId=${id}`,
    // Note: risks table contains actual risk data; projects_risks is a junction table
    // Tenant schema isolation provides security
  },
  file_manager: {
    tableName: "file_manager",
    searchColumns: ["filename"],
    titleColumn: "filename",
    icon: "Folder",
    route: (id) => `/file-manager?fileId=${id}`,
    organizationColumn: "org_id",
  },
  policy_manager: {
    tableName: "policy_manager",
    searchColumns: ["title", "content_html"],
    titleColumn: "title",
    icon: "Shield",
    route: (id) => `/policies?policyId=${id}`,
  },
  ai_trust_center_resources: {
    tableName: "ai_trust_center_resources",
    searchColumns: ["name", "description"],
    titleColumn: "name",
    subtitleColumn: "description",
    icon: "Brain",
    route: (id) => `/ai-trust-center/resources?resourceId=${id}`,
  },
  ai_trust_center_subprocessors: {
    tableName: "ai_trust_center_subprocessor",
    searchColumns: ["name", "purpose", "location"],
    titleColumn: "name",
    subtitleColumn: "purpose",
    icon: "Telescope",
    route: (id) => `/ai-trust-center/subprocessors?subprocessorId=${id}`,
  },
  training_registar: {
    tableName: "trainingregistar",
    searchColumns: ["training_name", "provider", "department"],
    titleColumn: "training_name",
    subtitleColumn: "provider",
    icon: "GraduationCap",
    route: (id) => `/training?trainingId=${id}`,
  },
  incident_management: {
    tableName: "ai_incident_managements",
    searchColumns: ["ai_project", "reporter", "description", "immediate_mitigations"],
    titleColumn: "ai_project",
    subtitleColumn: "description",
    icon: "AlertCircle",
    route: (id) => `/ai-incident-managements?incidentId=${id}`,
  },
};

/**
 * Builds the ILIKE conditions for a set of columns
 */
function buildILikeConditions(columns: string[], paramName: string): string {
  return columns.map((col) => `${col}::text ILIKE :${paramName}`).join(" OR ");
}

/**
 * Get the first matching column and its value for highlighting
 */
function getMatchedField(row: any, columns: string[], query: string): { field: string; value: string } {
  const lowerQuery = query.toLowerCase();
  for (const col of columns) {
    const value = row[col];
    if (value && value.toString().toLowerCase().includes(lowerQuery)) {
      return { field: col, value: value.toString() };
    }
  }
  return { field: columns[0], value: row[columns[0]]?.toString() || "" };
}

/**
 * Get user's accessible project IDs
 */
async function getUserProjectIds(tenantId: string, userId: number): Promise<number[]> {
  try {
    const safeTenantId = sanitizeTenantId(tenantId);
    const result = await sequelize.query<{ project_id: number }>(
      `SELECT project_id FROM "${safeTenantId}".projects_members WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );
    return result.map((r) => r.project_id);
  } catch (error) {
    console.error("Error fetching user project IDs:", error);
    return [];
  }
}

/**
 * Get vendor IDs accessible to user through their projects
 */
async function getUserVendorIds(tenantId: string, projectIds: number[]): Promise<number[]> {
  if (projectIds.length === 0) return [];

  try {
    const safeTenantId = sanitizeTenantId(tenantId);
    const result = await sequelize.query<{ vendor_id: number }>(
      `SELECT DISTINCT vendor_id FROM "${safeTenantId}".vendors_projects WHERE project_id IN (:projectIds)`,
      {
        replacements: { projectIds },
        type: QueryTypes.SELECT,
      }
    );
    return result.map((r) => r.vendor_id);
  } catch (error) {
    console.error("Error fetching user vendor IDs:", error);
    return [];
  }
}

/**
 * Search a single entity type
 */
async function searchEntity(
  config: EntityConfig,
  entityType: string,
  options: SearchOptions,
  projectIds: number[],
  vendorIds: number[]
): Promise<SearchResult[]> {
  const { query, tenantId, organizationId, limit = 20 } = options;

  // Sanitize tenantId and escape query for ILIKE
  const safeTenantId = sanitizeTenantId(tenantId);
  const escapedQuery = escapeILikePattern(query);
  const searchPattern = `%${escapedQuery}%`;

  // Build WHERE conditions
  const conditions: string[] = [];
  const replacements: Record<string, any> = { searchPattern };

  // Add ILIKE search conditions
  conditions.push(`(${buildILikeConditions(config.searchColumns, "searchPattern")})`);

  // Add organization filter if applicable
  if (config.organizationColumn) {
    conditions.push(`${config.organizationColumn} = :organizationId`);
    replacements.organizationId = organizationId;
  }

  // Add project access filter if applicable
  if (config.requiresProjectAccess) {
    if (projectIds.length === 0) return [];

    // For projects table, filter by id directly
    if (entityType === "projects") {
      conditions.push(`id IN (:projectIds)`);
      replacements.projectIds = projectIds;
    }
    // For vendors, filter by accessible vendor IDs
    else if (entityType === "vendors") {
      if (vendorIds.length === 0) return [];
      conditions.push(`id IN (:vendorIds)`);
      replacements.vendorIds = vendorIds;
    }
    // For entities with project_id column
    else if (config.projectColumn) {
      conditions.push(`${config.projectColumn} IN (:projectIds)`);
      replacements.projectIds = projectIds;
    }
  }

  // Add vendor access filter if applicable (for vendor_risks)
  if (config.requiresVendorAccess) {
    if (vendorIds.length === 0) return [];
    conditions.push(`vendor_id IN (:vendorIds)`);
    replacements.vendorIds = vendorIds;
  }

  // Validate table name against whitelist (SQL injection prevention)
  const safeTableName = validateTableName(config.tableName);

  // Build and execute query
  const sql = `
    SELECT DISTINCT * FROM "${safeTenantId}".${safeTableName}
    WHERE ${conditions.join(" AND ")}
    LIMIT :limit
  `;
  replacements.limit = Math.min(limit, SEARCH_CONSTANTS.MAX_LIMIT);

  try {
    const rows = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return rows.map((row: any) => {
      const matched = getMatchedField(row, config.searchColumns, query);
      return {
        id: row.id,
        entityType,
        title: row[config.titleColumn]?.toString() || "",
        subtitle: config.subtitleColumn ? row[config.subtitleColumn]?.toString() : undefined,
        matchedField: matched.field,
        matchedValue: matched.value,
        route: config.route(row.id),
        icon: config.icon,
      };
    });
  } catch (error) {
    // Table might not exist in this tenant schema, skip silently
    console.error(`Search error for ${entityType}:`, (error as Error).message);
    return [];
  }
}

/**
 * Search across all entities
 */
export async function wiseSearch(options: SearchOptions): Promise<GroupedSearchResults> {
  const { query, tenantId, userId } = options;

  // Minimum characters required for search
  if (!query || query.trim().length < SEARCH_CONSTANTS.MIN_QUERY_LENGTH) {
    return {};
  }

  // Get user's accessible project IDs for permission filtering
  const projectIds = await getUserProjectIds(tenantId, userId);

  // Get vendor IDs accessible through user's projects
  const vendorIds = await getUserVendorIds(tenantId, projectIds);

  // Search all entities in parallel
  const searchPromises = Object.entries(ENTITY_CONFIGS).map(async ([entityType, config]) => {
    const results = await searchEntity(config, entityType, options, projectIds, vendorIds);
    return { entityType, results, icon: config.icon };
  });

  const searchResults = await Promise.all(searchPromises);

  // Group results by entity type
  const grouped: GroupedSearchResults = {};
  for (const { entityType, results, icon } of searchResults) {
    if (results.length > 0) {
      grouped[entityType] = {
        results,
        count: results.length,
        icon,
      };
    }
  }

  return grouped;
}

/**
 * Get total count of search results across all entities
 */
export function getTotalResultCount(results: GroupedSearchResults): number {
  return Object.values(results).reduce((sum, group) => sum + group.count, 0);
}

/**
 * Flatten grouped results into a single array
 */
export function flattenResults(grouped: GroupedSearchResults): SearchResult[] {
  const flattened: SearchResult[] = [];
  for (const group of Object.values(grouped)) {
    flattened.push(...group.results);
  }
  return flattened;
}
