import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

// ==================== CONNECTORS ====================

export const getAllConnectorsQuery = async (tenant: string) => {
  return sequelize.query(
    `SELECT * FROM shadow_ai_connectors ORDER BY created_at DESC`,
    { type: QueryTypes.SELECT }
  );
};

export const getConnectorByIdQuery = async (id: number, tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM shadow_ai_connectors WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  return result.length ? result[0] : null;
};

export const createConnectorQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_connectors (name, type, config, status, created_by, created_at, updated_at)
     VALUES (:name, :type, :config, :status, :created_by, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        name: data.name,
        type: data.type,
        config: JSON.stringify(data.config || {}),
        status: data.status || "configuring",
        created_by: data.created_by || null,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const updateConnectorQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.name !== undefined) { fields.push("name = :name"); replacements.name = data.name; }
  if (data.type !== undefined) { fields.push("type = :type"); replacements.type = data.type; }
  if (data.config !== undefined) { fields.push("config = :config"); replacements.config = JSON.stringify(data.config); }
  if (data.status !== undefined) { fields.push("status = :status"); replacements.status = data.status; }
  if (data.last_sync_at !== undefined) { fields.push("last_sync_at = :last_sync_at"); replacements.last_sync_at = data.last_sync_at; }
  if (data.last_error !== undefined) { fields.push("last_error = :last_error"); replacements.last_error = data.last_error; }
  if (data.events_ingested !== undefined) { fields.push("events_ingested = :events_ingested"); replacements.events_ingested = data.events_ingested; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_connectors SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

export const deleteConnectorQuery = async (id: number, tenant: string) => {
  return sequelize.query(
    `DELETE FROM shadow_ai_connectors WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.DELETE }
  );
};

// ==================== EVENTS ====================

export const getEventsQuery = async (filters: any, tenant: string) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.start_date) { conditions.push("timestamp >= :start_date"); replacements.start_date = filters.start_date; }
  if (filters.end_date) { conditions.push("timestamp <= :end_date"); replacements.end_date = filters.end_date; }
  if (filters.user_identifier) { conditions.push("user_identifier = :user_identifier"); replacements.user_identifier = filters.user_identifier; }
  if (filters.department) { conditions.push("department = :department"); replacements.department = filters.department; }
  if (filters.ai_tool_name) { conditions.push("ai_tool_name = :ai_tool_name"); replacements.ai_tool_name = filters.ai_tool_name; }
  if (filters.ai_tool_category) { conditions.push("ai_tool_category = :ai_tool_category"); replacements.ai_tool_category = filters.ai_tool_category; }
  if (filters.action_type) { conditions.push("action_type = :action_type"); replacements.action_type = filters.action_type; }
  if (filters.risk_level) { conditions.push("risk_level = :risk_level"); replacements.risk_level = filters.risk_level; }
  if (filters.connector_id) { conditions.push("connector_id = :connector_id"); replacements.connector_id = filters.connector_id; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = ((filters.page || 1) - 1) * limit;
  replacements.limit = limit;
  replacements.offset = offset;

  const events = await sequelize.query(
    `SELECT * FROM shadow_ai_events ${where} ORDER BY timestamp DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT }
  );

  const countResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM shadow_ai_events ${where}`,
    { replacements, type: QueryTypes.SELECT }
  ) as any[];

  return { events, total: parseInt(countResult[0]?.total || "0", 10), page: filters.page || 1, limit };
};

export const createEventQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_events
     (connector_id, raw_event_id, timestamp, user_identifier, department,
      ai_tool_name, ai_tool_category, action_type, data_classification,
      source_ip, destination_url, metadata, risk_score, risk_level, created_at, updated_at)
     VALUES (:connector_id, :raw_event_id, :timestamp, :user_identifier, :department,
      :ai_tool_name, :ai_tool_category, :action_type, :data_classification,
      :source_ip, :destination_url, :metadata, :risk_score, :risk_level, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        connector_id: data.connector_id,
        raw_event_id: data.raw_event_id || null,
        timestamp: data.timestamp,
        user_identifier: data.user_identifier || null,
        department: data.department || null,
        ai_tool_name: data.ai_tool_name,
        ai_tool_category: data.ai_tool_category || null,
        action_type: data.action_type || "access",
        data_classification: data.data_classification || "unknown",
        source_ip: data.source_ip || null,
        destination_url: data.destination_url || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        risk_score: data.risk_score || null,
        risk_level: data.risk_level || null,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const createEventsBatchQuery = async (events: any[], tenant: string) => {
  const results = [];
  for (const data of events) {
    const result = await createEventQuery(data, tenant);
    results.push(result);
  }
  return results;
};

// ==================== INVENTORY ====================

export const getAllInventoryQuery = async (filters: any, tenant: string) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.category) { conditions.push("category = :category"); replacements.category = filters.category; }
  if (filters.approval_status) { conditions.push("approval_status = :approval_status"); replacements.approval_status = filters.approval_status; }
  if (filters.risk_classification) { conditions.push("risk_classification = :risk_classification"); replacements.risk_classification = filters.risk_classification; }
  if (filters.search) { conditions.push("(tool_name ILIKE :search OR tool_domain ILIKE :search)"); replacements.search = `%${filters.search}%`; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = ((filters.page || 1) - 1) * limit;
  replacements.limit = limit;
  replacements.offset = offset;

  const items = await sequelize.query(
    `SELECT * FROM shadow_ai_inventory ${where} ORDER BY total_events DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT }
  );

  const countResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM shadow_ai_inventory ${where}`,
    { replacements, type: QueryTypes.SELECT }
  ) as any[];

  return { items, total: parseInt(countResult[0]?.total || "0", 10), page: filters.page || 1, limit };
};

export const getInventoryByIdQuery = async (id: number, tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM shadow_ai_inventory WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  return result.length ? result[0] : null;
};

export const getInventoryByToolNameQuery = async (toolName: string, tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM shadow_ai_inventory WHERE tool_name = :toolName`,
    { replacements: { toolName }, type: QueryTypes.SELECT }
  );
  return result.length ? result[0] : null;
};

