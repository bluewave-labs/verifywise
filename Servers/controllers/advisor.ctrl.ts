import { Request, Response } from "express";
import { runAgent, streamAgent } from "../advisor/agent";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getLLMKeysWithKeyQuery, getLLMProviderUrl } from "../utils/llmKey.utils";
import { LLMProvider } from "../domain.layer/interfaces/i.llmKey";
import {
  getConversationQuery,
  upsertConversationQuery,
} from "../utils/advisorConversation.utils";
import { IAdvisorMessage } from "../domain.layer/interfaces/i.advisorConversation";
import { availableRiskTools } from "../advisor/functions/riskFunctions";
import { availableModelInventoryTools } from "../advisor/functions/modelInventoryFunctions";
import { availableModelRiskTools } from "../advisor/functions/modelRiskFunctions";
import { availableVendorTools } from "../advisor/functions/vendorFunctions";
import { availableIncidentTools } from "../advisor/functions/incidentFunctions";
import { availableTaskTools } from "../advisor/functions/taskFunctions";
import { availablePolicyTools } from "../advisor/functions/policyFunctions";
import { toolsDefinition as riskToolsDefinition } from "../advisor/tools/riskTools";
import { toolsDefinition as modelInventoryToolsDefinition } from "../advisor/tools/modelInventoryTools";
import { toolsDefinition as modelRiskToolsDefinition } from "../advisor/tools/modelRiskTools";
import { toolsDefinition as vendorToolsDefinition } from "../advisor/tools/vendorTools";
import { toolsDefinition as incidentToolsDefinition } from "../advisor/tools/incidentTools";
import { toolsDefinition as taskToolsDefinition } from "../advisor/tools/taskTools";
import { toolsDefinition as policyToolsDefinition } from "../advisor/tools/policyTools";

const fileName = "advisor.ctrl.ts";

const availableTools = {
  ...availableRiskTools,
  ...availableModelInventoryTools,
  ...availableModelRiskTools,
  ...availableVendorTools,
  ...availableIncidentTools,
  ...availableTaskTools,
  ...availablePolicyTools,
};

const toolsDefinition = [
  ...riskToolsDefinition,
  ...modelInventoryToolsDefinition,
  ...modelRiskToolsDefinition,
  ...vendorToolsDefinition,
  ...incidentToolsDefinition,
  ...taskToolsDefinition,
  ...policyToolsDefinition,
];

