/**
 * Shadow AI Controller
 *
 * Handles insights, tools, users, rules, and configuration endpoints.
 * All endpoints require JWT auth. Write operations require Admin or Editor role.
 */

import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import {
  getInsightsSummaryQuery,
  getToolsByEventsQuery,
  getToolsByUsersQuery,
  getUsersByDepartmentQuery,
  getTrendQuery,
  getUserActivityQuery,
  getUserDetailQuery,
  getDepartmentActivityQuery,
} from "../utils/shadowAiInsights.utils";
import {
  getAllToolsQuery,
  getToolByIdQuery,
  getToolDepartmentsQuery,
  getToolTopUsersQuery,
  updateToolStatusQuery,
  linkToolToModelInventoryQuery,
} from "../utils/shadowAiTools.utils";
import {
  getAllRulesQuery,
  createRuleQuery,
  updateRuleQuery,
  deleteRuleQuery,
  getAlertHistoryQuery,
} from "../utils/shadowAiRules.utils";
import {
  getSyslogConfigsQuery,
  createSyslogConfigQuery,
  deleteSyslogConfigQuery,
} from "../utils/shadowAiConfig.utils";
import { ShadowAiToolStatus } from "../domain.layer/interfaces/i.shadowAi";

const FILE_NAME = "shadowAi.ctrl.ts";

// ─── Helpers ────────────────────────────────────────────────────────────

function isWriteRole(role: string): boolean {
  return role === "Admin" || role === "Editor";
}

function parsePeriod(period?: string): number {
  if (!period) return 30;
  const match = period.match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) : 30;
}

// ─── Insights ───────────────────────────────────────────────────────────