export const upsertInventoryQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_inventory
     (tool_name, tool_domain, category, first_seen, last_seen, total_events, unique_users, departments, risk_classification, approval_status, created_at, updated_at)
     VALUES (:tool_name, :tool_domain, :category, :first_seen, :last_seen, :total_events, :unique_users, :departments, :risk_classification, :approval_status, NOW(), NOW())
     ON CONFLICT (tool_name)
     DO UPDATE SET
       last_seen = GREATEST(shadow_ai_inventory.last_seen, EXCLUDED.last_seen),
       total_events = shadow_ai_inventory.total_events + EXCLUDED.total_events,
       departments = (
         SELECT jsonb_agg(DISTINCT elem)
         FROM (
           SELECT jsonb_array_elements(shadow_ai_inventory.departments) AS elem
           UNION
           SELECT jsonb_array_elements(EXCLUDED.departments) AS elem
         ) sub
       ),
       updated_at = NOW()
     RETURNING *`,
    {
      replacements: {
        tool_name: data.tool_name,
        tool_domain: data.tool_domain,
        category: data.category || "other",
        first_seen: data.first_seen,
        last_seen: data.last_seen,
        total_events: data.total_events || 1,
        unique_users: data.unique_users || 0,
        departments: JSON.stringify(data.departments || []),
        risk_classification: data.risk_classification || "unclassified",
        approval_status: data.approval_status || "discovered",
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const updateInventoryQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.approval_status !== undefined) { fields.push("approval_status = :approval_status"); replacements.approval_status = data.approval_status; }
  if (data.risk_classification !== undefined) { fields.push("risk_classification = :risk_classification"); replacements.risk_classification = data.risk_classification; }
  if (data.notes !== undefined) { fields.push("notes = :notes"); replacements.notes = data.notes; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_inventory SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

// ==================== POLICIES ====================

export const getAllPoliciesQuery = async (tenant: string) => {
  return sequelize.query(
    `SELECT p.*, COALESCE(v.violation_count, 0) as violation_count
     FROM shadow_ai_policies p
     LEFT JOIN (
       SELECT policy_id, COUNT(*) as violation_count
       FROM shadow_ai_violations
       WHERE status = 'open'
       GROUP BY policy_id
     ) v ON p.id = v.policy_id
     ORDER BY p.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
};

