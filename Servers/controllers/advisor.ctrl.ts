import { Request, Response } from "express";
import { runAgent } from "../advisor/agent";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getLLMKeysQuery, getLLMProviderUrl } from "../utils/llmKey.utils";
import { LLMProvider } from "../domain.layer/interfaces/i.llmKey";
import { availableRiskTools } from "../advisor/functions/riskFunctions";
import { availableModelInventoryTools } from "../advisor/functions/modelInventoryFunctions";
import { toolsDefinition as riskToolsDefinition } from "../advisor/tools/riskTools";
import { toolsDefinition as modelInventoryToolsDefinition } from "../advisor/tools/modelInventoryTools";

const fileName = "advisor.ctrl.ts";

const availableTools = {
  ...availableRiskTools,
  ...availableModelInventoryTools,
};

const toolsDefinition = [
  ...riskToolsDefinition,
  ...modelInventoryToolsDefinition,
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
    const llmKeyId = req.query.llmKeyId ? Number(req.query.llmKeyId) : undefined;

    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant context is required" });
    }

    logger.debug(
      `Running advisor for tenant: ${tenantId}, user: ${userId}, llmKeyId: ${llmKeyId}, prompt: ${prompt.substring(0, 100)}...`,
    );

    const clients = await getLLMKeysQuery(tenantId);

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
    });

    logStructured(
      "successful",
      "Getting VerifyWise advisor response successful",
      functionName,
      fileName,
    );

    // Parse the structured response for risk advisor
    let parsedResponse: any = response;
    try {
      // Try to parse JSON response from LLM
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: if LLM didn't return JSON, wrap the response
        parsedResponse = {
          markdown: response,
          chartData: null,
        };
      }
    } catch (error) {
      logger.warn(
        `Failed to parse structured response, using raw response: ${error}`,
      );
      parsedResponse = {
        markdown: response,
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
