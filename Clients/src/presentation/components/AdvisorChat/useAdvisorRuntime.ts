import { useMemo, useRef, useEffect } from 'react';
import { useLocalRuntime } from '@assistant-ui/react';
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from '@assistant-ui/react';
import { AdvisorMessage, streamAdvisorAPI } from '../../../application/repository/advisor.repository';
import { AdvisorDomain, getWelcomeMessage } from './advisorConfig';
import { useAdvisorConversationSafe } from '../../../application/contexts/AdvisorConversation.context';

type RuntimeMessageContent =
  | { type: 'text'; text: string }
  | { type: 'data'; name: string; data: unknown };

interface RuntimeMessage {
  role: 'user' | 'assistant';
  id: string;
  createdAt: Date;
  content: RuntimeMessageContent[];
}

const createWelcomeMessage = (domain?: AdvisorDomain): RuntimeMessage => ({
  role: 'assistant',
  id: 'welcome',
  createdAt: new Date(),
  content: [{ type: 'text', text: getWelcomeMessage(domain) }],
});

const convertToRuntimeMessages = (messages: AdvisorMessage[], domain?: AdvisorDomain): RuntimeMessage[] => {
  if (!messages || messages.length === 0) {
    return [createWelcomeMessage(domain)];
  }

  return messages.map(msg => {
    const content: RuntimeMessageContent[] = [{ type: 'text' as const, text: msg.content }];

    if (msg.chartData) {
      content.push({ type: 'data' as const, name: 'chartData', data: msg.chartData });
    }

    return {
      role: msg.role,
      id: msg.id,
      createdAt: new Date(msg.createdAt),
      content,
    };
  });
};

interface MessagePart {
  type: string;
  text?: string;
}

const extractUserMessageText = (content: MessagePart[]): string => {
  return content
    .filter((part) => part?.type === 'text')
    .map((part) => part.text || '')
    .join('\n')
    .trim();
};

const createErrorResult = (text: string): ChatModelRunResult => ({
  content: [{ type: 'text' as const, text }],
  status: { type: 'complete' as const, reason: 'stop' as const },
});

/**
 * Parse the ---CHART_DATA--- separator format from the full response text.
 * Returns { markdown, chartData }.
 */
const parseChartData = (fullText: string): { markdown: string; chartData: unknown } => {
  const separator = '---CHART_DATA---';
  const separatorIndex = fullText.indexOf(separator);
  let markdown = fullText;
  let chartData: unknown = null;

  if (separatorIndex !== -1) {
    markdown = fullText.substring(0, separatorIndex).trim();
    const chartSection = fullText.substring(separatorIndex + separator.length).trim();

    if (chartSection && chartSection !== 'null') {
      try {
        chartData = JSON.parse(chartSection);
      } catch {
        // Malformed chart JSON, ignore
      }
    }
  }

  return { markdown, chartData };
};

export const useAdvisorRuntime = (
  selectedLLMKeyId?: number,
  pageContext?: AdvisorDomain
) => {
  const conversationContext = useAdvisorConversationSafe();

  const contextRef = useRef(conversationContext);
  const pageContextRef = useRef(pageContext);
  const llmKeyRef = useRef(selectedLLMKeyId);

  useEffect(() => {
    contextRef.current = conversationContext;
    pageContextRef.current = pageContext;
    llmKeyRef.current = selectedLLMKeyId;
  }, [conversationContext, pageContext, selectedLLMKeyId]);

  const chatModelAdapter: ChatModelAdapter = useMemo(() => ({
    async *run({ messages = [], abortSignal }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult, void> {
      const context = contextRef.current;
      const domain = pageContextRef.current;
      const llmKeyId = llmKeyRef.current;

      try {
        if (!messages?.length) {
          yield createErrorResult('No message to process.');
          return;
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.content) {
          yield createErrorResult('Invalid message format.');
          return;
        }

        const userMessage = extractUserMessageText(lastMessage.content as MessagePart[]);
        if (!userMessage) {
          yield createErrorResult('Please provide a message.');
          return;
        }

        // Save user message to context
        if (context && domain) {
          context.addMessage(domain, {
            id: lastMessage.id || `user-${Date.now()}`,
            role: 'user',
            content: userMessage,
            createdAt: new Date().toISOString(),
          });
        }

        // Stream the response
        let accumulatedText = '';
        let fullText = '';

        for await (const event of streamAdvisorAPI({ prompt: userMessage }, llmKeyId, abortSignal)) {
          if (event.type === 'text') {
            accumulatedText += event.content;

            // Strip the chart separator from displayed text during streaming
            const separator = '---CHART_DATA---';
            const separatorIndex = accumulatedText.indexOf(separator);
            const displayText = separatorIndex !== -1
              ? accumulatedText.substring(0, separatorIndex).trim()
              : accumulatedText;

            yield {
              content: [{ type: 'text' as const, text: displayText }],
            };
          } else if (event.type === 'done') {
            fullText = event.content;
          } else if (event.type === 'error') {
            yield createErrorResult(`I'm sorry, I encountered an error: ${event.content}`);
            return;
          }
        }

        // Use the complete text from the 'done' event (or accumulated if no done event)
        const finalText = fullText || accumulatedText;
        const { markdown, chartData } = parseChartData(finalText);

        // Save assistant response to context
        if (context && domain) {
          context.addMessage(domain, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: markdown,
            createdAt: new Date().toISOString(),
            chartData: chartData || undefined,
          });
        }

        // Yield the final result with chart data
        yield {
          content: [
            { type: 'text' as const, text: markdown },
            { type: 'data' as const, name: 'chartData', data: chartData },
          ],
          status: { type: 'complete' as const, reason: 'stop' as const },
        };
      } catch (error: unknown) {
        // Don't log abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('[AdvisorRuntime] Error calling advisor API:', error);
        const err = error as { data?: { message?: string }; message?: string };
        const errorMessage = err?.data?.message || err?.message || 'Failed to get response from advisor. Please try again.';
        yield createErrorResult(`I'm sorry, I encountered an error: ${errorMessage}`);
      }
    },
  }), []);

  const initialMessages = useMemo(() => {
    if (conversationContext && pageContext) {
      const persistedMessages = conversationContext.getMessages(pageContext);
      if (persistedMessages.length > 0) {
        return convertToRuntimeMessages(persistedMessages, pageContext);
      }
    }

    return [createWelcomeMessage(pageContext)];
  }, [pageContext, conversationContext]);

  const runtime = useLocalRuntime(chatModelAdapter, { initialMessages });

  const hasResetRef = useRef(false);
  useEffect(() => {
    if (runtime && !hasResetRef.current && initialMessages.length > 0) {
      const threadState = runtime.thread?.getState?.();
      const messageCount = threadState?.messages?.length ?? 0;
      if (messageCount === 0 && typeof runtime.reset === 'function') {
        runtime.reset({ initialMessages });
      }
      hasResetRef.current = true;
    }
  }, [runtime, initialMessages]);

  return runtime;
};
