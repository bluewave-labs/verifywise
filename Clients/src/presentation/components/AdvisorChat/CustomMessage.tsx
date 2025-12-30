import { FC, useContext, useEffect, useState } from 'react';
import { Stack, Box, useTheme, Avatar, Typography } from '@mui/material';
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
        return <h1 style={{marginTop: 0, fontSize: '15px', fontWeight: 600}} {...rest} />
      },
      h2(props) {
        const {node, ...rest} = props
        return <h2 style={{marginTop: 0, fontSize: '15px', fontWeight: 700}} {...rest} />
      },
      h3(props) {
        const {node, ...rest} = props
        return <h3 style={{marginTop: 0, fontSize: '13px', fontWeight: 600}} {...rest} />
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
        color: theme.palette.text.tertiary,
        fontSize: '11px',
        mt: '4px',
        ml: '4px',
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

export const CustomMessage: FC = () => {
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
          gap="12px"
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
            <Stack gap="6px" sx={{ flex: 1, minWidth: 0 }}>
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
