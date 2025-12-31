import { useMemo, useRef, useEffect } from 'react';
import { useLocalRuntime } from '@assistant-ui/react';
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from '@assistant-ui/react';
import { runAdvisorAPI, AdvisorMessage } from '../../../application/repository/advisor.repository';
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

    // Include chart data if present
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

export const useAdvisorRuntime = (
  selectedLLMKeyId?: number,
  pageContext?: AdvisorDomain
) => {
  const conversationContext = useAdvisorConversationSafe();

  // Use refs to avoid stale closures in the adapter
  const contextRef = useRef(conversationContext);
  const pageContextRef = useRef(pageContext);
  const llmKeyRef = useRef(selectedLLMKeyId);

  useEffect(() => {
    contextRef.current = conversationContext;
    pageContextRef.current = pageContext;
    llmKeyRef.current = selectedLLMKeyId;
  }, [conversationContext, pageContext, selectedLLMKeyId]);

  const chatModelAdapter: ChatModelAdapter = useMemo(() => ({
    async run({ messages = [] }: ChatModelRunOptions): Promise<ChatModelRunResult> {
      const context = contextRef.current;
      const domain = pageContextRef.current;
      const llmKeyId = llmKeyRef.current;

      try {
        if (!messages?.length) {
          return createErrorResult('No message to process.');
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.content) {
          return createErrorResult('Invalid message format.');
        }

        const userMessage = extractUserMessageText(lastMessage.content as MessagePart[]);
        if (!userMessage) {
          return createErrorResult('Please provide a message.');
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

        const response = await runAdvisorAPI({ prompt: userMessage }, llmKeyId);
        const assistantContent = response.data?.response || 'I received your message but could not generate a response.';

        // Handle both string and object response formats
        let assistantText: string;
        let chartData: unknown = null;

        if (typeof assistantContent === 'string') {
          assistantText = assistantContent;
        } else {
          assistantText = assistantContent.markdown ?? JSON.stringify(assistantContent);
          chartData = assistantContent.chartData ?? null;
        }

        // Save assistant response to context (including chart data)
        if (context && domain) {
          context.addMessage(domain, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: typeof assistantText === 'string' ? assistantText : JSON.stringify(assistantText),
            createdAt: new Date().toISOString(),
            chartData: chartData || undefined,
          });
        }

        return {
          content: [
            { type: 'text' as const, text: assistantText },
            { type: 'data' as const, name: 'chartData', data: chartData },
          ],
          status: { type: 'complete' as const, reason: 'stop' as const },
        };
      } catch (error: unknown) {
        console.error('[AdvisorRuntime] Error calling advisor API:', error);
        const err = error as { data?: { message?: string }; message?: string };
        const errorMessage = err?.data?.message || err?.message || 'Failed to get response from advisor. Please try again.';
        return createErrorResult(`I'm sorry, I encountered an error: ${errorMessage}`);
      }
    },
  }), []); // Empty deps - uses refs for latest values

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

  // Reset the runtime with welcome message if it was created without messages
  // This handles the timing issue where useLocalRuntime is created before initialMessages is ready
  const hasResetRef = useRef(false);
  useEffect(() => {
    if (runtime && !hasResetRef.current && initialMessages.length > 0) {
      // Access thread state safely through the runtime
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
