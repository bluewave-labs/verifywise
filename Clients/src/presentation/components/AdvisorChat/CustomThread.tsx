import { useEffect, useRef } from 'react';
import { Stack, Box, useTheme, Typography, Chip } from '@mui/material';
import { ThreadPrimitive, useThread } from '@assistant-ui/react';
import { CustomMessage } from './CustomMessage';
import { CustomComposer } from './CustomComposer';
import { AdvisorDomain, AdvisorSuggestion, getSuggestions, ADVISOR_DOMAINS } from './advisorConfig';

interface CustomThreadProps {
  pageContext?: AdvisorDomain;
}

interface SuggestionChipsProps {
  pageContext?: AdvisorDomain;
  suggestions: AdvisorSuggestion[];
}

const SuggestionChips = ({ pageContext, suggestions }: SuggestionChipsProps) => {
  const theme = useTheme();
  const thread = useThread();

  // Only show suggestions if there's just the welcome message (1 message, no user messages)
  const messages = thread.messages;
  const hasUserMessages = messages.some(m => m.role === 'user');

  if (hasUserMessages) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '16px',
        marginTop: '8px',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: '13px',
          color: theme.palette.text.secondary,
          marginBottom: '12px',
        }}
      >
        {pageContext ? `Try asking about your ${ADVISOR_DOMAINS[pageContext]?.path.replace('/', '').replace('-', ' ')}` : 'Try asking a question'}
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
  );
};

export const CustomThread = ({ pageContext }: CustomThreadProps) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = getSuggestions(pageContext);

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

            {/* Show suggestion chips after welcome message */}
            <SuggestionChips pageContext={pageContext} suggestions={suggestions} />

            <div ref={messagesEndRef} />
          </Stack>
        </ThreadPrimitive.Viewport>
      </Box>

      {/* Input Area */}
      <CustomComposer />
    </ThreadPrimitive.Root>
  );
};
