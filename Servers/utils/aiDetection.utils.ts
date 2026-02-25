/**
 * @fileoverview AI Detection Database Utils
 *
 * Database query functions for AI Detection scans and findings.
 * Follows the established pattern for multi-tenant database operations.
 *
 * @module utils/aiDetection
 */

import { sequelize } from "../database/db";
import { Transaction, QueryTypes } from "sequelize";
import {
  IScan,
  IFinding,
  ICreateScanInput,
  IUpdateScanProgressInput,
  ICreateFindingInput,
  ScanStatus,
  GovernanceStatus,
} from "../domain.layer/interfaces/i.aiDetection";
import { ICreateModelSecurityFindingInput } from "../domain.layer/interfaces/i.modelSecurity";

// ============================================================================
// Tenant ID Validation (Defense-in-depth for SQL injection prevention)
// ============================================================================

/**
 * Validates tenant ID format to prevent SQL injection.
 * Tenant IDs from getTenantHash() should only contain alphanumeric chars and underscores.
 *
 * @param tenantId - The tenant schema identifier
 * @throws Error if tenant ID format is invalid
 */
function validateTenantId(tenantId: string): void {
  if (!tenantId || !/^[a-zA-Z0-9_]+$/.test(tenantId)) {
    throw new Error(`Invalid tenant identifier format: ${tenantId}`);
  }
}

// ============================================================================
// Scan Queries
// ============================================================================

/**
 * Create a new scan record
 *
 * @param input - Scan creation input
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 * @returns Created scan record
 */
export async function createScanQuery(
  input: ICreateScanInput,
  tenantId: string,
  transaction: Transaction
): Promise<IScan> {
  validateTenantId(tenantId);
  const query = `
    INSERT INTO "${tenantId}".ai_detection_scans (
      repository_url,
      repository_owner,
      repository_name,
      status,
      triggered_by,
      repository_id,
      triggered_by_type,
      created_at,
      updated_at
    ) VALUES (
      :repository_url,
      :repository_owner,
      :repository_name,
      :status,
      :triggered_by,
      :repository_id,
      :triggered_by_type,
      NOW(),
      NOW()
    )
    RETURNING *;
  `;

  const [results] = await sequelize.query(query, {
    replacements: {
      repository_url: input.repository_url,
      repository_owner: input.repository_owner,
      repository_name: input.repository_name,
      status: input.status || "pending",
      triggered_by: input.triggered_by,
      repository_id: input.repository_id || null,
      triggered_by_type: input.triggered_by_type || "manual",
    },
    transaction,
  });

  return (results as IScan[])[0];
}

/**
 * Get scan by ID
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @returns Scan record or null
 */
export async function getScanByIdQuery(
  scanId: number,
  tenantId: string
): Promise<IScan | null> {
  validateTenantId(tenantId);
  const query = `
    SELECT *
    FROM "${tenantId}".ai_detection_scans
    WHERE id = :scanId;
  `;

  const results = await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.SELECT,
  });

  return (results as IScan[])[0] || null;
}

/**
 * Get scan with user info
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @returns Scan with triggered_by user info
 */
export async function getScanWithUserQuery(
  scanId: number,
  tenantId: string
): Promise<(IScan & { triggered_by_user: { id: number; name: string; surname?: string } }) | null> {
  validateTenantId(tenantId);
  const query = `
    SELECT
      s.*,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'surname', u.surname
      ) as triggered_by_user
    FROM "${tenantId}".ai_detection_scans s
    LEFT JOIN public.users u ON s.triggered_by = u.id
    WHERE s.id = :scanId;
  `;

  const results = await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.SELECT,
  });

  return (results as (IScan & { triggered_by_user: { id: number; name: string; surname?: string } })[])[0] || null;
}

/**
 * Update scan progress
 *
 * @param scanId - Scan ID
 * @param input - Update input
 * @param tenantId - Tenant schema hash
 * @param transaction - Optional transaction
 * @returns Updated scan or null
 */
