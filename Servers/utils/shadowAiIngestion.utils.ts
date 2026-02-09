/**
 * Shadow AI Ingestion Utils
 *
 * Database queries for ingesting and storing Shadow AI events.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { NormalizedShadowAiEvent } from "../domain.layer/interfaces/i.shadowAi";

/**
 * Insert a batch of events into the tenant's shadow_ai_events table.
 */
export async function insertEventsQuery(
  tenant: string,
  events: Array<{
    user_email: string;
    destination: string;
    uri_path?: string;
    http_method?: string;
    action: string;
    detected_tool_id?: number;
    detected_model?: string;
    event_timestamp: Date;
    department?: string;
    job_title?: string;
    manager_email?: string;
  }>,
  transaction?: Transaction
): Promise<number> {
  if (events.length === 0) return 0;

  // Build batch INSERT with VALUES list
  const values: string[] = [];
  const replacements: Record<string, any> = {};

  events.forEach((evt, i) => {
    values.push(
      `(:user_email_${i}, :destination_${i}, :uri_path_${i}, :http_method_${i},
        :action_${i}, :detected_tool_id_${i}, :detected_model_${i},
        :event_timestamp_${i}, :department_${i}, :job_title_${i}, :manager_email_${i})`
    );
    replacements[`user_email_${i}`] = evt.user_email;
    replacements[`destination_${i}`] = evt.destination;
    replacements[`uri_path_${i}`] = evt.uri_path || null;
    replacements[`http_method_${i}`] = evt.http_method || null;
    replacements[`action_${i}`] = evt.action || "allowed";
    replacements[`detected_tool_id_${i}`] = evt.detected_tool_id || null;
    replacements[`detected_model_${i}`] = evt.detected_model || null;
    replacements[`event_timestamp_${i}`] = evt.event_timestamp;
    replacements[`department_${i}`] = evt.department || null;
    replacements[`job_title_${i}`] = evt.job_title || null;
    replacements[`manager_email_${i}`] = evt.manager_email || null;
  });

  const sql = `
    INSERT INTO "${tenant}".shadow_ai_events
      (user_email, destination, uri_path, http_method, action,
       detected_tool_id, detected_model, event_timestamp,
       department, job_title, manager_email)
    VALUES ${values.join(",\n")}
  `;

  await sequelize.query(sql, {
    replacements,
    ...(transaction ? { transaction } : {}),
  });

  return events.length;
}

/**
 * Get recently detected tool IDs from this batch (tools created during this ingestion).
 * Used by the rules engine to detect "new_tool_detected" triggers.
 */
export async function getNewlyDetectedToolIds(
  tenant: string,
  sinceMinutes: number = 5
): Promise<number[]> {
  const [rows] = await sequelize.query(
    `SELECT id FROM "${tenant}".shadow_ai_tools
     WHERE first_detected_at > NOW() - INTERVAL '${sinceMinutes} minutes'`
  );

  return (rows as any[]).map((r) => r.id);
}

/**
 * Normalize a raw ingestion event to the internal format.
 */
export function normalizeEvent(rawEvent: {
  user_email: string;
  destination: string;
  uri_path?: string;
  http_method?: string;
  action?: string;
  timestamp: string;
  department?: string;
  job_title?: string;
  manager_email?: string;
}): NormalizedShadowAiEvent {
  return {
    user_email: rawEvent.user_email.toLowerCase().trim(),
    destination: rawEvent.destination.toLowerCase().trim(),
    uri_path: rawEvent.uri_path || undefined,
    http_method: rawEvent.http_method?.toUpperCase() || undefined,
    action: (rawEvent.action === "blocked" ? "blocked" : "allowed") as
      | "allowed"
      | "blocked",
    event_timestamp: new Date(rawEvent.timestamp),
    department: rawEvent.department || undefined,
    job_title: rawEvent.job_title || undefined,
    manager_email: rawEvent.manager_email?.toLowerCase().trim() || undefined,
  };
}
