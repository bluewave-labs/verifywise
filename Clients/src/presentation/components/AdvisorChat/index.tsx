import { Box, useTheme, Typography, Paper } from '@mui/material';
import { AssistantRuntime, AssistantRuntimeProvider } from '@assistant-ui/react';
import { useAdvisorRuntime } from './useAdvisorRuntime';
import { CustomThread } from './CustomThread';

const AdvisorChat = () => {
  const theme = useTheme();
  const runtime: AssistantRuntime = useAdvisorRuntime(); 

  return (
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
  );
};

export default AdvisorChat;