export async function updateScanProgressQuery(
  scanId: number,
  input: IUpdateScanProgressInput,
  tenantId: string,
  transaction?: Transaction
): Promise<IScan | null> {
  validateTenantId(tenantId);
  // Build SET clause dynamically based on provided fields
  const setClauses: string[] = ["updated_at = NOW()"];
  const replacements: Record<string, unknown> = { scanId };

  if (input.status !== undefined) {
    setClauses.push("status = :status");
    replacements.status = input.status;
  }
  if (input.files_scanned !== undefined) {
    setClauses.push("files_scanned = :files_scanned");
    replacements.files_scanned = input.files_scanned;
  }
  if (input.total_files !== undefined) {
    setClauses.push("total_files = :total_files");
    replacements.total_files = input.total_files;
  }
  if (input.findings_count !== undefined) {
    setClauses.push("findings_count = :findings_count");
    replacements.findings_count = input.findings_count;
  }
  if (input.started_at !== undefined) {
    setClauses.push("started_at = :started_at");
    replacements.started_at = input.started_at;
  }
  if (input.completed_at !== undefined) {
    setClauses.push("completed_at = :completed_at");
    replacements.completed_at = input.completed_at;
  }
  if (input.duration_ms !== undefined) {
    setClauses.push("duration_ms = :duration_ms");
    replacements.duration_ms = input.duration_ms;
  }
  if (input.error_message !== undefined) {
    setClauses.push("error_message = :error_message");
    replacements.error_message = input.error_message;
  }
  if (input.cache_path !== undefined) {
    setClauses.push("cache_path = :cache_path");
    replacements.cache_path = input.cache_path;
  }

  const query = `
    UPDATE "${tenantId}".ai_detection_scans
    SET ${setClauses.join(", ")}
    WHERE id = :scanId
    RETURNING *;
  `;

  const results = await sequelize.query(query, {
    replacements,
    type: QueryTypes.UPDATE,
    transaction,
  });

  return ((results as unknown as IScan[][])[0])?.[0] || null;
}

/**
 * Get scans list with pagination
 *
 * @param tenantId - Tenant schema hash
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param status - Optional status filter
 * @returns Scans and total count
 */
export async function getScansListQuery(
  tenantId: string,
  page: number = 1,
  limit: number = 20,
  status?: ScanStatus,
  repositoryId?: number
): Promise<{ scans: (IScan & { triggered_by_user: { id: number; name: string; surname?: string } })[]; total: number }> {
  validateTenantId(tenantId);
  const offset = (page - 1) * limit;
  const replacements: Record<string, unknown> = { limit, offset };
  const conditions: string[] = [];

  if (status) {
    conditions.push("s.status = :status");
    replacements.status = status;
  }

  if (repositoryId !== undefined) {
    conditions.push("s.repository_id = :repositoryId");
    replacements.repositoryId = repositoryId;
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${tenantId}".ai_detection_scans s
    ${whereClause};
  `;

  const dataQuery = `
    SELECT
      s.*,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'surname', u.surname
      ) as triggered_by_user
    FROM "${tenantId}".ai_detection_scans s
    LEFT JOIN public.users u ON s.triggered_by = u.id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT :limit OFFSET :offset;
  `;

  const [countResults, dataResults] = await Promise.all([
    sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(dataQuery, { replacements, type: QueryTypes.SELECT }),
  ]);

  return {
    scans: dataResults as (IScan & { triggered_by_user: { id: number; name: string; surname?: string } })[],
    total: parseInt((countResults[0] as { total: string }).total, 10),
  };
}

/**
 * Delete scan and all related findings
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 * @returns True if deleted
 */
export async function deleteScanQuery(
  scanId: number,
  tenantId: string,
  transaction: Transaction
): Promise<boolean> {
  validateTenantId(tenantId);
  // Findings are deleted via CASCADE
  const query = `
    DELETE FROM "${tenantId}".ai_detection_scans
    WHERE id = :scanId;
  `;

  await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.DELETE,
    transaction,
  });

  return true;
}

/**
 * Check if repository is being scanned
 *
 * @param repoOwner - Repository owner
 * @param repoName - Repository name
 * @param tenantId - Tenant schema hash
 * @returns Active scan or null
 */
export async function getActiveScanForRepoQuery(
  repoOwner: string,
  repoName: string,
  tenantId: string
): Promise<IScan | null> {
  validateTenantId(tenantId);
  const query = `
    SELECT *
    FROM "${tenantId}".ai_detection_scans
    WHERE repository_owner = :repoOwner
      AND repository_name = :repoName
      AND status IN ('pending', 'cloning', 'scanning')
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  const results = await sequelize.query(query, {
    replacements: { repoOwner, repoName },
    type: QueryTypes.SELECT,
  });

  return (results as IScan[])[0] || null;
}

// ============================================================================
// Finding Queries
// ============================================================================

/**
 * Create a new finding record
 *
 * @param input - Finding creation input
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 * @returns Created finding record
 */
