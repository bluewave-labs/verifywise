/**
 * Shadow AI Ingestion Controller
 *
 * Handles incoming SIEM/proxy events via REST API.
 * Authenticates via X-API-Key header, processes events through
 * the tool matcher and model extractor pipeline.
 */

import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger from "../utils/logger/fileLogger";
import { validateApiKeyWithCache } from "../utils/shadowAiApiKey.utils";
import {
  normalizeEvent,
  insertEventsQuery,
} from "../utils/shadowAiIngestion.utils";
import {
  matchDomain,
  ensureTenantTool,
  updateToolCounters,
} from "../services/shadowAiToolMatcher.service";
import { extractModel } from "../services/shadowAiModelExtractor.service";
import { ShadowAiIngestionRequest } from "../domain.layer/interfaces/i.shadowAi";

const MAX_EVENTS_PER_REQUEST = 10000;

/**
 * POST /api/v1/shadow-ai/events
 * Ingest a batch of shadow AI events.
 * Authenticated via X-API-Key header (not JWT).
 */
export async function ingestEvents(req: Request, res: Response) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("Missing X-API-Key header"));
  }

  // Validate API key and resolve tenant
  let tenant: string | null;
  try {
    tenant = await validateApiKeyWithCache(apiKey);
  } catch (error) {
    logger.error("❌ API key validation error:", error);
    return res.status(500).json(STATUS_CODE[500]("Key validation failed"));
  }

  if (!tenant) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("Invalid or revoked API key"));
  }

  // Validate request body
  const body = req.body as ShadowAiIngestionRequest;
  if (!body.events || !Array.isArray(body.events)) {
    return res
      .status(400)
      .json(STATUS_CODE[400]("Request body must contain an 'events' array"));
  }

  if (body.events.length === 0) {
    return res.status(200).json(STATUS_CODE[200]({ ingested: 0 }));
  }

  if (body.events.length > MAX_EVENTS_PER_REQUEST) {
    return res
      .status(413)
      .json(
        STATUS_CODE[413](
          `Maximum ${MAX_EVENTS_PER_REQUEST} events per request`
        )
      );
  }

  // Validate required fields and basic formats
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (let i = 0; i < body.events.length; i++) {
    const evt = body.events[i];
    if (!evt.user_email || !evt.destination || !evt.timestamp) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400](
            `Event at index ${i} missing required field(s): user_email, destination, timestamp`
          )
        );
    }
    if (!EMAIL_REGEX.test(evt.user_email)) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400](
            `Event at index ${i} has invalid user_email format`
          )
        );
    }
  }

  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Track tool stats for batch counter updates
    const toolEventCounts = new Map<number, number>();
    const toolUserSets = new Map<number, Set<string>>();

    // Process each event through the pipeline
    const processedEvents: Array<{
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
    }> = [];

    for (const rawEvent of body.events) {
      const normalized = normalizeEvent(rawEvent);

      // Step 1: Match domain against tool registry
      let detectedToolId: number | undefined;
      const registryMatch = await matchDomain(normalized.destination);

      if (registryMatch) {
        // Step 2: Ensure tool exists in tenant's table
        const toolId = await ensureTenantTool(
          tenant,
          registryMatch,
          transaction
        );
        detectedToolId = toolId;

        // Track for batch counter updates
        toolEventCounts.set(
          toolId,
          (toolEventCounts.get(toolId) || 0) + 1
        );
        if (!toolUserSets.has(toolId)) {
          toolUserSets.set(toolId, new Set());
        }
        toolUserSets.get(toolId)!.add(normalized.user_email);
      }

      // Step 3: Extract model from URI path
      let detectedModel: string | undefined;
      if (normalized.uri_path) {
        const model = await extractModel(
          normalized.destination,
          normalized.uri_path
        );
        if (model) detectedModel = model;
      }

      processedEvents.push({
        user_email: normalized.user_email,
        destination: normalized.destination,
        uri_path: normalized.uri_path,
        http_method: normalized.http_method,
        action: normalized.action,
        detected_tool_id: detectedToolId,
        detected_model: detectedModel,
        event_timestamp: normalized.event_timestamp,
        department: normalized.department,
        job_title: normalized.job_title,
        manager_email: normalized.manager_email,
      });
    }

    // Batch insert all events
    const insertedCount = await insertEventsQuery(
      tenant,
      processedEvents,
      transaction
    );

    // Update tool counters
    for (const [toolId, count] of toolEventCounts.entries()) {
      await updateToolCounters(
        tenant,
        toolId,
        count,
        toolUserSets.get(toolId) || new Set(),
        transaction
      );
    }

    await transaction.commit();

    logger.debug(
      `✅ Ingested ${insertedCount} shadow AI events for tenant ${tenant.substring(0, 4)}...`
    );

    return res.status(200).json(
      STATUS_CODE[200]({
        ingested: insertedCount,
        tools_matched: toolEventCounts.size,
      })
    );
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error("Transaction rollback failed:", rollbackError);
      }
    }

    logger.error("❌ Error in shadow AI event ingestion:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