export async function runAdvisor(req: Request, res: Response) {
  const functionName = "runAdvisor";
  logStructured(
    "processing",
    "Getting VerifyWise advisor response",
    functionName,
    fileName,
  );
  logger.debug(" Getting VerifyWise advisor response");

  try {
    const prompt = req.body.prompt;
    const tenantId = req.tenantId!;
    const userId = req.userId ? Number(req.userId) : undefined;
    const llmKeyId = req.query.llmKeyId ? Number(Array.isArray(req.query.llmKeyId) ? req.query.llmKeyId[0] : req.query.llmKeyId) : undefined;

    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant context is required" });
    }

    logger.debug(
      `Running advisor for tenant: ${tenantId}, user: ${userId}, llmKeyId: ${llmKeyId}`,
    );

    const clients = await getLLMKeysWithKeyQuery(tenantId);

    if (clients.length === 0) {
      logger.debug(`No LLM keys found for tenant: ${tenantId}`);
      return res
        .status(400)
        .json({ error: "No LLM keys configured for this tenant." });
    }

    // Select the LLM key based on llmKeyId parameter or default to first key
    let apiKey = clients[0];
    if (llmKeyId !== undefined) {
      const selectedKey = clients.find((key: any) => key.id === llmKeyId);
      if (selectedKey) {
        apiKey = selectedKey;
        logger.debug(`Using selected LLM key: ${apiKey.name} (ID: ${llmKeyId})`);
      } else {
        logger.warn(`LLM key ID ${llmKeyId} not found, using default key`);
      }
    }

    const url = apiKey.url || getLLMProviderUrl(apiKey.name as LLMProvider);

    const response = await runAgent({
      apiKey: apiKey.key || "",
      baseURL: url,
      model: apiKey.model,
      userPrompt: prompt,
      tenant: tenantId,
      availableTools,
      toolsDefinition,
      provider: apiKey.name as "Anthropic" | "OpenAI" | "OpenRouter",
    });

    logStructured(
      "successful",
      "Getting VerifyWise advisor response successful",
      functionName,
      fileName,
    );

    // Parse the response using the ---CHART_DATA--- separator format
    let parsedResponse: any = { markdown: response, chartData: null };

    try {
      // Convert escaped newlines to actual newlines
      let content = response.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      let markdown = content;
      let chartData = null;

      // Split by the ---CHART_DATA--- separator
      const separator = '---CHART_DATA---';
      const separatorIndex = content.indexOf(separator);

      if (separatorIndex !== -1) {
        // Extract markdown (before separator) and chart JSON (after separator)
        markdown = content.substring(0, separatorIndex).trim();
        const chartSection = content.substring(separatorIndex + separator.length).trim();

        // Parse the chart JSON if it's not "null"
        if (chartSection && chartSection !== 'null') {
          try {
            chartData = JSON.parse(chartSection);
          } catch (e) {
            logger.warn(`Failed to parse chart data from separator format: ${e}`);
          }
        }
      } else {
        // Fallback: try to find chart JSON in code blocks or inline
        // First, try ```chart code blocks
        const chartCodeBlockMatch = content.match(/```chart\s*([\s\S]*?)```/);
        if (chartCodeBlockMatch) {
          try {
            chartData = JSON.parse(chartCodeBlockMatch[1].trim());
            markdown = content.replace(/```chart\s*[\s\S]*?```/g, '').trim();
          } catch (e) {
            logger.warn(`Failed to parse chart code block: ${e}`);
          }
        }
      }

      // Clean up any extra whitespace
      markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

      parsedResponse = {
        markdown: markdown,
        chartData: chartData,
      };
    } catch (error) {
      logger.warn(
        `Failed to parse response, using raw response: ${error}`,
      );
      parsedResponse = {
        markdown: response.replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        chartData: null,
      };
    }

    return res.status(200).json({ prompt, response: parsedResponse });
  } catch (error) {
    logStructured(
      "error",
      "failed to get VerifyWise advisor response",
      functionName,
      fileName,
    );
    logger.error("❌ Error in getting VerifyWise advisor response:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get conversation history for a specific domain
 */
export async function getConversation(req: Request, res: Response) {
  const functionName = "getConversation";

  try {
    const tenantId = req.tenantId!;
    const userId = req.userId ? Number(req.userId) : undefined;
    const domain = Array.isArray(req.params.domain) ? req.params.domain[0] : req.params.domain;

    if (!userId) {
      return res.status(400).json({ error: "User context is required" });
    }

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    logger.debug(`Getting conversation for tenant: ${tenantId}, user: ${userId}, domain: ${domain}`);

    const conversation = await getConversationQuery(tenantId, userId, domain);

    if (!conversation) {
      // Return empty messages array if no conversation exists
      return res.status(200).json({
        domain,
        messages: [],
      });
    }

    logStructured(
      "successful",
      `Retrieved conversation for domain: ${domain}`,
      functionName,
      fileName,
    );

    return res.status(200).json({
      domain: conversation.domain,
      messages: conversation.messages,
    });
  } catch (error) {
    logStructured(
      "error",
      "Failed to get conversation",
      functionName,
      fileName,
    );
    logger.error("❌ Error getting conversation:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Save/update conversation messages for a specific domain
 */
export async function saveConversation(req: Request, res: Response) {
  const functionName = "saveConversation";

  try {
    const tenantId = req.tenantId!;
    const userId = req.userId ? Number(req.userId) : undefined;
    const domain = Array.isArray(req.params.domain) ? req.params.domain[0] : req.params.domain;
    const messages: IAdvisorMessage[] = req.body.messages;

    if (!userId) {
      return res.status(400).json({ error: "User context is required" });
    }

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    logger.debug(`Saving conversation for tenant: ${tenantId}, user: ${userId}, domain: ${domain}, messages: ${messages.length}`);

    const conversation = await upsertConversationQuery(tenantId, userId, domain, messages);

    logStructured(
      "successful",
      `Saved conversation for domain: ${domain} with ${messages.length} messages`,
      functionName,
      fileName,
    );

    return res.status(200).json({
      domain: conversation.domain,
      messages: conversation.messages,
    });
  } catch (error) {
    logStructured(
      "error",
      "Failed to save conversation",
      functionName,
      fileName,
    );
    logger.error("❌ Error saving conversation:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Streaming advisor endpoint — returns SSE text/event-stream.
 * Tool-calling iterations happen server-side; the final LLM response streams to the client.
 */
export async function streamAdvisor(req: Request, res: Response) {
  const functionName = "streamAdvisor";
  logStructured(
    "processing",
    "Starting streaming advisor response",
    functionName,
    fileName,
  );

  try {
    const prompt = req.body.prompt;
    const tenantId = req.tenantId!;
    const userId = req.userId ? Number(req.userId) : undefined;
    const llmKeyId = req.query.llmKeyId
      ? Number(Array.isArray(req.query.llmKeyId) ? req.query.llmKeyId[0] : req.query.llmKeyId)
      : undefined;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: "Tenant context is required" });
      return;
    }

    logger.debug(
      `Streaming advisor for tenant: ${tenantId}, user: ${userId}, llmKeyId: ${llmKeyId}`,
    );

    const clients = await getLLMKeysWithKeyQuery(tenantId);

    if (clients.length === 0) {
      res.status(400).json({ error: "No LLM keys configured for this tenant." });
      return;
    }

    let apiKey = clients[0];
    if (llmKeyId !== undefined) {
      const selectedKey = clients.find((key: any) => key.id === llmKeyId);
      if (selectedKey) {
        apiKey = selectedKey;
      }
    }

    const url = apiKey.url || getLLMProviderUrl(apiKey.name as LLMProvider);

    // Set SSE headers — disable ALL buffering for real-time streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Content-Encoding", "none");
    res.flushHeaders();

    // Helper: write SSE event and flush immediately
    const sendSSE = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Flush if available (when compression middleware is active)
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    };

    // Send an immediate status event so the client knows the connection is open
    sendSSE({ type: "status", content: "thinking" });

    const generator = streamAgent({
      apiKey: apiKey.key || "",
      baseURL: url,
      model: apiKey.model,
      userPrompt: prompt,
      tenant: tenantId,
      availableTools,
      toolsDefinition,
      provider: apiKey.name as "Anthropic" | "OpenAI" | "OpenRouter",
    });

    let fullText = "";
    let chunkCount = 0;
    let firstChunkTime = 0;
    const streamStartTime = Date.now();

    for await (const chunk of generator) {
      if (chunk.type === "text") {
        fullText += chunk.content;
        chunkCount++;
        if (chunkCount === 1) {
          firstChunkTime = Date.now();
          logger.debug(`[TIMER] First text chunk written to client at +${firstChunkTime - streamStartTime}ms`);
        }
      }
      sendSSE(chunk);
    }

    const lastChunkTime = Date.now();
    logger.debug(`[TIMER] Streamed ${chunkCount} text chunks to client. First-to-last spread: ${firstChunkTime ? lastChunkTime - firstChunkTime : 0}ms`);

    // Send the final done event with the complete text for chart parsing
    sendSSE({ type: "done", content: fullText });
    res.end();

    logStructured(
      "successful",
      "Streaming advisor response completed",
      functionName,
      fileName,
    );
  } catch (error) {
    logStructured(
      "error",
      "Failed to stream advisor response",
      functionName,
      fileName,
    );
    logger.error("❌ Error in streaming advisor response:", error);

    // If headers haven't been sent yet, send JSON error
    if (!res.headersSent) {
      res.status(500).json(STATUS_CODE[500]((error as Error).message));
      return;
    }

    // If SSE already started, send error event and close
    res.write(`data: ${JSON.stringify({ type: "error", content: (error as Error).message })}\n\n`);
    res.end();
  }
}
