import { FC } from 'react';
import { Stack, Box, useTheme, Avatar } from '@mui/material';
import { MessagePrimitive, useMessagePartText, useAssistantState } from '@assistant-ui/react';
import Markdown from 'react-markdown';

import { Bot, User } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';

const MessageText: FC = () => {
  const data = useMessagePartText();

  // Safety check
  if (data.status.type === 'running' || data.text === null || data.text === undefined || data.text === "") {
    return null;
  }

  return (
    <Markdown components={{
      p: 'div',
      h1(props) {
        const {node, ...rest} = props
        return <h1 style={{marginTop: 0}} {...rest} />
      },
      h2(props) {
        const {node, ...rest} = props
        return <h2 style={{marginTop: 0}} {...rest} />
      }
    }}>{data.text}</Markdown>
  );
};

const MessageChart: FC = () => {
  const message = useAssistantState(({ message }) => message);

  // Find the chart data in the message content
  const chartContent = message.content.find(
    (part: any) => part.type === 'data' && part.name === 'chartData'
  ) as { type: 'data'; name: string; data: any } | undefined;

  if (!chartContent || !chartContent.data) {
    return null;
  }

  return <ChartRenderer chartData={chartContent.data} />;
};

export const CustomMessage: FC = () => {
  const theme = useTheme();

  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.If user>
        <Stack
          direction="row"
          gap="12px"
          sx={{
            alignSelf: 'flex-end',
            maxWidth: {
              xs: '100%',
            },
            justifyContent: 'flex-end',
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              padding: '10px 14px',
              borderRadius: '12px',
              borderTopRightRadius: '4px',
              fontSize: '13px',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            <MessagePrimitive.Content components={{ Text: MessageText }} />
          </Box>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              backgroundColor: theme.palette.primary.main,
              fontSize: '12px',
            }}
          >
            <User size={14} />
          </Avatar>
        </Stack>
      </MessagePrimitive.If>

      <MessagePrimitive.If assistant>
        <Stack
          direction="row"
          gap="12px"
          sx={{
            alignSelf: 'flex-start',
            maxWidth: {
              xs: '90%',
              sm: '75%',
            },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              backgroundColor: theme.palette.primary.main,
              fontSize: '12px',
            }}
          >
            <Bot size={14} />
          </Avatar>

          <MessagePrimitive.If hasContent={false}>
            <Stack
                direction="row"
                gap="12px"
                sx={{
                  alignSelf: 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.fill,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    borderTopLeftRadius: '4px',
                  }}
                >
                  <Stack direction="row" gap="6px">
                    {[0, 0.2, 0.4].map((delay, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: theme.palette.text.accent,
                          animation: 'pulse 1.4s infinite',
                          animationDelay: `${delay}s`,
                          '@keyframes pulse': {
                            '0%, 60%, 100%': { opacity: 0.3 },
                            '30%': { opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
          </MessagePrimitive.If>
          
          <MessagePrimitive.If hasContent>
            <Stack gap="6px" sx={{ flex: 1 }}>
              <Box
                sx={{
                  backgroundColor: theme.palette.background.fill,
                  color: theme.palette.text.primary,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopLeftRadius: '4px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  width: 'fit-content',
                }}
              >
                <MessagePrimitive.Content components={{ Text: MessageText }} />
              </Box>
              <MessageChart />
            </Stack>
          </MessagePrimitive.If>
        </Stack>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
};
