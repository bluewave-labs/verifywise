import { Stack, Box, useTheme, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import { MessageSquare, X } from 'lucide-react';
import { AssistantRuntime, AssistantRuntimeProvider } from '@assistant-ui/react';
import { useRiskAdvisorRuntime } from './useRiskAdvisorRuntime';
import { CustomThread } from './CustomThread';

interface RiskAdvisorChatProps {
  open: boolean;
  onClose: () => void;
  risks?: any[];
}

const RiskAdvisorChat = ({ open, onClose, risks = [] }: RiskAdvisorChatProps) => {
  const theme = useTheme();

  const runtime: AssistantRuntime = useRiskAdvisorRuntime(risks || []);

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 44,
        right: 44,
        width: '420px',
        height: '600px',
        zIndex: 1300,
        boxShadow: '0px 8px 24px rgba(16, 24, 40, 0.15)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        [theme.breakpoints.down('sm')]: {
          width: '100vw',
          height: '100vh',
          bottom: 0,
          right: 0,
          borderRadius: 0,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.border?.light}`,
          borderRadius: '12px',
          backgroundColor: theme.palette.background.main,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            paddingX: '16px',
            paddingY: '12px',
            backgroundColor: theme.palette.primary.main,
            borderBottom: `1px solid ${theme.palette.border?.light}`,
          }}
        >
          <Stack direction="row" alignItems="center" gap="12px">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={16} color="#fff" />
            </Box>
            <Stack>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                AI Risk Advisor
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.85)',
                }}
              >
                Get insights about your risks
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" gap="4px">
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <X size={16} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Chat Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.alt,
          }}
        >
          {runtime ? (
            <AssistantRuntimeProvider runtime={runtime}>
              <CustomThread />
            </AssistantRuntimeProvider>
           ) : (
            <Box
              sx={{
                padding: '24px',
                textAlign: 'center',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '13px' }}>
                Initializing chat...
              </Typography>
            </Box> 
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RiskAdvisorChat;
