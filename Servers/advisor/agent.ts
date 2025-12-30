import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getAdvisorPrompt } from "./prompts";
import logger from "../utils/logger/fileLogger";

interface AdvisorParams {
  apiKey: string;
  baseURL: string;
  model: string;
  userPrompt: string;
  tenant: string;
  availableTools: any;
  toolsDefinition: any[];
  provider: "Anthropic" | "OpenAI" | "OpenRouter";
}

/**
 * Convert OpenAI-style tool definitions to Anthropic format
 */
const convertToolsToAnthropicFormat = (openAITools: any[]): Anthropic.Tool[] => {
  return openAITools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }));
};

/**
 * Run agent using Anthropic's native API
 */
const runAnthropicAgent = async ({
  apiKey,
  model,
  userPrompt,
  tenant,
  availableTools,
  toolsDefinition,
}: Omit<AdvisorParams, "baseURL" | "provider">) => {
  const agentStartTime = Date.now();
  logger.info(`[TIMER] runAgent (Anthropic) started for advisor with model ${model}`);

  const client = new Anthropic({ apiKey });
  const systemPrompt = getAdvisorPrompt();
  const anthropicTools = convertToolsToAnthropicFormat(toolsDefinition);

  // Anthropic messages format
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let iterationCount = 0;

  while (true) {
    iterationCount++;
    const iterationStartTime = Date.now();

    const llmCallStartTime = Date.now();
    const response = await client.messages.create({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages,
      tools: anthropicTools,
    });
    const llmCallEndTime = Date.now();
    logger.info(
      `[TIMER] Anthropic API call in iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    // Check if the model wants to use tools
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    if (toolUseBlocks.length > 0) {
      logger.info(
        `[TIMER] Iteration ${iterationCount}: Processing ${toolUseBlocks.length} tool call(s)`
      );

      // Add assistant message with tool use to history
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Process each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const functionName = toolUse.name;
        const functionArgs = toolUse.input as Record<string, unknown>;

        const functionToCall = availableTools[functionName];

        if (!functionToCall) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: `Tool ${functionName} not found` }),
            is_error: true,
          });
          continue;
        }

        try {
          const functionResponse = await functionToCall(functionArgs, tenant);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(functionResponse),
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error occurred",
            }),
            is_error: true,
          });
        }
      }

      // Add tool results to messages
      messages.push({
        role: "user",
        content: toolResults,
      });

      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
      // No tool calls - return the text response
      const agentEndTime = Date.now();
      const totalAgentTime = agentEndTime - agentStartTime;
      logger.info(
        `[TIMER] Agentic AI (Anthropic) with ${model} completed after ${iterationCount} iterations in ${totalAgentTime}ms (${(totalAgentTime / 1000).toFixed(2)}s)`
      );

      return textBlocks.map((block) => block.text).join("\n") || "";
    }
  }
};

/**
 * Run agent using OpenAI-compatible API (OpenAI, OpenRouter)
 */
const runOpenAICompatibleAgent = async ({
  apiKey,
  baseURL,
  model,
  userPrompt,
  tenant,
  availableTools,
  toolsDefinition,
}: Omit<AdvisorParams, "provider">) => {
  const agentStartTime = Date.now();
  logger.info(`[TIMER] runAgent (OpenAI-compatible) started for advisor with model ${model}`);

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const systemMessage = {
    role: "system",
    content: getAdvisorPrompt(),
  };

  const messages: any[] = [
    systemMessage,
    { role: "user", content: userPrompt },
  ];

  let iterationCount = 0;

  while (true) {
    iterationCount++;
    const iterationStartTime = Date.now();

    const llmCallStartTime = Date.now();
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      tools: toolsDefinition,
      tool_choice: "auto",
    });
    const llmCallEndTime = Date.now();
    logger.info(
      `[TIMER] LLM API call in iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    const responseMessage: any = response.choices[0].message;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      logger.info(
        `[TIMER] Iteration ${iterationCount}: Processing ${responseMessage.tool_calls.length} tool call(s)`
      );

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = toolCall.function.arguments
            ? JSON.parse(toolCall.function.arguments)
            : {};
        } catch (parseError) {
          logger.warn(`Failed to parse tool arguments for ${functionName}: ${toolCall.function.arguments}`);
        }

        const functionToCall = availableTools[functionName];

        if (!functionToCall) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify({
              error: `Tool ${functionName} not found`,
            }),
          });
          continue;
        }

        try {
          const functionResponse = await functionToCall(functionArgs, tenant);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(functionResponse),
          });
        } catch (error) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error occurred",
            }),
          });
        }
      }
      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
      const agentEndTime = Date.now();
      const totalAgentTime = agentEndTime - agentStartTime;
      logger.info(
        `[TIMER] Agentic AI (OpenAI-compatible) with ${model} completed after ${iterationCount} iterations in ${totalAgentTime}ms (${(totalAgentTime / 1000).toFixed(2)}s)`
      );

      return responseMessage.content;
    }
  }
};

/**
 * Main entry point - routes to appropriate provider
 */
export const runAgent = async (params: AdvisorParams) => {
  const { provider } = params;

  if (provider === "Anthropic") {
    return runAnthropicAgent(params);
  } else {
    // OpenAI and OpenRouter use OpenAI-compatible API
    return runOpenAICompatibleAgent(params);
  }
};
