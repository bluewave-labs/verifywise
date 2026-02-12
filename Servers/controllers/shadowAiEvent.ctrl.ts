import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getEventsQuery,
  createEventQuery,
  createEventsBatchQuery,
  getConnectorByIdQuery,
  upsertInventoryQuery,
  getAllPoliciesQuery,
  createViolationQuery,
} from "../utils/shadowAi.utils";

// Import ShadowAI core engine
import { EventNormalizer } from "../../ShadowAI/normalization/event.normalizer";
import { RiskEngine } from "../../ShadowAI/engine/risk.engine";
import { PolicyEngine } from "../../ShadowAI/engine/policy.engine";
import { matchAITool } from "../../ShadowAI/normalization/ai-tool.registry";

const normalizer = new EventNormalizer();
const riskEngine = new RiskEngine();
const policyEngine = new PolicyEngine();

export async function getEvents(req: Request, res: Response): Promise<any> {
  try {
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      user_identifier: req.query.user_identifier,
      department: req.query.department,
      ai_tool_name: req.query.ai_tool_name,
      ai_tool_category: req.query.ai_tool_category,
      action_type: req.query.action_type,
      risk_level: req.query.risk_level,
      connector_id: req.query.connector_id ? parseInt(req.query.connector_id as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const result = await getEventsQuery(filters, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function ingestEvents(req: Request, res: Response): Promise<any> {
  try {
    const { connector_id, events: rawEvents, source_type } = req.body;

    if (!connector_id) {
      return res.status(400).json(STATUS_CODE[400]("connector_id is required"));
    }

    if (!rawEvents || !Array.isArray(rawEvents) || rawEvents.length === 0) {
      return res.status(400).json(STATUS_CODE[400]("events array is required and must not be empty"));
    }

    // Verify connector exists
    const connector = await getConnectorByIdQuery(connector_id, req.tenantId!);
    if (!connector) {
      return res.status(404).json(STATUS_CODE[404]("Connector not found"));
    }

    // Fetch active policies for evaluation
    const policies = await getAllPoliciesQuery(req.tenantId!) as any[];

    const results = {
      total_received: rawEvents.length,
      ai_related: 0,
      non_ai_related: 0,
      events_created: 0,
      violations_created: 0,
      errors: [] as string[],
    };

    for (const rawData of rawEvents) {
      try {
        // Normalize the raw event
        const normResult = normalizer.normalize(
          { source_type: source_type || "webhook", raw_data: rawData, received_at: new Date() },
          connector_id
        );

        if (!normResult.is_ai_related || !normResult.event) {
          results.non_ai_related++;
          continue;
        }

        results.ai_related++;

        // Calculate risk
        const toolRisk = normResult.matched_tool?.default_risk || "unclassified";
        const riskResult = riskEngine.calculateRisk(normResult.event as any, toolRisk as any);
        normResult.event.risk_score = riskResult.total_score;
        normResult.event.risk_level = riskResult.risk_level;

        // Store the event
        const createdEvents = await createEventQuery(normResult.event, req.tenantId!);
        results.events_created++;

        // Update inventory
        if (normResult.matched_tool) {
          await upsertInventoryQuery({
            tool_name: normResult.event.ai_tool_name,
            tool_domain: normResult.matched_tool.domains[0] || "",
            category: normResult.matched_tool.category,
            first_seen: normResult.event.timestamp,
            last_seen: normResult.event.timestamp,
            total_events: 1,
            unique_users: normResult.event.user_identifier ? 1 : 0,
            departments: normResult.event.department ? [normResult.event.department] : [],
            risk_classification: normResult.matched_tool.default_risk,
          }, req.tenantId!);
        }

        // Evaluate policies - need the event with an ID
        if (policies.length > 0 && (createdEvents as any)?.[0]?.id) {
          const eventWithId = { ...normResult.event, id: (createdEvents as any)[0].id };
          const policyResult = policyEngine.evaluate(eventWithId as any, policies);
          for (const violation of policyResult.violations) {
            await createViolationQuery(violation, req.tenantId!);
            results.violations_created++;
          }
        }
      } catch (err) {
        results.errors.push((err as Error).message);
      }
    }

    return res.status(200).json(STATUS_CODE[200](results));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
