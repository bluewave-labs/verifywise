import { Request, Response } from "express";
import { runAgent } from "../advisor/agent";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getLLMKeysQuery } from "../utils/llmKey.utils";

const fileName = "advisor.ctrl.ts";


export async function runAdvisor(req: Request, res: Response) {
    const functionName = "runAdvisor";
     logStructured(
        "processing",
        "Getting VerifyWise advisor response",
        functionName,
        fileName
    );
    logger.debug(" Getting VerifyWise advisor response");

    try {
        const prompt = req.body.prompt;
        const tenantId = req.tenantId!;
        const userId = req.userId ? Number(req.userId) : undefined;
        const advisorType = req.query.type as string;

        // Validate required parameters
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!tenantId) {
            return res.status(400).json({ error: "Tenant context is required" });
        }

        logger.debug(`Running advisor for tenant: ${tenantId}, user: ${userId}, prompt: ${prompt.substring(0, 100)}...`);

        const clients = await getLLMKeysQuery(tenantId);

        if (clients.length === 0) {
            logger.debug(`No LLM keys found for tenant: ${tenantId}`);
            return res.status(400).json({ error: "No LLM keys configured for this tenant." });
        }

        const apiKey = clients[0];
        const baseURL = apiKey.name.toLocaleLowerCase() === 'anthropic' ? 'https://api.anthropic.com/v1' : "";

        const response = await runAgent({
            apiKey: apiKey.key || "",
            baseURL,
            advisorType,
            userPrompt: prompt,
            tenant: tenantId
        });

        logStructured(
            "successful",
            "Getting VerifyWise advisor response successful",
            functionName,
            fileName
        );

        // Parse the structured response for risk advisor
        let parsedResponse: any = response;
        if (advisorType === 'risk') {
            try {
                // Try to parse JSON response from LLM
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedResponse = JSON.parse(jsonMatch[0]);
                } else {
                    // Fallback: if LLM didn't return JSON, wrap the response
                    parsedResponse = {
                        markdown: response,
                        chartData: null
                    };
                }
            } catch (error) {
                logger.warn(`Failed to parse structured response, using raw response: ${error}`);
                parsedResponse = {
                    markdown: response,
                    chartData: null
                };
            }
        }

        return res.status(200).json({ prompt, response: parsedResponse });
    } catch (error) {
        logStructured("error", "failed to get VerifyWise advisor response", functionName, fileName);
        logger.error("❌ Error in getting VerifyWise advisor response:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}