export async function getInsightsSummary(req: Request, res: Response) {
  const fn = "getInsightsSummary";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching insights summary", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const summary = await getInsightsSummaryQuery(tenantId);
    await logSuccess({ eventType: "Read", description: "insights summary fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](summary));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch insights summary", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getToolsByEvents(req: Request, res: Response) {
  const fn = "getToolsByEvents";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching tools by events", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const period = parsePeriod(req.query.period as string);
    const data = await getToolsByEventsQuery(tenantId, period);
    await logSuccess({ eventType: "Read", description: "tools by events fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch tools by events", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getToolsByUsers(req: Request, res: Response) {
  const fn = "getToolsByUsers";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching tools by users", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const period = parsePeriod(req.query.period as string);
    const data = await getToolsByUsersQuery(tenantId, period);
    await logSuccess({ eventType: "Read", description: "tools by users fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch tools by users", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getUsersByDepartment(req: Request, res: Response) {
  const fn = "getUsersByDepartment";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching users by department", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const period = parsePeriod(req.query.period as string);
    const data = await getUsersByDepartmentQuery(tenantId, period);
    await logSuccess({ eventType: "Read", description: "users by department fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch users by department", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTrend(req: Request, res: Response) {
  const fn = "getTrend";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching trend data", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const period = parsePeriod(req.query.period as string);
    const granularity = (req.query.granularity as string) || "daily";
    const validGranularities = ["daily", "weekly", "monthly"];
    const gran = validGranularities.includes(granularity)
      ? (granularity as "daily" | "weekly" | "monthly")
      : "daily";
    const data = await getTrendQuery(tenantId, period, gran);
    await logSuccess({ eventType: "Read", description: "trend data fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch trend data", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ─── User Activity ──────────────────────────────────────────────────────

export async function getUsers(req: Request, res: Response) {
  const fn = "getUsers";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching user activity", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const data = await getUserActivityQuery(tenantId, {
      page: parseInt((req.query.page as string) || "1", 10),
      limit: parseInt((req.query.limit as string) || "20", 10),
      sort: req.query.sort as string,
      department: req.query.department as string,
    });
    await logSuccess({ eventType: "Read", description: "user activity fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch user activity", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getUserDetail(req: Request, res: Response) {
  const fn = "getUserDetail";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const email = decodeURIComponent(Array.isArray(req.params.email) ? req.params.email[0] : req.params.email);

  logProcessing({ description: `fetching user detail: ${email}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const period = parsePeriod(req.query.period as string);
    const data = await getUserDetailQuery(tenantId, email, period);
    await logSuccess({ eventType: "Read", description: `user detail fetched: ${email}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch user detail", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getDepartmentActivity(req: Request, res: Response) {
  const fn = "getDepartmentActivity";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching department activity", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const data = await getDepartmentActivityQuery(tenantId);
    await logSuccess({ eventType: "Read", description: "department activity fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch department activity", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ─── Tools ──────────────────────────────────────────────────────────────

export async function getTools(req: Request, res: Response) {
  const fn = "getTools";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching shadow AI tools", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const data = await getAllToolsQuery(tenantId, {
      status: req.query.status as ShadowAiToolStatus | undefined,
      sort: req.query.sort as string,
      page: parseInt((req.query.page as string) || "1", 10),
      limit: parseInt((req.query.limit as string) || "20", 10),
    });
    await logSuccess({ eventType: "Read", description: "shadow AI tools fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch shadow AI tools", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getToolById(req: Request, res: Response) {
  const fn = "getToolById";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const toolId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `fetching tool: ${toolId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (isNaN(toolId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid tool ID"));
    }

    const tool = await getToolByIdQuery(tenantId, toolId);
    if (!tool) {
      return res.status(404).json(STATUS_CODE[404]("Tool not found"));
    }

    const [departments, topUsers] = await Promise.all([
      getToolDepartmentsQuery(tenantId, toolId),
      getToolTopUsersQuery(tenantId, toolId),
    ]);

    await logSuccess({ eventType: "Read", description: `tool fetched: ${toolId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(
      STATUS_CODE[200]({
        ...tool,
        departments,
        top_users: topUsers,
      })
    );
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch tool", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateToolStatus(req: Request, res: Response) {
  const fn = "updateToolStatus";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const toolId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `updating tool status: ${toolId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (!isWriteRole(req.role!)) {
      return res.status(403).json(STATUS_CODE[403]("Insufficient permissions"));
    }

    if (isNaN(toolId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid tool ID"));
    }

    const { status } = req.body;
    const validStatuses: ShadowAiToolStatus[] = [
      "detected", "under_review", "approved", "restricted", "blocked", "dismissed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid status value"));
    }

    const updated = await updateToolStatusQuery(tenantId, toolId, status);
    if (!updated) {
      return res.status(404).json(STATUS_CODE[404]("Tool not found"));
    }

    await logSuccess({ eventType: "Update", description: `tool status updated: ${toolId} → ${status}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    await logFailure({ eventType: "Update", description: "failed to update tool status", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function startGovernance(req: Request, res: Response) {
  const fn = "startGovernance";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const toolId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `starting governance for tool: ${toolId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (!isWriteRole(req.role!)) {
      return res.status(403).json(STATUS_CODE[403]("Insufficient permissions"));
    }

    if (isNaN(toolId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid tool ID"));
    }

    const tool = await getToolByIdQuery(tenantId, toolId);
    if (!tool) {
      return res.status(404).json(STATUS_CODE[404]("Tool not found"));
    }

    const { model_inventory, governance_owner_id } = req.body;

    if (!model_inventory?.provider || !model_inventory?.model || !governance_owner_id) {
      return res.status(400).json(STATUS_CODE[400]("Missing required fields: model_inventory.provider, model_inventory.model, governance_owner_id"));
    }

    let transaction: Transaction | null = null;

    try {
      transaction = await sequelize.transaction();

      // Create model inventory entry
      const [miResult] = await sequelize.query(
        `INSERT INTO "${tenantId}".model_inventories
           (provider, model, version, status, created_at, updated_at)
         VALUES (:provider, :model, :version, :status, NOW(), NOW())
         RETURNING id`,
        {
          replacements: {
            provider: model_inventory.provider,
            model: model_inventory.model,
            version: model_inventory.version || null,
            status: model_inventory.status || "Pending",
          },
          transaction,
        }
      );
      const modelInventoryId = (miResult as any[])[0].id;

      // Link tool to model inventory
      await linkToolToModelInventoryQuery(tenantId, toolId, modelInventoryId, undefined, transaction);

      // Update tool governance owner
      await sequelize.query(
        `UPDATE "${tenantId}".shadow_ai_tools
         SET governance_owner_id = :ownerId, status = 'under_review', updated_at = NOW()
         WHERE id = :toolId`,
        {
          replacements: { ownerId: governance_owner_id, toolId },
          transaction,
        }
      );

      await transaction.commit();

      await logSuccess({ eventType: "Create", description: `governance started for tool: ${toolId}, MI: ${modelInventoryId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

      return res.status(201).json(
        STATUS_CODE[201]({
          model_inventory_id: modelInventoryId,
          tool_id: toolId,
        })
      );
    } catch (innerError) {
      if (transaction) {
        try { await transaction.rollback(); } catch (rbErr) { console.warn("Rollback failed:", rbErr); }
      }
      throw innerError;
    }
  } catch (error) {
    await logFailure({ eventType: "Create", description: "failed to start governance", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ─── Rules ──────────────────────────────────────────────────────────────

export async function getRules(req: Request, res: Response) {
  const fn = "getRules";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching rules", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const rules = await getAllRulesQuery(tenantId);
    await logSuccess({ eventType: "Read", description: `${rules.length} rules fetched`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](rules));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch rules", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createRule(req: Request, res: Response) {
  const fn = "createRule";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "creating rule", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (!isWriteRole(req.role!)) {
      return res.status(403).json(STATUS_CODE[403]("Insufficient permissions"));
    }

    const { name, description, is_active, trigger_type, trigger_config, actions, notification_user_ids } = req.body;

    if (!name || !trigger_type || !actions || !Array.isArray(actions)) {
      return res.status(400).json(STATUS_CODE[400]("Missing required fields: name, trigger_type, actions"));
    }

    const rule = await createRuleQuery(tenantId, {
      name,
      description,
      is_active: is_active !== false,
      trigger_type,
      trigger_config: trigger_config || {},
      actions,
      created_by: userId,
      notification_user_ids,
    });

    await logSuccess({ eventType: "Create", description: `rule created: ${name}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(201).json(STATUS_CODE[201](rule));
  } catch (error) {
    await logFailure({ eventType: "Create", description: "failed to create rule", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRule(req: Request, res: Response) {
  const fn = "updateRule";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const ruleId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `updating rule: ${ruleId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (!isWriteRole(req.role!)) {
      return res.status(403).json(STATUS_CODE[403]("Insufficient permissions"));
    }

    if (isNaN(ruleId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid rule ID"));
    }

    const updated = await updateRuleQuery(tenantId, ruleId, req.body);
    if (!updated) {
      return res.status(404).json(STATUS_CODE[404]("Rule not found"));
    }

    await logSuccess({ eventType: "Update", description: `rule updated: ${ruleId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    await logFailure({ eventType: "Update", description: "failed to update rule", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRule(req: Request, res: Response) {
  const fn = "deleteRule";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const ruleId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `deleting rule: ${ruleId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (!isWriteRole(req.role!)) {
      return res.status(403).json(STATUS_CODE[403]("Insufficient permissions"));
    }

    if (isNaN(ruleId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid rule ID"));
    }

    const deleted = await deleteRuleQuery(tenantId, ruleId);
    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("Rule not found"));
    }

    await logSuccess({ eventType: "Delete", description: `rule deleted: ${ruleId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200]("Rule deleted successfully"));
  } catch (error) {
    await logFailure({ eventType: "Delete", description: "failed to delete rule", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAlertHistory(req: Request, res: Response) {
  const fn = "getAlertHistory";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching alert history", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const data = await getAlertHistoryQuery(tenantId, {
      page: parseInt((req.query.page as string) || "1", 10),
      limit: parseInt((req.query.limit as string) || "20", 10),
      ruleId: req.query.ruleId ? parseInt(req.query.ruleId as string, 10) : undefined,
    });
    await logSuccess({ eventType: "Read", description: "alert history fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch alert history", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ─── Configuration ──────────────────────────────────────────────────────

export async function getSyslogConfigs(req: Request, res: Response) {
  const fn = "getSyslogConfigs";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching syslog configs", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (req.role !== "Admin") {
      return res.status(403).json(STATUS_CODE[403]("Only admins can manage syslog configuration"));
    }

    const configs = await getSyslogConfigsQuery(tenantId);
    await logSuccess({ eventType: "Read", description: "syslog configs fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](configs));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch syslog configs", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createSyslogConfig(req: Request, res: Response) {
  const fn = "createSyslogConfig";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "creating syslog config", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (req.role !== "Admin") {
      return res.status(403).json(STATUS_CODE[403]("Only admins can manage syslog configuration"));
    }

    const { source_identifier, parser_type, is_active } = req.body;
    if (!source_identifier || !parser_type) {
      return res.status(400).json(STATUS_CODE[400]("Missing required fields: source_identifier, parser_type"));
    }

    const validParsers = ["zscaler", "netskope", "squid", "generic_kv"];
    if (!validParsers.includes(parser_type)) {
      return res.status(400).json(STATUS_CODE[400](`Invalid parser_type. Must be one of: ${validParsers.join(", ")}`));
    }

    const config = await createSyslogConfigQuery(tenantId, {
      source_identifier,
      parser_type,
      is_active: is_active !== false,
    });

    await logSuccess({ eventType: "Create", description: `syslog config created: ${source_identifier}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(201).json(STATUS_CODE[201](config));
  } catch (error) {
    await logFailure({ eventType: "Create", description: "failed to create syslog config", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSyslogConfig(req: Request, res: Response) {
  const fn = "deleteSyslogConfig";
  const userId = req.userId!;
  const tenantId = req.tenantId!;
  const configId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({ description: `deleting syslog config: ${configId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (req.role !== "Admin") {
      return res.status(403).json(STATUS_CODE[403]("Only admins can manage syslog configuration"));
    }

    if (isNaN(configId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid config ID"));
    }

    const deleted = await deleteSyslogConfigQuery(tenantId, configId);
    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("Syslog config not found"));
    }

    await logSuccess({ eventType: "Delete", description: `syslog config deleted: ${configId}`, functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200]("Syslog config deleted successfully"));
  } catch (error) {
    await logFailure({ eventType: "Delete", description: "failed to delete syslog config", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
