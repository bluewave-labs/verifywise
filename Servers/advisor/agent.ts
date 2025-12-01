import { OpenAI } from "openai";
import { toolsDefinition } from "./tools";
import { availableTools } from "./functions";
import { getAdvisorPrompt } from "./prompts";

interface AdvisorParams {
    apiKey: string;
    baseURL: string;
    advisorType: string;
    userPrompt: string;
    tenant: string;
}

export const runAgent = async ({apiKey, baseURL, advisorType, userPrompt, tenant}: AdvisorParams) => {
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
        { role: "user", content: userPrompt }
    ];

    // Start the Agentic Loop
    // We loop until the model decides to stop calling tools and gives a text answer
    while (true) {
        // Step A: Send history + tool definitions to LLM
        const response = await client.chat.completions.create({
            model: "claude-sonnet-4-5",
            messages: messages,
            tools: toolsDefinition,
            tool_choice: "auto", // Let LLM decide whether to use a tool or not
        });

        // Step B: Analyze the LLM's "Thought"
        const responseMessage: any = response.choices[0].message;

        // Add the LLM's response (which might be a tool call) to history
        // This is crucial for maintaining context
        messages.push(responseMessage);

        // Step C: Check if LLM wants to run a tool
        if (responseMessage.tool_calls) {
            // The LLM wants to run one (or more) tools

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
                        content: JSON.stringify({ error: `Tool ${functionName} not found` }),
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
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        }),
                    });
                }
            }
            // The loop continues... the next iteration sends the tool output back to the LLM
        } else {
            // Step D: STOPPING CONDITION
            // If there are no tool_calls, the LLM has generated a final natural language response
            return responseMessage.content;
        }
    }
}