export async function createFindingQuery(
  input: ICreateFindingInput,
  tenantId: string,
  transaction: Transaction
): Promise<IFinding> {
  validateTenantId(tenantId);
  const query = `
    INSERT INTO "${tenantId}".ai_detection_findings (
      scan_id,
      finding_type,
      category,
      name,
      provider,
      confidence,
      description,
      documentation_url,
      file_count,
      file_paths,
      created_at
    ) VALUES (
      :scan_id,
      :finding_type,
      :category,
      :name,
      :provider,
      :confidence,
      :description,
      :documentation_url,
      :file_count,
      :file_paths,
      NOW()
    )
    ON CONFLICT (scan_id, name, provider) DO UPDATE SET
      file_count = ai_detection_findings.file_count + EXCLUDED.file_count,
      file_paths = ai_detection_findings.file_paths || EXCLUDED.file_paths
    RETURNING *;
  `;

  const [results] = await sequelize.query(query, {
    replacements: {
      scan_id: input.scan_id,
      finding_type: input.finding_type,
      category: input.category,
      name: input.name,
      provider: input.provider || null,
      confidence: input.confidence,
      description: input.description || null,
      documentation_url: input.documentation_url || null,
      file_count: input.file_count || 1,
      file_paths: JSON.stringify(input.file_paths || []),
    },
    transaction,
  });

  return (results as IFinding[])[0];
}

/**
 * Create multiple findings in batch
 *
 * @param inputs - Array of finding inputs
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 * @returns Number of findings created
 */
export async function createFindingsBatchQuery(
  inputs: ICreateFindingInput[],
  tenantId: string,
  transaction: Transaction
): Promise<number> {
  validateTenantId(tenantId);
  if (inputs.length === 0) return 0;

  // Final deduplication safety check - PostgreSQL ON CONFLICT fails if same row appears twice in batch
  // Key is (scan_id, name, provider) - must match the unique constraint
  // Normalize provider to handle undefined/null/"" consistently
  const deduplicatedMap = new Map<string, ICreateFindingInput>();
  for (const input of inputs) {
    const normalizedProvider = input.provider || "NULL";
    const key = `${input.scan_id}::${input.name}::${normalizedProvider}`;
    const existing = deduplicatedMap.get(key);
    if (existing) {
      // Merge file paths
      const existingPaths = existing.file_paths || [];
      const newPaths = input.file_paths || [];
      existing.file_paths = [...existingPaths, ...newPaths];
      existing.file_count = existing.file_paths.length;
    } else {
      deduplicatedMap.set(key, { ...input });
    }
  }
  const deduplicatedInputs = Array.from(deduplicatedMap.values());

  // Use single INSERT with multiple VALUES
  const values = deduplicatedInputs.map((_input, index) => {
    return `(
      :scan_id_${index},
      :finding_type_${index},
      :category_${index},
      :name_${index},
      :provider_${index},
      :confidence_${index},
      :risk_level_${index},
      :description_${index},
      :documentation_url_${index},
      :file_count_${index},
      :file_paths_${index},
      :license_id_${index},
      :license_name_${index},
      :license_risk_${index},
      :license_source_${index},
      NOW()
    )`;
  });

  const replacements: Record<string, unknown> = {};
  deduplicatedInputs.forEach((input, index) => {
    replacements[`scan_id_${index}`] = input.scan_id;
    replacements[`finding_type_${index}`] = input.finding_type;
    replacements[`category_${index}`] = input.category;
    replacements[`name_${index}`] = input.name;
    replacements[`provider_${index}`] = input.provider || null;
    replacements[`confidence_${index}`] = input.confidence;
    replacements[`risk_level_${index}`] = input.risk_level || "medium";
    replacements[`description_${index}`] = input.description || null;
    replacements[`documentation_url_${index}`] = input.documentation_url || null;
    replacements[`file_count_${index}`] = input.file_count || 1;
    replacements[`file_paths_${index}`] = JSON.stringify(input.file_paths || []);
    replacements[`license_id_${index}`] = input.license_id || null;
    replacements[`license_name_${index}`] = input.license_name || null;
    replacements[`license_risk_${index}`] = input.license_risk || null;
    replacements[`license_source_${index}`] = input.license_source || null;
  });

  const query = `
    INSERT INTO "${tenantId}".ai_detection_findings (
      scan_id,
      finding_type,
      category,
      name,
      provider,
      confidence,
      risk_level,
      description,
      documentation_url,
      file_count,
      file_paths,
      license_id,
      license_name,
      license_risk,
      license_source,
      created_at
    ) VALUES ${values.join(", ")}
    ON CONFLICT (scan_id, name, provider) DO UPDATE SET
      file_count = ai_detection_findings.file_count + EXCLUDED.file_count,
      file_paths = ai_detection_findings.file_paths || EXCLUDED.file_paths,
      license_id = COALESCE(EXCLUDED.license_id, ai_detection_findings.license_id),
      license_name = COALESCE(EXCLUDED.license_name, ai_detection_findings.license_name),
      license_risk = COALESCE(EXCLUDED.license_risk, ai_detection_findings.license_risk),
      license_source = COALESCE(EXCLUDED.license_source, ai_detection_findings.license_source);
  `;

  await sequelize.query(query, {
    replacements,
    type: QueryTypes.INSERT,
    transaction,
  });

  return deduplicatedInputs.length;
}

