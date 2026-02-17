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
 * Execute tool calls in parallel for Anthropic format
 */
const executeAnthropicTools = async (
  toolUseBlocks: Anthropic.ToolUseBlock[],
  availableTools: any,
  tenant: string
): Promise<Anthropic.ToolResultBlockParam[]> => {
  return Promise.all(
    toolUseBlocks.map(async (toolUse) => {
      const functionName = toolUse.name;
      const functionArgs = toolUse.input as Record<string, unknown>;
      const functionToCall = availableTools[functionName];

      if (!functionToCall) {
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: `Tool ${functionName} not found` }),
          is_error: true,
        };
      }

      try {
        const functionResponse = await functionToCall(functionArgs, tenant);
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(functionResponse),
        };
      } catch (error) {
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error occurred",
          }),
          is_error: true,
        };
      }
    })
  );
};

/**
 * Execute tool calls in parallel for OpenAI format
 */
const executeOpenAITools = async (
  toolCalls: any[],
  availableTools: any,
  tenant: string
): Promise<any[]> => {
  return Promise.all(
    toolCalls.map(async (toolCall: any) => {
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
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify({ error: `Tool ${functionName} not found` }),
        };
      }

      try {
        const functionResponse = await functionToCall(functionArgs, tenant);
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(functionResponse),
        };
      } catch (error) {
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error occurred",
          }),
        };
      }
    })
  );
};

/**
 * Run agent using Anthropic's native API (non-streaming)
 */
