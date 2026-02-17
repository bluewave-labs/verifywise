import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getAdvisorPrompt, getAdvisorResponsePrompt } from "./prompts";
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

export interface StreamChunk {
  type: "text" | "status";
  content: string;
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
  logger.debug(`[TIMER] runAgent (Anthropic) started for advisor with model ${model}`);

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
    logger.debug(
      `[TIMER] Anthropic API call in iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    if (toolUseBlocks.length > 0) {
      logger.debug(
        `[TIMER] Iteration ${iterationCount}: Processing ${toolUseBlocks.length} tool call(s)`
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults = await executeAnthropicTools(toolUseBlocks, availableTools, tenant);
      messages.push({ role: "user", content: toolResults });

      const iterationEndTime = Date.now();
      logger.debug(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
      const agentEndTime = Date.now();
      const totalAgentTime = agentEndTime - agentStartTime;
      logger.debug(
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
  logger.debug(`[TIMER] runAgent (OpenAI-compatible) started for advisor with model ${model}`);

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
    logger.debug(
      `[TIMER] LLM API call in iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`
    );

    const responseMessage: any = response.choices[0].message;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      logger.debug(
        `[TIMER] Iteration ${iterationCount}: Processing ${responseMessage.tool_calls.length} tool call(s)`
      );

      const toolResults = await executeOpenAITools(responseMessage.tool_calls, availableTools, tenant);
      messages.push(...toolResults);

      const iterationEndTime = Date.now();
      logger.debug(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`
      );
    } else {
      const agentEndTime = Date.now();
      const totalAgentTime = agentEndTime - agentStartTime;
      logger.debug(
        `[TIMER] Agentic AI (OpenAI-compatible) with ${model} completed after ${iterationCount} iterations in ${totalAgentTime}ms (${(totalAgentTime / 1000).toFixed(2)}s)`
      );

      return responseMessage.content;
    }
  }
};

// ─── Streaming variants ────────────────────────────────────────────────────

/**
 * Streaming Anthropic agent. Every iteration is streamed so text appears
 * immediately. Tool calls are collected from the stream and executed in parallel.
 */
const streamAnthropicAgent = async function* (
  params: Omit<AdvisorParams, "baseURL" | "provider">
): AsyncGenerator<StreamChunk, void> {
  const { model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.debug(`[TIMER] streamAgent (Anthropic) started for advisor with model ${model}`);

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
    logger.debug(`[TIMER] Anthropic streaming iteration ${iterationCount} started`);

    // Always stream — collect tool_use blocks while yielding text deltas
    let currentToolUse: { id: string; name: string; inputJson: string } | null = null;

    // After tools have been called, drop tool definitions and use shorter prompt
    const hasToolResults = messages.some(
      (m) => m.role === "user" && Array.isArray(m.content) && (m.content as any[]).some((c: any) => c.type === "tool_result")
    );
    const streamParams: any = {
      model: model,
      max_tokens: 4096,
      system: hasToolResults ? getAdvisorResponsePrompt() : systemPrompt,
      messages: messages,
    };
    if (!hasToolResults) {
      streamParams.tools = anthropicTools;
    }

    logger.debug(`[TIMER] Iteration ${iterationCount} tools included: ${!hasToolResults}`);

    const stream = client.messages.stream(streamParams);

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: "",
          };
        } else if (event.content_block.type === "text") {
          // text block starting — nothing to do yet
        }
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield { type: "text" as const, content: event.delta.text };
        } else if (event.delta.type === "input_json_delta" && currentToolUse) {
          currentToolUse.inputJson += event.delta.partial_json;
        }
      } else if (event.type === "content_block_stop") {
        currentToolUse = null;
      }
    }

    const llmCallEndTime = Date.now();
    logger.debug(
      `[TIMER] Anthropic streaming iteration ${iterationCount} took ${llmCallEndTime - iterationStartTime}ms`
    );

    // Also collect any text blocks from the final message for the conversation history
    const finalMessage = await stream.finalMessage();
    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length > 0) {
      logger.debug(
        `[TIMER] Iteration ${iterationCount}: Processing ${toolUseBlocks.length} tool call(s)`
      );

      yield { type: "status" as const, content: "analyzing" };

      messages.push({ role: "assistant", content: finalMessage.content });
      const toolResults = await executeAnthropicTools(toolUseBlocks, availableTools, tenant);
      messages.push({ role: "user", content: toolResults });

      const iterationEndTime = Date.now();
      logger.debug(
        `[TIMER] Iteration ${iterationCount} tool execution completed in ${iterationEndTime - llmCallEndTime}ms, total iteration: ${iterationEndTime - iterationStartTime}ms`
      );
      // Continue loop for next iteration
    } else {
      // No tool calls — final response was streamed above
      const agentEndTime = Date.now();
      logger.debug(
        `[TIMER] streamAgent (Anthropic) completed after ${iterationCount} iterations in ${agentEndTime - agentStartTime}ms (${((agentEndTime - agentStartTime) / 1000).toFixed(2)}s)`
      );
      return;
    }
  }
};

/**
 * Parse SSE lines from a raw text buffer. Returns parsed data objects and leftover buffer.
 */