/**
 * Get findings for a scan
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param confidence - Optional confidence filter
 * @returns Findings and total count
 */

/**
 * Create model security findings in batch
 *
 * @param inputs - Array of model security finding inputs
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 * @returns Number of findings created
 */
export async function createModelSecurityFindingsBatchQuery(
  inputs: ICreateModelSecurityFindingInput[],
  tenantId: string,
  transaction: Transaction
): Promise<number> {
  validateTenantId(tenantId);
  if (inputs.length === 0) return 0;

  // Deduplication safety check - PostgreSQL ON CONFLICT fails if same row appears twice in batch
  // Key is (scan_id, name, provider) - must match the unique constraint
  const deduplicatedMap = new Map<string, ICreateModelSecurityFindingInput>();
  for (const input of inputs) {
    const normalizedProvider = input.provider || "NULL";
    const key = `${input.scan_id}::${input.name}::${normalizedProvider}`;
    const existing = deduplicatedMap.get(key);
    if (existing) {
      // Merge file paths
      const existingPaths = existing.file_paths || [];
      const newPaths = input.file_paths || [];
      existing.file_paths = [...existingPaths, ...newPaths];
      existing.file_count = existing.file_paths.length;
    } else {
      deduplicatedMap.set(key, { ...input });
    }
  }
  const deduplicatedInputs = Array.from(deduplicatedMap.values());

  // Use single INSERT with multiple VALUES
  const values = deduplicatedInputs.map((_input, index) => {
    return "("+
      ":scan_id_" + index + ", " +
      ":finding_type_" + index + ", " +
      ":category_" + index + ", " +
      ":name_" + index + ", " +
      ":provider_" + index + ", " +
      ":confidence_" + index + ", " +
      ":description_" + index + ", " +
      ":documentation_url_" + index + ", " +
      ":file_count_" + index + ", " +
      ":file_paths_" + index + ", " +
      ":severity_" + index + ", " +
      ":cwe_id_" + index + ", " +
      ":cwe_name_" + index + ", " +
      ":owasp_ml_id_" + index + ", " +
      ":owasp_ml_name_" + index + ", " +
      ":threat_type_" + index + ", " +
      ":operator_name_" + index + ", " +
      ":module_name_" + index + ", " +
      "NOW()" +
    ")";
  });

  const replacements: Record<string, unknown> = {};
  deduplicatedInputs.forEach((input, index) => {
    replacements["scan_id_" + index] = input.scan_id;
    replacements["finding_type_" + index] = input.finding_type;
    replacements["category_" + index] = input.category;
    replacements["name_" + index] = input.name;
    replacements["provider_" + index] = input.provider || null;
    replacements["confidence_" + index] = input.confidence;
    replacements["description_" + index] = input.description || null;
    replacements["documentation_url_" + index] = input.documentation_url || null;
    replacements["file_count_" + index] = input.file_count || 1;
    replacements["file_paths_" + index] = JSON.stringify(input.file_paths || []);
    replacements["severity_" + index] = input.severity;
    replacements["cwe_id_" + index] = input.cwe_id;
    replacements["cwe_name_" + index] = input.cwe_name;
    replacements["owasp_ml_id_" + index] = input.owasp_ml_id;
    replacements["owasp_ml_name_" + index] = input.owasp_ml_name;
    replacements["threat_type_" + index] = input.threat_type;
    replacements["operator_name_" + index] = input.operator_name;
    replacements["module_name_" + index] = input.module_name;
  });

  const query =
    'INSERT INTO "' + tenantId + '".ai_detection_findings (' +
      "scan_id, finding_type, category, name, provider, confidence, " +
      "description, documentation_url, file_count, file_paths, " +
      "severity, cwe_id, cwe_name, owasp_ml_id, owasp_ml_name, " +
      "threat_type, operator_name, module_name, created_at" +
    ") VALUES " + values.join(", ") +
    " ON CONFLICT (scan_id, name, provider) DO UPDATE SET " +
      "file_count = ai_detection_findings.file_count + EXCLUDED.file_count, " +
      "file_paths = ai_detection_findings.file_paths || EXCLUDED.file_paths;";

  await sequelize.query(query, {
    replacements,
    type: QueryTypes.INSERT,
    transaction,
  });

  return deduplicatedInputs.length;
}
export async function getFindingsForScanQuery(
  scanId: number,
  tenantId: string,
  page: number = 1,
  limit: number = 50,
  confidence?: string,
  findingType?: string
): Promise<{ findings: IFinding[]; total: number }> {
  validateTenantId(tenantId);
  const offset = (page - 1) * limit;
  const replacements: Record<string, unknown> = { scanId, limit, offset };
  let whereClause = "WHERE scan_id = :scanId";

  if (confidence) {
    whereClause += " AND confidence = :confidence";
    replacements.confidence = confidence;
  }

  if (findingType) {
    whereClause += " AND finding_type = :findingType";
    replacements.findingType = findingType;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${tenantId}".ai_detection_findings
    ${whereClause};
  `;

  const dataQuery = `
    SELECT *
    FROM "${tenantId}".ai_detection_findings
    ${whereClause}
    ORDER BY
      CASE confidence
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      file_count DESC,
      name ASC
    LIMIT :limit OFFSET :offset;
  `;

  const [countResults, dataResults] = await Promise.all([
    sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(dataQuery, { replacements, type: QueryTypes.SELECT }),
  ]);

  return {
    findings: dataResults as IFinding[],
    total: parseInt((countResults[0] as { total: string }).total, 10),
  };
}

/**
 * Maximum findings to fetch in a single batch for exports
 */
const EXPORT_BATCH_SIZE = 500;

/**
 * Maximum total findings to fetch for exports (to prevent memory exhaustion)
 */
const MAX_EXPORT_FINDINGS = 10000;

/**
 * Get all findings for a scan with pagination (for exports)
 *
 * Fetches findings in batches to avoid memory issues with large scans.
 * Use this for exports (AI-BOM, dependency graph) instead of hardcoded limits.
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @param excludeTypes - Optional finding types to exclude (e.g., ['secret', 'model_security'])
 * @returns All findings for the scan
 */
export async function getAllFindingsForExportQuery(
  scanId: number,
  tenantId: string,
  excludeTypes?: string[]
): Promise<IFinding[]> {
  validateTenantId(tenantId);

  // First, get the total count
  let whereClause = "WHERE scan_id = :scanId";
  const replacements: Record<string, unknown> = { scanId };

  if (excludeTypes && excludeTypes.length > 0) {
    whereClause += ` AND finding_type NOT IN (${excludeTypes.map((_, i) => `:excludeType${i}`).join(", ")})`;
    excludeTypes.forEach((type, i) => {
      replacements[`excludeType${i}`] = type;
    });
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${tenantId}".ai_detection_findings
    ${whereClause};
  `;

  const [countResults] = await sequelize.query(countQuery, {
    replacements,
    type: QueryTypes.SELECT,
  });
  const total = parseInt((countResults as { total: string }).total, 10);

  // If count exceeds max, throw an error with helpful message
  if (total > MAX_EXPORT_FINDINGS) {
    throw new Error(
      `Scan has ${total} findings, which exceeds the maximum export limit of ${MAX_EXPORT_FINDINGS}. ` +
      `Consider filtering findings or exporting in smaller batches.`
    );
  }

  // Fetch findings in batches
  const allFindings: IFinding[] = [];
  let offset = 0;

  while (offset < total) {
    const batchQuery = `
      SELECT *
      FROM "${tenantId}".ai_detection_findings
      ${whereClause}
      ORDER BY
        CASE confidence
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        file_count DESC,
        name ASC
      LIMIT :limit OFFSET :offset;
    `;

    const batchResults = await sequelize.query(batchQuery, {
      replacements: { ...replacements, limit: EXPORT_BATCH_SIZE, offset },
      type: QueryTypes.SELECT,
    });

    allFindings.push(...(batchResults as IFinding[]));
    offset += EXPORT_BATCH_SIZE;
  }

  return allFindings;
}

/**
 * Get findings summary for a scan
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @returns Summary with counts by confidence, provider, and finding type
 */
export async function getFindingsSummaryQuery(
  scanId: number,
  tenantId: string
): Promise<{
  total: number;
  by_confidence: { high: number; medium: number; low: number };
  by_provider: Record<string, number>;
  by_finding_type: {
    library: number;
    dependency: number;
    api_call: number;
    secret: number;
    model_ref: number;
    rag_component: number;
    agent: number;
  };
}> {
  validateTenantId(tenantId);
  const confidenceQuery = `
    SELECT
      confidence,
      COUNT(*) as count
    FROM "${tenantId}".ai_detection_findings
    WHERE scan_id = :scanId
    GROUP BY confidence;
  `;

  const providerQuery = `
    SELECT
      COALESCE(provider, 'Unknown') as provider,
      COUNT(*) as count
    FROM "${tenantId}".ai_detection_findings
    WHERE scan_id = :scanId
    GROUP BY provider;
  `;

  const findingTypeQuery = `
    SELECT
      finding_type,
      COUNT(*) as count
    FROM "${tenantId}".ai_detection_findings
    WHERE scan_id = :scanId
    GROUP BY finding_type;
  `;

  const [confidenceResults, providerResults, findingTypeResults] = await Promise.all([
    sequelize.query(confidenceQuery, {
      replacements: { scanId },
      type: QueryTypes.SELECT,
    }),
    sequelize.query(providerQuery, {
      replacements: { scanId },
      type: QueryTypes.SELECT,
    }),
    sequelize.query(findingTypeQuery, {
      replacements: { scanId },
      type: QueryTypes.SELECT,
    }),
  ]);

  // Build confidence counts
  const byConfidence = { high: 0, medium: 0, low: 0 };
  let total = 0;
  (confidenceResults as { confidence: string; count: string }[]).forEach((row) => {
    const count = parseInt(row.count, 10);
    byConfidence[row.confidence as keyof typeof byConfidence] = count;
    total += count;
  });

  // Build provider counts
  const byProvider: Record<string, number> = {};
  (providerResults as { provider: string; count: string }[]).forEach((row) => {
    byProvider[row.provider] = parseInt(row.count, 10);
  });

  // Build finding type counts
  const byFindingType = {
    library: 0,
    dependency: 0,
    api_call: 0,
    secret: 0,
    model_ref: 0,
    rag_component: 0,
    agent: 0,
  };
  (findingTypeResults as { finding_type: string; count: string }[]).forEach((row) => {
    if (row.finding_type in byFindingType) {
      byFindingType[row.finding_type as keyof typeof byFindingType] = parseInt(row.count, 10);
    }
  });

  return {
    total,
    by_confidence: byConfidence,
    by_provider: byProvider,
    by_finding_type: byFindingType,
  };
}

/**
 * Delete all findings for a scan
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @param transaction - Database transaction
 */
export async function deleteFindingsForScanQuery(
  scanId: number,
  tenantId: string,
  transaction: Transaction
): Promise<void> {
  validateTenantId(tenantId);
  const query = `
    DELETE FROM "${tenantId}".ai_detection_findings
    WHERE scan_id = :scanId;
  `;

  await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.DELETE,
    transaction,
  });
}

