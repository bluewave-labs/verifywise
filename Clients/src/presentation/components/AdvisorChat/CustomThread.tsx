import { useEffect, useRef } from 'react';
import { Stack, Box, useTheme, Chip } from '@mui/material';
import { ThreadPrimitive } from '@assistant-ui/react';
import { CustomMessage } from './CustomMessage';
import { CustomComposer } from './CustomComposer';
import { AdvisorDomain, AdvisorSuggestion, getSuggestions } from './advisorConfig';

interface CustomThreadProps {
  pageContext?: AdvisorDomain;
}

interface SuggestionChipsProps {
  pageContext?: AdvisorDomain;
  suggestions: AdvisorSuggestion[];
}

const SuggestionChips = ({ suggestions }: SuggestionChipsProps) => {
  const theme = useTheme();

  if (!suggestions || suggestions.length === 0) {
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
                fontSize: '11px',
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
