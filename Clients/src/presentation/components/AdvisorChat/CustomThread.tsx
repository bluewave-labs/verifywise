import { useEffect, useRef } from 'react';
import { Stack, Box, useTheme, Typography, Chip } from '@mui/material';
import { ThreadPrimitive } from '@assistant-ui/react';
import { CustomMessage } from './CustomMessage';
import { CustomComposer } from './CustomComposer';

interface CustomThreadProps {
  pageContext?: 'risk-management' | 'model-inventory';
}

const RISK_SUGGESTIONS = [
  { prompt: 'What is the current risk status?', label: 'Current status' },
  { prompt: 'Show me the risk distribution by severity', label: 'Risk distribution' },
  { prompt: 'What are the critical risks that need attention?', label: 'Critical risks' },
  { prompt: 'How has the risk landscape changed over time?', label: 'Risk trends' },
];

const MODEL_INVENTORY_SUGGESTIONS = [
  { prompt: 'What is the current model inventory status?', label: 'Current status' },
  { prompt: 'Show me models by deployment stage', label: 'Deployment stages' },
  { prompt: 'Which models have the highest risk ratings?', label: 'High-risk models' },
  { prompt: 'Give me an executive summary of our AI models', label: 'Executive summary' },
];

export const CustomThread = ({ pageContext }: CustomThreadProps) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = pageContext === 'model-inventory'
    ? MODEL_INVENTORY_SUGGESTIONS
    : RISK_SUGGESTIONS;

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
            {/* Show suggestions when thread is empty */}
            <ThreadPrimitive.If empty>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  textAlign: 'center',
                  padding: '24px',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '13px',
                    color: theme.palette.text.secondary,
                    marginBottom: '16px',
                  }}
                >
                  {pageContext === 'model-inventory'
                    ? 'Ask me about your AI model inventory'
                    : 'Ask me about your AI risks'}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                    maxWidth: '400px',
                  }}
                >
                  {suggestions.map((suggestion) => (
                    <ThreadPrimitive.Suggestion
                      key={suggestion.label}
                      prompt={suggestion.prompt}
                      method="replace"
                      autoSend
                      asChild
                    >
                      <Chip
                        label={suggestion.label}
                        variant="outlined"
                        clickable
                        sx={{
                          fontSize: '12px',
                          height: '28px',
                          borderColor: theme.palette.border?.light,
                          color: theme.palette.text.primary,
                          '&:hover': {
                            backgroundColor: theme.palette.background.fill,
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      />
                    </ThreadPrimitive.Suggestion>
                  ))}
                </Box>
              </Box>
            </ThreadPrimitive.If>

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