// ============================================================================
// Cache Management Queries
// ============================================================================

/**
 * Get scans with cache paths for cleanup
 *
 * @param tenantId - Tenant schema hash
 * @param olderThanDays - Scans older than this many days
 * @returns Scans with cache paths
 */
export async function getScansWithCacheQuery(
  tenantId: string,
  olderThanDays: number = 7
): Promise<{ id: number; cache_path: string }[]> {
  validateTenantId(tenantId);
  // Validate olderThanDays to prevent SQL injection
  const sanitizedDays = Math.max(1, Math.min(365, Math.floor(Number(olderThanDays) || 7)));

  const query = `
    SELECT id, cache_path
    FROM "${tenantId}".ai_detection_scans
    WHERE cache_path IS NOT NULL
      AND created_at < NOW() - INTERVAL '1 day' * :olderThanDays
      AND status IN ('completed', 'failed', 'cancelled');
  `;

  const results = await sequelize.query(query, {
    replacements: { olderThanDays: sanitizedDays },
    type: QueryTypes.SELECT,
  });

  return results as { id: number; cache_path: string }[];
}

/**
 * Clear cache path after cleanup
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 */
export async function clearScanCachePathQuery(
  scanId: number,
  tenantId: string
): Promise<void> {
  validateTenantId(tenantId);
  const query = `
    UPDATE "${tenantId}".ai_detection_scans
    SET cache_path = NULL, updated_at = NOW()
    WHERE id = :scanId;
  `;

  await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.UPDATE,
  });
}

