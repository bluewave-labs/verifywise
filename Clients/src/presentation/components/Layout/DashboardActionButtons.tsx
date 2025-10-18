import React from 'react';
import { Stack, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Zap } from 'lucide-react';

interface DashboardActionButtonsProps {
  hideOnMainDashboard?: boolean;
}

const DashboardActionButtons: React.FC<DashboardActionButtonsProps> = ({
  hideOnMainDashboard = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Check if we're on the main dashboard
  const isMainDashboard = window.location.pathname === '/' || window.location.pathname === '';

  if (hideOnMainDashboard && isMainDashboard) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        position: 'absolute',
        top: -8,
        right: 24,
        zIndex: 10,
      }}
    >
      <Button
        variant="contained"
        startIcon={<Puzzle size={16} />}
        onClick={() => navigate('/integrations')}
        sx={{
          backgroundColor: '#8B5CF6',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '8px',
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
          '&:hover': {
            backgroundColor: '#7C3AED',
            boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Integrations
      </Button>
      <Button
        variant="contained"
        startIcon={<Zap size={16} />}
        onClick={() => navigate('/automations')}
        sx={{
          backgroundColor: '#10B981',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '8px',
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
          '&:hover': {
            backgroundColor: '#059669',
            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Automations
      </Button>
    </Stack>
  );
};

export default DashboardActionButtons;