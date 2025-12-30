import { Request, Response } from "express";
import { runAgent } from "../advisor/agent";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getLLMKeysWithKeyQuery, getLLMProviderUrl } from "../utils/llmKey.utils";
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