// ============================================================================
// Governance Status Queries
// ============================================================================

/**
 * Update governance status for a finding
 *
 * @param findingId - Finding ID
 * @param scanId - Scan ID (for verification)
 * @param governanceStatus - New governance status (or null to clear)
 * @param userId - User making the update
 * @param tenantId - Tenant schema hash
 * @returns Updated finding or null if not found
 */
export async function updateFindingGovernanceStatusQuery(
  findingId: number,
  scanId: number,
  governanceStatus: GovernanceStatus | null,
  userId: number,
  tenantId: string
): Promise<IFinding | null> {
  validateTenantId(tenantId);
  const query = `
    UPDATE "${tenantId}".ai_detection_findings
    SET
      governance_status = :governance_status,
      governance_updated_at = NOW(),
      governance_updated_by = :user_id
    WHERE id = :finding_id AND scan_id = :scan_id
    RETURNING *;
  `;

  const results = await sequelize.query(query, {
    replacements: {
      finding_id: findingId,
      scan_id: scanId,
      governance_status: governanceStatus,
      user_id: userId,
    },
    type: QueryTypes.UPDATE,
  });

  return ((results as unknown as IFinding[][])[0])?.[0] || null;
}

/**
 * Get governance status summary for a scan
 *
 * @param scanId - Scan ID
 * @param tenantId - Tenant schema hash
 * @returns Summary with counts by governance status
 */
