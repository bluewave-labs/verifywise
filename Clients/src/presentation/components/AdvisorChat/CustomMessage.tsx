import { FC, useContext, useEffect, useState, memo } from 'react';
import { Stack, Box, useTheme, Avatar, Typography, Theme } from '@mui/material';
import { MessagePrimitive, useMessagePartText, useAssistantState } from '@assistant-ui/react';
import Markdown from 'react-markdown';

import { Bot } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import VWAvatar from '../Avatar/VWAvatar';
import { VerifyWiseContext } from '../../../application/contexts/VerifyWise.context';
import { useProfilePhotoFetch } from '../../../application/hooks/useProfilePhotoFetch';
import { User } from '../../../domain/types/User';

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Create markdown heading styles with theme
const createMarkdownHeadingStyles = (theme: Theme) => ({
  h1: { marginTop: 0, fontSize: theme.typography.body1.fontSize, fontWeight: 600 },
  h2: { marginTop: 0, fontSize: theme.typography.body1.fontSize, fontWeight: 700 },
  h3: { marginTop: 0, fontSize: theme.typography.body2.fontSize, fontWeight: 600 },
});

const MessageText: FC = () => {
  const theme = useTheme();
  const data = useMessagePartText();
  const headingStyles = createMarkdownHeadingStyles(theme);

  // Safety check
  if (data.status.type === 'running' || data.text === null || data.text === undefined || data.text === "") {
    return null;
  }

  return (
    <Markdown components={{
      p: 'div',
      h1: ({ node: _node, ...rest }) => <h1 style={headingStyles.h1} {...rest} />,
      h2: ({ node: _node, ...rest }) => <h2 style={headingStyles.h2} {...rest} />,
      h3: ({ node: _node, ...rest }) => <h3 style={headingStyles.h3} {...rest} />,
    }}>{data.text}</Markdown>
  );
};

interface ChartData {
  type: 'bar' | 'pie' | 'table' | 'donut' | 'line';
  data: { label: string; value: number; color?: string }[];
  title: string;
  series?: Array<{ label: string; data: number[] }>;
  xAxisLabels?: string[];
}

interface DataMessagePart {
  type: 'data';
  name: string;
  data: unknown;
}

const isValidChartData = (data: unknown): data is ChartData => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    ['bar', 'pie', 'table', 'donut', 'line'].includes(obj.type) &&
    Array.isArray(obj.data) &&
    typeof obj.title === 'string'
  );
};

const MessageChart: FC = () => {
  const message = useAssistantState(({ message }) => message);

  // Find the chart data in the message content
  const chartContent = message.content.find(
    (part): part is DataMessagePart =>
      typeof part === 'object' && part !== null && 'type' in part && part.type === 'data' && 'name' in part && part.name === 'chartData'
  );

  if (!chartContent || !chartContent.data || !isValidChartData(chartContent.data)) {
    return null;
  }

  return <ChartRenderer chartData={chartContent.data} />;
};

const MessageTimestamp: FC = () => {
  const theme = useTheme();
  const message = useAssistantState(({ message }) => message);

  // Skip welcome message (id: 'welcome') which is generated client-side
  if (!message?.createdAt || message.id === 'welcome') {
    return null;
  }

  return (
    <Typography
      variant="caption"
      sx={{
        color: theme.palette.text.tertiary ?? theme.palette.text.disabled,
        fontSize: theme.typography.caption.fontSize,
        mt: 0.5,
        ml: 0.5,
      }}
    >
      Answered: {formatTimestamp(new Date(message.createdAt))}
    </Typography>
  );
};

const DEFAULT_USER: User = {
  id: 1,
  name: "",
  surname: "",
  email: "",
  roleId: 1,
};

const CustomMessageComponent: FC = () => {
  const theme = useTheme();
  const { userId, users, photoRefreshFlag } = useContext(VerifyWiseContext);
  const { fetchProfilePhotoAsBlobUrl } = useProfilePhotoFetch();
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const user: User = users
    ? users.find((u: User) => u.id === userId) || DEFAULT_USER
    : DEFAULT_USER;

  useEffect(() => {
    let cancel = false;
    let previousUrl: string | null = null;
    (async () => {
      const url = await fetchProfilePhotoAsBlobUrl(userId || 0);
      if (cancel) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (previousUrl && previousUrl !== url) {
        URL.revokeObjectURL(previousUrl);
      }
      previousUrl = url ?? null;
      setAvatarUrl(url ?? "");
    })();

    return () => {
      cancel = true;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    };
  }, [userId, fetchProfilePhotoAsBlobUrl, photoRefreshFlag]);

  const userAvatar = {
    firstname: user.name,
    lastname: user.surname,
    pathToImage: avatarUrl,
  };

  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.If user>
        <Stack
          direction="row"
          gap={1.5}
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
              color: theme.palette.primary.contrastText,
              padding: '10px 14px',
              borderRadius: 3,
              borderTopRightRadius: 1,
              fontSize: theme.typography.body2.fontSize,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            <MessagePrimitive.Content components={{ Text: MessageText }} />
          </Box>
          <VWAvatar
            user={userAvatar}
            size="small"
            showBorder={false}
            sx={{ width: 28, height: 28, fontSize: 11 }}
          />
        </Stack>
      </MessagePrimitive.If>

      <MessagePrimitive.If assistant>
        <Stack
          direction="row"
          gap={1.5}
          sx={{
            alignSelf: 'flex-start',
            width: '100%',
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              backgroundColor: theme.palette.primary.main,
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            <Bot size={14} />
          </Avatar>

          <MessagePrimitive.If hasContent={false}>
            <Stack
                direction="row"
                gap={1.5}
                sx={{
                  alignSelf: 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.fill ?? theme.palette.grey[100],
                    padding: '12px 16px',
                    borderRadius: 3,
                    borderTopLeftRadius: 1,
                  }}
                >
                  <Stack direction="row" gap={0.75}>
                    {[0, 0.2, 0.4].map((delay, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.text.accent ?? theme.palette.text.secondary,
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
            <Stack gap={0.75} sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  backgroundColor: theme.palette.background.fill ?? theme.palette.grey[100],
                  color: theme.palette.text.primary,
                  padding: '10px 14px',
                  borderRadius: 3,
                  borderTopLeftRadius: 1,
                  fontSize: theme.typography.body2.fontSize,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                <MessagePrimitive.Content components={{ Text: MessageText }} />
              </Box>
              <MessageChart />
              <MessageTimestamp />
            </Stack>
          </MessagePrimitive.If>
        </Stack>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
};

export const CustomMessage = memo(CustomMessageComponent);