export const getPolicyByIdQuery = async (id: number, tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM shadow_ai_policies WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  return result.length ? result[0] : null;
};

export const createPolicyQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_policies (name, description, department_scope, rules, severity, is_active, created_by, created_at, updated_at)
     VALUES (:name, :description, :department_scope, :rules, :severity, :is_active, :created_by, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        name: data.name,
        description: data.description || null,
        department_scope: data.department_scope ? JSON.stringify(data.department_scope) : null,
        rules: JSON.stringify(data.rules),
        severity: data.severity || "medium",
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_by: data.created_by || null,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const updatePolicyQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.name !== undefined) { fields.push("name = :name"); replacements.name = data.name; }
  if (data.description !== undefined) { fields.push("description = :description"); replacements.description = data.description; }
  if (data.department_scope !== undefined) { fields.push("department_scope = :department_scope"); replacements.department_scope = JSON.stringify(data.department_scope); }
  if (data.rules !== undefined) { fields.push("rules = :rules"); replacements.rules = JSON.stringify(data.rules); }
  if (data.severity !== undefined) { fields.push("severity = :severity"); replacements.severity = data.severity; }
  if (data.is_active !== undefined) { fields.push("is_active = :is_active"); replacements.is_active = data.is_active; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_policies SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

export const deletePolicyQuery = async (id: number, tenant: string) => {
  return sequelize.query(
    `DELETE FROM shadow_ai_policies WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.DELETE }
  );
};

// ==================== VIOLATIONS ====================

export const getViolationsQuery = async (filters: any, tenant: string) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.status) { conditions.push("v.status = :status"); replacements.status = filters.status; }
  if (filters.severity) { conditions.push("v.severity = :severity"); replacements.severity = filters.severity; }
  if (filters.policy_id) { conditions.push("v.policy_id = :policy_id"); replacements.policy_id = filters.policy_id; }
  if (filters.user_identifier) { conditions.push("v.user_identifier = :user_identifier"); replacements.user_identifier = filters.user_identifier; }
  if (filters.department) { conditions.push("v.department = :department"); replacements.department = filters.department; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = ((filters.page || 1) - 1) * limit;
  replacements.limit = limit;
  replacements.offset = offset;

  const violations = await sequelize.query(
    `SELECT v.*, p.name as policy_name
     FROM shadow_ai_violations v
     LEFT JOIN shadow_ai_policies p ON v.policy_id = p.id
     ${where}
     ORDER BY v.created_at DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT }
  );

  const countResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM shadow_ai_violations v ${where}`,
    { replacements, type: QueryTypes.SELECT }
  ) as any[];

  return { violations, total: parseInt(countResult[0]?.total || "0", 10), page: filters.page || 1, limit };
};

export const updateViolationQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.status !== undefined) { fields.push("status = :status"); replacements.status = data.status; }
  if (data.resolved_by !== undefined) { fields.push("resolved_by = :resolved_by"); replacements.resolved_by = data.resolved_by; }
  if (data.resolved_at !== undefined) { fields.push("resolved_at = :resolved_at"); replacements.resolved_at = data.resolved_at; }
  if (data.exception_id !== undefined) { fields.push("exception_id = :exception_id"); replacements.exception_id = data.exception_id; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_violations SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

export const createViolationQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_violations
     (event_id, policy_id, user_identifier, department, severity, description, status, created_at, updated_at)
     VALUES (:event_id, :policy_id, :user_identifier, :department, :severity, :description, :status, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        event_id: data.event_id,
        policy_id: data.policy_id,
        user_identifier: data.user_identifier || null,
        department: data.department || null,
        severity: data.severity,
        description: data.description,
        status: data.status || "open",
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

// ==================== EXCEPTIONS ====================

export const getAllExceptionsQuery = async (filters: any, tenant: string) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.status) { conditions.push("e.status = :status"); replacements.status = filters.status; }
  if (filters.policy_id) { conditions.push("e.policy_id = :policy_id"); replacements.policy_id = filters.policy_id; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = ((filters.page || 1) - 1) * limit;
  replacements.limit = limit;
  replacements.offset = offset;

  return sequelize.query(
    `SELECT e.*, p.name as policy_name
     FROM shadow_ai_exceptions e
     LEFT JOIN shadow_ai_policies p ON e.policy_id = p.id
     ${where}
     ORDER BY e.created_at DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT }
  );
};

