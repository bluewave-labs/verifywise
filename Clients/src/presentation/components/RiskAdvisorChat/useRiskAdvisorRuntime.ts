import { useMemo } from 'react';
import { useLocalRuntime } from '@assistant-ui/react';
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from '@assistant-ui/react';
import { runAdvisorAPI } from '../../../application/repository/advisor.repository';

export const useRiskAdvisorRuntime = (risks: any[] = []) => {
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
        }, 'risk');

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
  }), []); // Empty deps - adapter doesn't depend on any props

  // Memoize initial messages to prevent recreation
  const initialMessages = useMemo(() => [
    {
      role: 'assistant' as const,
      id: 'welcome',
      createdAt: new Date(),
      content: [
        {
          type: 'text' as const,
          text: `Hello! I'm your VerifyWise AI Risk Management Advisor. I can help you analyze risks, understand risk distributions, and provide insights about your risk landscape${risks && risks.length > 0 ? ` across your ${risks.length} tracked risks` : ''}. What would you like to know?`,
        },
      ],
    },
  ], [risks]); // Only recreate if risk count changes

  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages,
  });

  return runtime;
};
