import { Request, Response } from "express";
import { runAgent } from "../advisor/agent";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getLLMKeysQuery } from "../utils/llmKey.utils";

const fileName = "advisor.ctrl.ts";

const getAdvisorType = (typeParam: string | undefined): string => {
    switch (typeParam) {
        case "risk":
            return `You are an AI Risk Management Advisor for Verifyise. You help users analyze, understand, and manage AI-related risks in their organization.
            You have access to the following tools:
            1. fetch_risks: Retrieve specific risks based on filters
            2. get_risk_analytics: Get analytics and distributions across risk dimensions
            3. get_executive_summary: Get high-level overview of risk landscape
            
            When answering questions:
            - Be concise and actionable
            - Use specific data from the tools
            - Provide an apology message if anything other than risk related query is asked.`;
        default:
            return `You are a general-purpose AI Advisor for Verifyise. You assist users with a wide range of topics related to Verifyise's services and products.`;
    }
}

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

        const systemPrompt = getAdvisorType(advisorType);

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
            systemPrompt, 
            userPrompt: prompt, 
            tenant: tenantId
        });

        logStructured(
            "successful",
            "Getting VerifyWise advisor response successful",
            functionName,
            fileName
        );

        return res.status(200).json({ prompt, response });
    } catch (error) {
        logStructured("error", "failed to get VerifyWise advisor response", functionName, fileName);
        logger.error("❌ Error in getting VerifyWise advisor response:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}