export async function getGovernanceSummaryQuery(
  scanId: number,
  tenantId: string
): Promise<{
  total: number;
  reviewed: number;
  approved: number;
  flagged: number;
  unreviewed: number;
}> {
  validateTenantId(tenantId);
  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE governance_status = 'reviewed') as reviewed,
      COUNT(*) FILTER (WHERE governance_status = 'approved') as approved,
      COUNT(*) FILTER (WHERE governance_status = 'flagged') as flagged,
      COUNT(*) FILTER (WHERE governance_status IS NULL) as unreviewed
    FROM "${tenantId}".ai_detection_findings
    WHERE scan_id = :scanId;
  `;

  const results = await sequelize.query(query, {
    replacements: { scanId },
    type: QueryTypes.SELECT,
  });

  const row = results[0] as {
    total: string;
    reviewed: string;
    approved: string;
    flagged: string;
    unreviewed: string;
  };

  return {
    total: parseInt(row.total, 10),
    reviewed: parseInt(row.reviewed, 10),
    approved: parseInt(row.approved, 10),
    flagged: parseInt(row.flagged, 10),
    unreviewed: parseInt(row.unreviewed, 10),
  };
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Statistics response interface
 */
export interface IAIDetectionStats {
  total_scans: number;
  completed_scans: number;
  total_findings: number;
  unique_repositories: number;
  top_providers: { provider: string; count: number }[];
  findings_by_confidence: { high: number; medium: number; low: number };
  findings_by_type: { library: number; api_call: number; dependency: number; secret: number };
  security_findings: number;
  recent_activity: { date: string; scans: number; findings: number }[];
}

/**
 * Get overall AI Detection statistics
 *
 * @param tenantId - Tenant schema hash
 * @returns Aggregated statistics
 */
export async function getAIDetectionStatsQuery(
  tenantId: string
): Promise<IAIDetectionStats> {
  validateTenantId(tenantId);
  // Total and completed scans
  const scansQuery = `
    SELECT
      COUNT(*) as total_scans,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_scans
    FROM "${tenantId}".ai_detection_scans;
  `;

  // Unique repositories
  const reposQuery = `
    SELECT COUNT(DISTINCT repository_owner || '/' || repository_name) as unique_repos
    FROM "${tenantId}".ai_detection_scans
    WHERE status = 'completed';
  `;

  // Total findings, by confidence, and by type
  const findingsQuery = `
    SELECT
      COUNT(*) as total_findings,
      COUNT(*) FILTER (WHERE confidence = 'high') as high_confidence,
      COUNT(*) FILTER (WHERE confidence = 'medium') as medium_confidence,
      COUNT(*) FILTER (WHERE confidence = 'low') as low_confidence,
      COUNT(*) FILTER (WHERE finding_type = 'library') as library_count,
      COUNT(*) FILTER (WHERE finding_type = 'api_call') as api_call_count,
      COUNT(*) FILTER (WHERE finding_type = 'dependency') as dependency_count,
      COUNT(*) FILTER (WHERE finding_type = 'secret') as secret_count
    FROM "${tenantId}".ai_detection_findings f
    JOIN "${tenantId}".ai_detection_scans s ON f.scan_id = s.id
    WHERE s.status = 'completed';
  `;

  // Security findings count (from model_security_findings table)
  const securityQuery = `
    SELECT COUNT(*) as security_count
    FROM "${tenantId}".ai_detection_model_security_findings msf
    JOIN "${tenantId}".ai_detection_scans s ON msf.scan_id = s.id
    WHERE s.status = 'completed';
  `;

  // Top providers (top 5)
  const providersQuery = `
    SELECT provider, COUNT(*) as count
    FROM "${tenantId}".ai_detection_findings f
    JOIN "${tenantId}".ai_detection_scans s ON f.scan_id = s.id
    WHERE s.status = 'completed' AND provider IS NOT NULL AND provider != ''
    GROUP BY provider
    ORDER BY count DESC
    LIMIT 5;
  `;

  // Recent activity (last 7 days)
  const activityQuery = `
    SELECT
      DATE(s.created_at) as date,
      COUNT(DISTINCT s.id) as scans,
      COALESCE(SUM(s.findings_count), 0) as findings
    FROM "${tenantId}".ai_detection_scans s
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND s.status = 'completed'
    GROUP BY DATE(s.created_at)
    ORDER BY date DESC;
  `;

  const [scansResults, reposResults, findingsResults, securityResults, providersResults, activityResults] =
    await Promise.all([
      sequelize.query(scansQuery, { type: QueryTypes.SELECT }),
      sequelize.query(reposQuery, { type: QueryTypes.SELECT }),
      sequelize.query(findingsQuery, { type: QueryTypes.SELECT }),
      sequelize.query(securityQuery, { type: QueryTypes.SELECT }).catch(() => [{ security_count: "0" }]),
      sequelize.query(providersQuery, { type: QueryTypes.SELECT }),
      sequelize.query(activityQuery, { type: QueryTypes.SELECT }),
    ]);

  const scansRow = scansResults[0] as { total_scans: string; completed_scans: string };
  const reposRow = reposResults[0] as { unique_repos: string };
  const findingsRow = findingsResults[0] as {
    total_findings: string;
    high_confidence: string;
    medium_confidence: string;
    low_confidence: string;
    library_count: string;
    api_call_count: string;
    dependency_count: string;
    secret_count: string;
  };
  const securityRow = securityResults[0] as { security_count: string };

  return {
    total_scans: parseInt(scansRow?.total_scans || "0", 10),
    completed_scans: parseInt(scansRow?.completed_scans || "0", 10),
    total_findings: parseInt(findingsRow?.total_findings || "0", 10),
    unique_repositories: parseInt(reposRow?.unique_repos || "0", 10),
    top_providers: (providersResults as { provider: string; count: string }[]).map((r) => ({
      provider: r.provider,
      count: parseInt(r.count, 10),
    })),
    findings_by_confidence: {
      high: parseInt(findingsRow?.high_confidence || "0", 10),
      medium: parseInt(findingsRow?.medium_confidence || "0", 10),
      low: parseInt(findingsRow?.low_confidence || "0", 10),
    },
    findings_by_type: {
      library: parseInt(findingsRow?.library_count || "0", 10),
      api_call: parseInt(findingsRow?.api_call_count || "0", 10),
      dependency: parseInt(findingsRow?.dependency_count || "0", 10),
      secret: parseInt(findingsRow?.secret_count || "0", 10),
    },
    security_findings: parseInt(securityRow?.security_count || "0", 10) + parseInt(findingsRow?.secret_count || "0", 10),
    recent_activity: (activityResults as { date: string; scans: string; findings: string }[]).map(
      (r) => ({
        date: r.date,
        scans: parseInt(r.scans, 10),
        findings: parseInt(r.findings, 10),
      })
    ),
  };
}

// ============================================================================
// Stale Scan Recovery
// ============================================================================

/**
 * Mark scans stuck in active states for longer than the timeout as failed.
 * This handles cases where the server crashed/restarted mid-scan, leaving
 * scans permanently stuck in pending/cloning/scanning status.
 *
 * @param tenantId - Tenant schema hash
 * @param timeoutMinutes - Minutes after which an active scan is considered stale (default: 30)
 * @returns Number of scans marked as failed
 */
export async function markStaleScansFailed(
  tenantId: string,
  timeoutMinutes: number = 30
): Promise<number> {
  validateTenantId(tenantId);

  const results = await sequelize.query<{ id: number }>(
    `UPDATE "${tenantId}".ai_detection_scans
     SET status = 'failed',
         error_message = 'Scan timed out after ' || CAST(:timeoutMinutes AS TEXT) || ' minutes (server may have restarted)',
         updated_at = NOW()
     WHERE status IN ('pending', 'cloning', 'scanning')
       AND updated_at < NOW() - INTERVAL '1 minute' * :timeoutMinutes
     RETURNING id`,
    {
      replacements: { timeoutMinutes },
      type: QueryTypes.SELECT,
    }
  );

  return results.length;
}
