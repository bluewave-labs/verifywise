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
      spacing={'8px'}
      sx={{
        position: 'absolute',
        top: 8,
        right: 24,
        zIndex: 10,
      }}
    >
      <Button
        variant="contained"
        startIcon={<Puzzle size={16} />}
        onClick={() => navigate('/integrations')}
        sx={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          height: '34px',
          minHeight: '34px',
          maxHeight: '34px',
          padding: '0 16px',
          borderRadius: '4px',
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          height: '34px',
          minHeight: '34px',
          maxHeight: '34px',
          padding: '0 16px',
          borderRadius: '4px',
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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