const parseSSEBuffer = (buffer: string): { events: any[]; remaining: string } => {
  const events: any[] = [];
  const lines = buffer.split("\n");
  const remaining = lines.pop() || ""; // Keep incomplete line

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "data: [DONE]") {
      events.push({ done: true });
    } else if (trimmed.startsWith("data: ")) {
      try {
        events.push(JSON.parse(trimmed.slice(6)));
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { events, remaining };
};

/**
 * Streaming OpenAI-compatible agent using raw fetch + SSE parsing.
 * Bypasses the OpenAI SDK entirely to eliminate any internal buffering.
 * Tool calls are collected from stream deltas and executed in parallel.
 */
const streamOpenAICompatibleAgent = async function* (
  params: Omit<AdvisorParams, "provider">
): AsyncGenerator<StreamChunk, void> {
  const { baseURL, model, userPrompt, tenant, availableTools, toolsDefinition } = params;
  const agentStartTime = Date.now();
  logger.debug(`[TIMER] streamAgent (raw-fetch) started for advisor with model ${model}`);

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
    logger.debug(`[TIMER] Raw-fetch streaming iteration ${iterationCount} started`);

    // Use raw fetch instead of OpenAI SDK to eliminate any SDK-level buffering
    const endpoint = baseURL.replace(/\/+$/, "") + "/chat/completions";

    // After tools have been called and results are in the conversation,
    // drop tool definitions and use a shorter system prompt to reduce context size.
    const hasToolResults = messages.some((m: any) => m.role === "tool");
    const effectiveMessages = hasToolResults
      ? [{ role: "system", content: getAdvisorResponsePrompt() }, ...messages.slice(1)]
      : messages;
    const requestBody: any = {
      model: model,
      messages: effectiveMessages,
      stream: true,
    };
    if (!hasToolResults) {
      requestBody.tools = toolsDefinition;
      requestBody.tool_choice = "auto";
    }

    const payloadSize = JSON.stringify(requestBody).length;
    logger.debug(`[TIMER] Iteration ${iterationCount} payload: ${(payloadSize / 1024).toFixed(1)}KB, tools included: ${!hasToolResults}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.apiKey}`,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream from LLM API response");
    }

    const decoder = new TextDecoder();
    let sseBuffer = "";
    let contentText = "";
    const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {};
    let textChunkCount = 0;
    let firstTextChunkAt = 0;
    let lastTextChunkAt = 0;
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const { events, remaining } = parseSSEBuffer(sseBuffer);
      sseBuffer = remaining;

      for (const event of events) {
        if (event.done) {
          streamDone = true;
          break;
        }

        const delta = event.choices?.[0]?.delta;
        if (!delta) continue;

        // Yield text content as it arrives
        if (delta.content) {
          contentText += delta.content;
          textChunkCount++;
          const now = Date.now();
          if (textChunkCount === 1) {
            firstTextChunkAt = now;
            logger.debug(`[TIMER] First text chunk from raw-fetch at +${now - iterationStartTime}ms`);
          }
          lastTextChunkAt = now;
          yield { type: "text" as const, content: delta.content };
        }

        // Collect tool call deltas
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCallsMap[idx]) {
              toolCallsMap[idx] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
            }
            if (tc.id) toolCallsMap[idx].id = tc.id;
            if (tc.function?.name) toolCallsMap[idx].name = tc.function.name;
            if (tc.function?.arguments) toolCallsMap[idx].arguments += tc.function.arguments;
          }
        }
      }
    }

    reader.releaseLock();

    if (textChunkCount > 0) {
      logger.debug(`[TIMER] Raw-fetch yielded ${textChunkCount} text chunks over ${lastTextChunkAt - firstTextChunkAt}ms (first at +${firstTextChunkAt - iterationStartTime}ms)`);
    }

    const llmCallEndTime = Date.now();
    logger.debug(
      `[TIMER] Raw-fetch streaming iteration ${iterationCount} took ${llmCallEndTime - iterationStartTime}ms`
    );

    const collectedToolCalls = Object.values(toolCallsMap);

    if (collectedToolCalls.length > 0) {
      logger.debug(
        `[TIMER] Iteration ${iterationCount}: Processing ${collectedToolCalls.length} tool call(s)`
      );

      yield { type: "status" as const, content: "analyzing" };

      // Build the assistant message with tool calls for conversation history
      const assistantMessage: any = {
        role: "assistant",
        content: contentText || null,
        tool_calls: collectedToolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };
      messages.push(assistantMessage);

      // Execute tools in parallel
      const formattedToolCalls = collectedToolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      }));
      const toolResults = await executeOpenAITools(formattedToolCalls, availableTools, tenant);
      messages.push(...toolResults);

      const iterationEndTime = Date.now();
      logger.debug(
        `[TIMER] Iteration ${iterationCount} tool execution completed in ${iterationEndTime - llmCallEndTime}ms, total iteration: ${iterationEndTime - iterationStartTime}ms`
      );
      // Continue loop for next iteration
    } else {
      // No tool calls — final response was streamed above
      const agentEndTime = Date.now();
      logger.debug(
        `[TIMER] streamAgent (raw-fetch) completed after ${iterationCount} iterations in ${agentEndTime - agentStartTime}ms (${((agentEndTime - agentStartTime) / 1000).toFixed(2)}s)`
      );
      return;
    }
  }
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
 * Streaming entry point - returns an AsyncGenerator that yields StreamChunk objects
 */
export const streamAgent = (params: AdvisorParams): AsyncGenerator<StreamChunk, void> => {
  const { provider } = params;

  if (provider === "Anthropic") {
    return streamAnthropicAgent(params);
  } else {
    return streamOpenAICompatibleAgent(params);
  }
};
