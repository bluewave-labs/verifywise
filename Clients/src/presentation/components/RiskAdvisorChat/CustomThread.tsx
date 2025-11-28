import { useEffect, useRef, useCallback } from 'react';
import { Stack, Box, useTheme, Typography } from '@mui/material';
import { ThreadPrimitive, useAssistantState } from '@assistant-ui/react';
import { CustomMessage } from './CustomMessage';
import { CustomComposer } from './CustomComposer';

const SuggestedPrompt = ({ prompt, theme }: { prompt: string; theme: any }) => {
  const handleClick = useCallback(() => {
    const textarea = document.querySelector('[data-composer-input]') as HTMLTextAreaElement;
    const form = textarea?.form;

    if (textarea && form) {
      // Use native setter to bypass React's value tracking
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      nativeInputValueSetter?.call(textarea, prompt);

      // Dispatch input event
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);

      // Manually trigger form submit
      requestAnimationFrame(() => {
        form.requestSubmit();
      });
    }
  }, [prompt]);

  return (
    <Box
      onClick={handleClick}
      sx={{
        padding: '8px 12px',
        backgroundColor: theme.palette.background.main,
        border: `1px solid ${theme.palette.border?.light}`,
        borderRadius: '6px',
        fontSize: '11px',
        color: theme.palette.text.secondary,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: 'fit-content',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          transform: 'translateY(-1px)',
          boxShadow: '0px 2px 6px rgba(19, 113, 91, 0.1)',
        },
      }}
    >
      {prompt}
    </Box>
  );
};

export const CustomThread = () => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Access thread state to check if we can safely use it
  const messageCount = useAssistantState(({ thread }) => thread.messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, []);

  const suggestedPrompts = [
    'Show me all high severity risks',
    'What is the risk distribution?',
    'Which risks are overdue?',
    'Summarize critical risks',
  ];

  return (
    <ThreadPrimitive.Root
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: theme.palette.background.alt,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.background.fill,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.border?.dark,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.text.accent,
            },
          },
        }}
      >
        <ThreadPrimitive.Viewport
          style={{
            padding: '16px',
          }}
        >
          <Stack gap="12px">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: CustomMessage,
                AssistantMessage: CustomMessage,
              }}
            />

            <div ref={messagesEndRef} />
          </Stack>
        </ThreadPrimitive.Viewport>
      </Box>

      {/* Suggested Prompts - Only show if no messages */}
      {messageCount === 1 && (
        <Box
          sx={{
            padding: '12px',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: theme.palette.text.secondary,
              fontSize: '11px',
              marginBottom: '8px',
            }}
          >
            Try asking:
          </Typography>
          <Stack gap="6px" direction="row" justifyContent="center" flexWrap="wrap">
            {suggestedPrompts.map((prompt) => (
              <SuggestedPrompt key={prompt} prompt={prompt} theme={theme} />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <CustomComposer />
    </ThreadPrimitive.Root>
  );
};