export const createExceptionQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_exceptions
     (policy_id, department, user_identifier, reason, compensating_controls, expires_at, status, created_at, updated_at)
     VALUES (:policy_id, :department, :user_identifier, :reason, :compensating_controls, :expires_at, :status, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        policy_id: data.policy_id,
        department: data.department || null,
        user_identifier: data.user_identifier || null,
        reason: data.reason,
        compensating_controls: data.compensating_controls || null,
        expires_at: data.expires_at || null,
        status: "pending",
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const updateExceptionQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.status !== undefined) { fields.push("status = :status"); replacements.status = data.status; }
  if (data.approved_by !== undefined) { fields.push("approved_by = :approved_by"); replacements.approved_by = data.approved_by; }
  if (data.approved_at !== undefined) { fields.push("approved_at = :approved_at"); replacements.approved_at = data.approved_at; }
  if (data.reason !== undefined) { fields.push("reason = :reason"); replacements.reason = data.reason; }
  if (data.compensating_controls !== undefined) { fields.push("compensating_controls = :compensating_controls"); replacements.compensating_controls = data.compensating_controls; }
  if (data.expires_at !== undefined) { fields.push("expires_at = :expires_at"); replacements.expires_at = data.expires_at; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_exceptions SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

// ==================== REVIEWS ====================

export const getReviewsQuery = async (filters: any, tenant: string) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.review_type) { conditions.push("review_type = :review_type"); replacements.review_type = filters.review_type; }
  if (filters.status) { conditions.push("status = :status"); replacements.status = filters.status; }
  if (filters.assigned_to) { conditions.push("assigned_to = :assigned_to"); replacements.assigned_to = filters.assigned_to; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = ((filters.page || 1) - 1) * limit;
  replacements.limit = limit;
  replacements.offset = offset;

  return sequelize.query(
    `SELECT * FROM shadow_ai_reviews ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: QueryTypes.SELECT }
  );
};

export const createReviewQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_reviews
     (review_type, subject_id, subject_type, assigned_to, status, notes, created_at, updated_at)
     VALUES (:review_type, :subject_id, :subject_type, :assigned_to, :status, :notes, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        review_type: data.review_type,
        subject_id: data.subject_id,
        subject_type: data.subject_type,
        assigned_to: data.assigned_to || null,
        status: data.status || "pending",
        notes: data.notes || null,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

export const updateReviewQuery = async (id: number, data: any, tenant: string) => {
  const fields: string[] = [];
  const replacements: Record<string, any> = { id };

  if (data.status !== undefined) { fields.push("status = :status"); replacements.status = data.status; }
  if (data.assigned_to !== undefined) { fields.push("assigned_to = :assigned_to"); replacements.assigned_to = data.assigned_to; }
  if (data.decision !== undefined) { fields.push("decision = :decision"); replacements.decision = data.decision; }
  if (data.notes !== undefined) { fields.push("notes = :notes"); replacements.notes = data.notes; }
  if (data.completed_at !== undefined) { fields.push("completed_at = :completed_at"); replacements.completed_at = data.completed_at; }

  fields.push("updated_at = NOW()");

  const [result] = await sequelize.query(
    `UPDATE shadow_ai_reviews SET ${fields.join(", ")} WHERE id = :id RETURNING *`,
    { replacements, type: QueryTypes.UPDATE }
  );
  return result;
};

// ==================== EVIDENCE EXPORTS ====================

export const getEvidenceExportsQuery = async (tenant: string) => {
  return sequelize.query(
    `SELECT * FROM shadow_ai_evidence_exports ORDER BY created_at DESC`,
    { type: QueryTypes.SELECT }
  );
};

export const createEvidenceExportQuery = async (data: any, tenant: string) => {
  const [result] = await sequelize.query(
    `INSERT INTO shadow_ai_evidence_exports
     (name, date_range_start, date_range_end, filters, export_format, generated_by, generated_at, created_at, updated_at)
     VALUES (:name, :date_range_start, :date_range_end, :filters, :export_format, :generated_by, NOW(), NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        name: data.name,
        date_range_start: data.date_range_start,
        date_range_end: data.date_range_end,
        filters: data.filters ? JSON.stringify(data.filters) : null,
        export_format: data.export_format || "csv",
        generated_by: data.generated_by || null,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result;
};

// ==================== DASHBOARD ====================

export const getDashboardSummaryQuery = async (tenant: string) => {
  const [tools] = await sequelize.query(
    `SELECT COUNT(*) as total_tools FROM shadow_ai_inventory`,
    { type: QueryTypes.SELECT }
  ) as any[];

  const [events] = await sequelize.query(
    `SELECT COUNT(*) as total_events FROM shadow_ai_events`,
    { type: QueryTypes.SELECT }
  ) as any[];

  const [users] = await sequelize.query(
    `SELECT COUNT(DISTINCT user_identifier) as active_users FROM shadow_ai_events WHERE user_identifier IS NOT NULL`,
    { type: QueryTypes.SELECT }
  ) as any[];

  const [violations] = await sequelize.query(
    `SELECT COUNT(*) as open_violations FROM shadow_ai_violations WHERE status = 'open'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  const riskDistribution = await sequelize.query(
    `SELECT risk_level, COUNT(*) as count FROM shadow_ai_events WHERE risk_level IS NOT NULL GROUP BY risk_level`,
    { type: QueryTypes.SELECT }
  );

  const topTools = await sequelize.query(
    `SELECT ai_tool_name, COUNT(*) as event_count, COUNT(DISTINCT user_identifier) as user_count
     FROM shadow_ai_events GROUP BY ai_tool_name ORDER BY event_count DESC LIMIT 10`,
    { type: QueryTypes.SELECT }
  );

  const recentViolations = await sequelize.query(
    `SELECT v.*, p.name as policy_name
     FROM shadow_ai_violations v
     LEFT JOIN shadow_ai_policies p ON v.policy_id = p.id
     WHERE v.status = 'open'
     ORDER BY v.created_at DESC LIMIT 5`,
    { type: QueryTypes.SELECT }
  );

  const departmentBreakdown = await sequelize.query(
    `SELECT department, COUNT(*) as event_count
     FROM shadow_ai_events WHERE department IS NOT NULL
     GROUP BY department ORDER BY event_count DESC LIMIT 10`,
    { type: QueryTypes.SELECT }
  );

  return {
    total_tools: parseInt((tools as any)?.total_tools || "0", 10),
    total_events: parseInt((events as any)?.total_events || "0", 10),
    active_users: parseInt((users as any)?.active_users || "0", 10),
    open_violations: parseInt((violations as any)?.open_violations || "0", 10),
    risk_distribution: riskDistribution,
    top_tools: topTools,
    recent_violations: recentViolations,
    department_breakdown: departmentBreakdown,
  };
};

export const getDashboardTrendsQuery = async (days: number, tenant: string) => {
  const trends = await sequelize.query(
    `SELECT DATE(timestamp) as date, COUNT(*) as event_count,
            COUNT(DISTINCT user_identifier) as user_count,
            COUNT(DISTINCT ai_tool_name) as tool_count
     FROM shadow_ai_events
     WHERE timestamp >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(timestamp)
     ORDER BY date ASC`,
    { type: QueryTypes.SELECT }
  );

  const riskTrends = await sequelize.query(
    `SELECT DATE(timestamp) as date, risk_level, COUNT(*) as count
     FROM shadow_ai_events
     WHERE timestamp >= NOW() - INTERVAL '${days} days' AND risk_level IS NOT NULL
     GROUP BY DATE(timestamp), risk_level
     ORDER BY date ASC`,
    { type: QueryTypes.SELECT }
  );

  return { trends, risk_trends: riskTrends };
};
