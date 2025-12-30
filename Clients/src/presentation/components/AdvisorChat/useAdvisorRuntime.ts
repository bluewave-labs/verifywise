import { useMemo } from 'react';
import { useLocalRuntime } from '@assistant-ui/react';
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from '@assistant-ui/react';
import { runAdvisorAPI } from '../../../application/repository/advisor.repository';

export const getAdvisorType = (pathname: string): string => {
  switch(pathname) {
    case "/risk-management":
      return "risk";
    case "/model-inventory":
      return "model";
    default:
      return "";
  }
}

const WELCOME_MESSAGES = {
  'risk-management': "Hello! I'm your AI Risk Management Advisor. I can help you analyze risk distributions, track mitigation progress, identify high-priority risks, and understand trends over time. What would you like to know about your risks?",
  'model-inventory': "Hello! I'm your AI Model Inventory Advisor. I can help you understand your model landscape, check approval statuses, review security assessments, and analyze provider distributions. What would you like to know about your models?",
  'default': "Hello! I'm your VerifyWise AI Advisor. I can help you with both AI Risk Management and Model Inventory. What would you like to know?",
};

export const useAdvisorRuntime = (selectedLLMKeyId?: number, pageContext?: 'risk-management' | 'model-inventory') => {
  // Memoize the chat adapter to prevent recreation on every render
  const chatModelAdapter: ChatModelAdapter = useMemo(() => ({
    async run({ messages = [] }: ChatModelRunOptions): Promise<ChatModelRunResult> {
      try {
        // Safety check for messages array
        if (!messages || !Array.isArray(messages) || messages?.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No message to process.',
              },
            ],
            status: { type: 'complete' as const, reason: 'stop' as const },
          };
        }

        // Get the last user message
        const lastMessage = messages[messages.length - 1];

        // Safety check for message content
        if (!lastMessage || !lastMessage.content) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Invalid message format.',
              },
            ],
            status: { type: 'complete' as const, reason: 'stop' as const },
          };
        }

        const userMessage = lastMessage.content
          .filter((part: any) => part && part.type === 'text')
          .map((part: any) => part.text || '')
          .join('\n')
          .trim();

        if (!userMessage) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Please provide a message.',
              },
            ],
            status: { type: 'complete' as const, reason: 'stop' as const },
          };
        }

        // Call the advisor API with the user's message
        const response = await runAdvisorAPI({
          prompt: userMessage,
        }, selectedLLMKeyId);

        // Extract the assistant's response
        const assistantContent = response.data?.response || 'I received your message but could not generate a response.';

        // Return the result in the expected format
        return {
          content: [
            {
              type: 'text' as const,
              text: assistantContent?.markdown ? assistantContent.markdown : assistantContent,
            },
            {
              type: 'data' as const,
              name: 'chartData',
              data: assistantContent?.chartData ? assistantContent.chartData : null
            }
          ],
          status: { type: 'complete' as const, reason: 'stop' as const },
        };
      } catch (error: any) {
        console.error('[RiskAdvisorRuntime] Error calling advisor API:', error);
        const errorMessage = error?.data?.message || error?.message || 'Failed to get response from advisor. Please try again.';

        // Return an error message
        return {
          content: [
            {
              type: 'text' as const,
              text: `I'm sorry, I encountered an error: ${errorMessage}`,
            },
          ],
          status: { type: 'complete' as const, reason: 'stop' as const },
        };
      }
    },
  }), [selectedLLMKeyId]); // Re-create adapter when LLM key changes

  // Memoize initial messages based on page context
  const initialMessages = useMemo(() => [
    {
      role: 'assistant' as const,
      id: 'welcome',
      createdAt: new Date(),
      content: [
        {
          type: 'text' as const,
          text: WELCOME_MESSAGES[pageContext || 'default'],
        },
      ],
    },
  ], [pageContext]);

  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages,
  });

  return runtime;
};
