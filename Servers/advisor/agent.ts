import { OpenAI } from "openai";
import { getAdvisorPrompt } from "./prompts";
import logger from "../utils/logger/fileLogger";

interface AdvisorParams {
  apiKey: string;
  baseURL: string;
  model: string;
  advisorType: string;
  userPrompt: string;
  tenant: string;
  availableTools: any;
  toolsDefinition: any[];
}

export const runAgent = async ({
  apiKey,
  baseURL,
  model,
  advisorType,
  userPrompt,
  tenant,
  availableTools,
  toolsDefinition,
}: AdvisorParams) => {
  const agentStartTime = Date.now();
  logger.info(
    `[TIMER] runAgent internal started for advisorType: ${advisorType} and model ${model}`,
  );

  // 1. SETUP: Configure client
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  // Initialize conversation history with system context
  const systemMessage = {
    role: "system",
    content: getAdvisorPrompt(advisorType),
  };

  const messages: any[] = [
    systemMessage,
    { role: "user", content: userPrompt },
  ];

  let iterationCount = 0;
  // Start the Agentic Loop
  // We loop until the model decides to stop calling tools and gives a text answer
  while (true) {
    iterationCount++;
    const iterationStartTime = Date.now();

    // Step A: Send history + tool definitions to LLM
    const llmCallStartTime = Date.now();
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      tools: toolsDefinition,
      tool_choice: "auto", // Let LLM decide whether to use a tool or not
    });
    const llmCallEndTime = Date.now();
    logger.info(
      `[TIMER] LLM API call in iteration ${iterationCount} took ${llmCallEndTime - llmCallStartTime}ms`,
    );

    // Step B: Analyze the LLM's "Thought"
    const responseMessage: any = response.choices[0].message;

    // Add the LLM's response (which might be a tool call) to history
    // This is crucial for maintaining context
    messages.push(responseMessage);

    // Step C: Check if LLM wants to run a tool
    if (responseMessage.tool_calls) {
      // The LLM wants to run one (or more) tools
      logger.info(
        `[TIMER] Iteration ${iterationCount}: Processing ${responseMessage.tool_calls.length} tool call(s)`,
      );

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // 1. Look up the function in our registry
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
          // 2. Execute the actual code with tenant context
          const functionResponse = await functionToCall(functionArgs, tenant);

          // 3. Add the "Tool Output" back to the message history
          // We must include the 'tool_call_id' so the LLM knows which request this answers
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
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            }),
          });
        }
      }
      const iterationEndTime = Date.now();
      logger.info(
        `[TIMER] Iteration ${iterationCount} completed in ${iterationEndTime - iterationStartTime}ms`,
      );
      // The loop continues... the next iteration sends the tool output back to the LLM
    } else {
      // Step D: STOPPING CONDITION
      // If there are no tool_calls, the LLM has generated a final natural language response
      const agentEndTime = Date.now();
      const totalAgentTime = agentEndTime - agentStartTime;
      logger.info(
        `[TIMER] Agentic AI with ${model} completed after ${iterationCount} iterations in ${totalAgentTime}ms (${(totalAgentTime / 1000).toFixed(2)}s)`,
      );

      return responseMessage.content;
    }
  }
};
