import React, { useMemo, memo } from 'react';
import { Stack, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Puzzle, Zap } from 'lucide-react';

interface DashboardActionButtonsProps {
  hideOnMainDashboard?: boolean;
}

const DashboardActionButtons: React.FC<DashboardActionButtonsProps> = memo(({
  hideOnMainDashboard = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the main dashboard - memoized to prevent unnecessary re-renders
  const isMainDashboard = useMemo(
    () => location.pathname === '/' || location.pathname === '',
    [location.pathname]
  );

  // Instead of returning null (which causes layout shift), keep mounted but invisible
  const shouldHide = hideOnMainDashboard && isMainDashboard;

  return (
    <Stack
      direction="row"
      spacing={'8px'}
      sx={{
        visibility: shouldHide ? 'hidden' : 'visible',
        opacity: shouldHide ? 0 : 1,
        pointerEvents: shouldHide ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={<Puzzle size={14} />}
        onClick={() => navigate('/integrations')}
        sx={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          color: 'white',
          fontWeight: 500,
          fontSize: '13px', // Standardized font size
          height: '32px', // Standardized medium height
          minHeight: '32px',
          padding: '8px 16px', // Standardized padding
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
        size="small"
        startIcon={<Zap size={14} />}
        onClick={() => navigate('/automations')}
        sx={{
          background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
          color: 'white',
          fontWeight: 500,
          fontSize: '13px', // Standardized font size
          height: '32px', // Standardized medium height
          minHeight: '32px',
          padding: '8px 16px', // Standardized padding
          borderRadius: '4px',
          textTransform: 'none',
          boxShadow: '0 2px 4px rgba(251, 146, 60, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            boxShadow: '0 4px 8px rgba(251, 146, 60, 0.3)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Automations
      </Button>
    </Stack>
  );
});

DashboardActionButtons.displayName = 'DashboardActionButtons';

export default DashboardActionButtons;