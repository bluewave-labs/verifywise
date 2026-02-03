import { sequelize } from "../database/db";
import {
  WatermarkJobModel,
  WatermarkJob,
  WatermarkJobStatus,
} from "../domain.layer/models/watermarkJob/watermarkJob.model";
import { QueryTypes } from "sequelize";

/**
 * Escape a SQL identifier safely for PostgreSQL.
 */
function escapePgIdentifier(ident: string): string {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(ident)) {
    throw new Error("Unsafe tenant identifier provided to SQL query");
  }
  return '"' + ident.replace(/"/g, '""') + '"';
}

/**
 * Create a new watermark job
 */
export async function createWatermarkJobQuery(
  job: Partial<WatermarkJob>,
  tenant: string
): Promise<WatermarkJobModel> {
  const query = `
    INSERT INTO ${escapePgIdentifier(tenant)}.watermark_jobs (
      user_id, type, status, input_file_id, input_file_name, input_file_type,
      input_file_size, model_id, project_id, settings, is_demo, created_at
    ) VALUES (
      :user_id, :type, :status, :input_file_id, :input_file_name, :input_file_type,
      :input_file_size, :model_id, :project_id, :settings, :is_demo, NOW()
    ) RETURNING *;
  `;

  const result = await sequelize.query(query, {
    replacements: {
      user_id: job.user_id,
      type: job.type,
      status: job.status || "pending",
      input_file_id: job.input_file_id || null,
      input_file_name: job.input_file_name,
      input_file_type: job.input_file_type,
      input_file_size: job.input_file_size || null,
      model_id: job.model_id || null,
      project_id: job.project_id || null,
      settings: JSON.stringify(job.settings || {}),
      is_demo: job.is_demo || false,
    },
    type: QueryTypes.INSERT,
  });

  // Result is [rows, metadata] - get the first row
  const rows = result[0] as unknown as WatermarkJobModel[];
  return rows[0];
}

/**
 * Get a watermark job by ID
 */
export async function getWatermarkJobByIdQuery(
  id: number,
  tenant: string
): Promise<WatermarkJobModel | null> {
  const query = `
    SELECT * FROM ${escapePgIdentifier(tenant)}.watermark_jobs
    WHERE id = :id;
  `;

  const result = await sequelize.query(query, {
    replacements: { id },
    type: QueryTypes.SELECT,
  });

  return result.length > 0 ? (result[0] as WatermarkJobModel) : null;
}

/**
 * Update watermark job status
 */
export async function updateWatermarkJobStatusQuery(
  id: number,
  status: WatermarkJobStatus,
  tenant: string
): Promise<void> {
  const query = `
    UPDATE ${escapePgIdentifier(tenant)}.watermark_jobs
    SET status = :status
    WHERE id = :id;
  `;

  await sequelize.query(query, {
    replacements: { id, status },
    type: QueryTypes.UPDATE,
  });
}

/**
 * Update watermark job with result
 */
export async function updateWatermarkJobResultQuery(
  id: number,
  updates: {
    status: WatermarkJobStatus;
    result?: Record<string, unknown>;
    output_file_id?: number;
    evidence_id?: number;
    processing_time_ms?: number;
    error_message?: string;
  },
  tenant: string
): Promise<void> {
  const query = `
    UPDATE ${escapePgIdentifier(tenant)}.watermark_jobs
    SET
      status = :status,
      result = :result,
      output_file_id = :output_file_id,
      evidence_id = :evidence_id,
      processing_time_ms = :processing_time_ms,
      error_message = :error_message,
      completed_at = NOW()
    WHERE id = :id;
  `;

  await sequelize.query(query, {
    replacements: {
      id,
      status: updates.status,
      result: updates.result ? JSON.stringify(updates.result) : null,
      output_file_id: updates.output_file_id || null,
      evidence_id: updates.evidence_id || null,
      processing_time_ms: updates.processing_time_ms || null,
      error_message: updates.error_message || null,
    },
    type: QueryTypes.UPDATE,
  });
}

/**
 * Get watermark jobs history for a user
 */
export async function getWatermarkJobsHistoryQuery(
  tenant: string,
  options: {
    userId?: number;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ jobs: WatermarkJobModel[]; total: number }> {
  const { userId, type, status, limit = 20, offset = 0 } = options;

  let whereClause = "WHERE 1=1";
  const replacements: Record<string, unknown> = { limit, offset };

  if (userId) {
    whereClause += " AND user_id = :userId";
    replacements.userId = userId;
  }
  if (type) {
    whereClause += " AND type = :type";
    replacements.type = type;
  }
  if (status) {
    whereClause += " AND status = :status";
    replacements.status = status;
  }

  const countQuery = `
    SELECT COUNT(*) as total FROM ${escapePgIdentifier(tenant)}.watermark_jobs
    ${whereClause};
  `;

  const dataQuery = `
    SELECT * FROM ${escapePgIdentifier(tenant)}.watermark_jobs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT :limit OFFSET :offset;
  `;

  const [countResult, dataResult] = await Promise.all([
    sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    }),
    sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT,
    }),
  ]);

  const total = parseInt((countResult[0] as { total: string }).total, 10);

  return {
    jobs: dataResult as WatermarkJobModel[],
    total,
  };
}

/**
 * Get watermark job statistics
 */
export async function getWatermarkJobStatsQuery(
  tenant: string,
  userId?: number
): Promise<{
  total: number;
  embed_count: number;
  detect_count: number;
  completed_count: number;
  failed_count: number;
}> {
  let whereClause = "";
  const replacements: Record<string, unknown> = {};

  if (userId) {
    whereClause = "WHERE user_id = :userId";
    replacements.userId = userId;
  }

  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE type = 'embed') as embed_count,
      COUNT(*) FILTER (WHERE type = 'detect') as detect_count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count
    FROM ${escapePgIdentifier(tenant)}.watermark_jobs
    ${whereClause};
  `;

  const result = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT,
  });

  const stats = result[0] as {
    total: string;
    embed_count: string;
    detect_count: string;
    completed_count: string;
    failed_count: string;
  };

  return {
    total: parseInt(stats.total, 10),
    embed_count: parseInt(stats.embed_count, 10),
    detect_count: parseInt(stats.detect_count, 10),
    completed_count: parseInt(stats.completed_count, 10),
    failed_count: parseInt(stats.failed_count, 10),
  };
}
