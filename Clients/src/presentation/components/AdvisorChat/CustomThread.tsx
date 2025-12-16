import { useEffect, useRef } from 'react';
import { Stack, Box, useTheme } from '@mui/material';
import { ThreadPrimitive } from '@assistant-ui/react';
import { CustomMessage } from './CustomMessage';
import { CustomComposer } from './CustomComposer';

export const CustomThread = () => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, []);


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

      {/* Input Area */}
      <CustomComposer />
    </ThreadPrimitive.Root>
  );
};