const runAnthropicAgent = async (params: Omit<AdvisorParams, "baseURL" | "provider">) => {
  const { model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.info(`[TIMER] runAgent (Anthropic) started for advisor with model ${model}`);

  const client = new Anthropic({ apiKey: params.apiKey });
  const systemPrompt = getAdvisorPrompt();
  const anthropicTools = convertToolsToAnthropicFormat(toolsDefinition);

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

      messages.push({ role: "assistant", content: response.content });

      const toolResults = await executeAnthropicTools(toolUseBlocks, availableTools, tenant);
      messages.push({ role: "user", content: toolResults });

      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
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
 * Run agent using OpenAI-compatible API (non-streaming)
 */
const runOpenAICompatibleAgent = async (params: Omit<AdvisorParams, "provider">) => {
  const { baseURL, model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.info(`[TIMER] runAgent (OpenAI-compatible) started for advisor with model ${model}`);

  const client = new OpenAI({
    apiKey: params.apiKey,
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

      const toolResults = await executeOpenAITools(responseMessage.tool_calls, availableTools, tenant);
      messages.push(...toolResults);

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

// ─── Streaming variants ────────────────────────────────────────────────────

/**
 * Streaming Anthropic agent. Tool-calling iterations are non-streamed;
 * the final text-generation iteration streams via SSE.
 */
const streamAnthropicAgent = async function* (
  params: Omit<AdvisorParams, "baseURL" | "provider">
): AsyncGenerator<string, void> {
  const { model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.info(`[TIMER] streamAgent (Anthropic) started for advisor with model ${model}`);

  const client = new Anthropic({ apiKey: params.apiKey });
  const systemPrompt = getAdvisorPrompt();
  const anthropicTools = convertToolsToAnthropicFormat(toolsDefinition);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let iterationCount = 0;

  // Tool-calling loop: non-streamed iterations to resolve all tool calls
  while (true) {
    iterationCount++;
    const iterationStartTime = Date.now();

    // Non-streamed call to check for tool use
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
      `[TIMER] Anthropic API call (tool check) iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length > 0) {
      logger.info(
        `[TIMER] Iteration ${iterationCount}: Processing ${toolUseBlocks.length} tool call(s)`
      );

      messages.push({ role: "assistant", content: response.content });
      const toolResults = await executeAnthropicTools(toolUseBlocks, availableTools, tenant);
      messages.push({ role: "user", content: toolResults });

      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
      // Continue loop — more tool calls may follow
    } else {
      // No tool calls — this was the final response.
      // But we got it non-streamed. Let's re-request with streaming
      // by removing the last non-streamed response and streaming instead.
      // Actually, we already have the response content from this non-streamed call.
      // To avoid an extra API call, we can just yield the text we already have.
      // However, for true streaming UX, we should make the final call streamed.

      // Strategy: if this is iteration 1 (no tools were ever called), we wasted
      // a non-streamed call. For iteration > 1, we already spent time on tool calls,
      // so streaming the final call is worth the extra call.
      // But for simplicity and to always stream, let's just yield the already-received text
      // in chunks to simulate streaming for now, and use real streaming when tools were involved.

      if (iterationCount === 1) {
        // First iteration, no tools — re-do with streaming for real streaming UX
        break;
      }

      // Tools were called, we have the final text — yield it
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      const fullText = textBlocks.map((block) => block.text).join("\n") || "";

      const agentEndTime = Date.now();
      logger.info(
        `[TIMER] streamAgent (Anthropic) completed after ${iterationCount} iterations in ${agentEndTime - agentStartTime}ms`
      );

      yield fullText;
      return;
    }
  }

  // Stream the final response (either first call with no tools, or after tool loop)
  logger.info(`[TIMER] Starting streaming response for Anthropic`);
  const streamStartTime = Date.now();

  const stream = client.messages.stream({
    model: model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages,
    tools: anthropicTools,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }

  const streamEndTime = Date.now();
  logger.info(
    `[TIMER] Anthropic streaming completed in ${streamEndTime - streamStartTime}ms, total: ${streamEndTime - agentStartTime}ms`
  );
};

/**
 * Streaming OpenAI-compatible agent. Tool-calling iterations are non-streamed;
 * the final text-generation iteration streams.
 */
const streamOpenAICompatibleAgent = async function* (
  params: Omit<AdvisorParams, "provider">
): AsyncGenerator<string, void> {
  const { baseURL, model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.info(`[TIMER] streamAgent (OpenAI-compatible) started for advisor with model ${model}`);

  const client = new OpenAI({
    apiKey: params.apiKey,
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

  // Tool-calling loop: non-streamed
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
      `[TIMER] OpenAI API call (tool check) iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    const responseMessage: any = response.choices[0].message;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      logger.info(
        `[TIMER] Iteration ${iterationCount}: Processing ${responseMessage.tool_calls.length} tool call(s)`
      );

      const toolResults = await executeOpenAITools(responseMessage.tool_calls, availableTools, tenant);
      messages.push(...toolResults);

      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
      if (iterationCount === 1) {
        // First iteration, no tools — remove the non-streamed response and re-do with streaming
        messages.pop();
        break;
      }

      // Tools were called, we have the final text — yield it
      const agentEndTime = Date.now();
      logger.info(
        `[TIMER] streamAgent (OpenAI-compatible) completed after ${iterationCount} iterations in ${agentEndTime - agentStartTime}ms`
      );

      yield responseMessage.content || "";
      return;
    }
  }

  // Stream the final response
  logger.info(`[TIMER] Starting streaming response for OpenAI-compatible`);
  const streamStartTime = Date.now();

  const stream = await client.chat.completions.create({
    model: model,
    messages: messages,
    tools: toolsDefinition,
    tool_choice: "auto",
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      yield delta.content;
    }
  }

  const streamEndTime = Date.now();
  logger.info(
    `[TIMER] OpenAI streaming completed in ${streamEndTime - streamStartTime}ms, total: ${streamEndTime - agentStartTime}ms`
  );
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Main entry point (non-streaming) - routes to appropriate provider
 */
export const runAgent = async (params: AdvisorParams) => {
  const { provider } = params;

  if (provider === "Anthropic") {
    return runAnthropicAgent(params);
  } else {
    return runOpenAICompatibleAgent(params);
  }
};

/**
 * Streaming entry point - returns an AsyncGenerator that yields text chunks
 */
export const streamAgent = (params: AdvisorParams): AsyncGenerator<string, void> => {
  const { provider } = params;

  if (provider === "Anthropic") {
    return streamAnthropicAgent(params);
  } else {
    return streamOpenAICompatibleAgent(params);
  }
};
