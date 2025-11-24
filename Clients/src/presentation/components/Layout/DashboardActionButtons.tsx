import React, { useMemo, memo } from 'react';
import { Stack, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Puzzle, Zap } from 'lucide-react';
import { useAuth } from '../../../application/hooks/useAuth';
import RequestorApprovalModal from '../Modals/RequestorApprovalModal';

interface DashboardActionButtonsProps {
  hideOnMainDashboard?: boolean;
}

const DashboardActionButtons: React.FC<DashboardActionButtonsProps> = memo(({
  hideOnMainDashboard = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRoleName } = useAuth();
  const isAdmin = userRoleName === "Admin";

  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);


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
        onClick={() => setIsRequestModalOpen(true)}
        sx={{
          background: '#F4F4F4',
          color: '#344054',
          fontWeight: 500,
          fontSize: '13px', // Standardized font size
          height: '32px', // Standardized medium height
          minHeight: '32px',
          padding: '8px 16px', // Standardized padding
          borderRadius: '4px',
          textTransform: 'none',
          '&:hover': {
            color: '#13715B',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Requests
          <Box
    component="span"
    sx={{
      backgroundColor: '#13715B',
      color: '#fff',
      px: '6px',
      py: '2px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      textAlign: 'center'
    }}
  >
    1
  </Box>
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<Puzzle size={14} />}
        onClick={isAdmin ? () => navigate('/integrations') : undefined}
        disabled={!isAdmin}
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
          opacity: isAdmin ? 1 : 0.5,
          pointerEvents: isAdmin ? 'auto' : 'none',
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
      <RequestorApprovalModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)} />
    </Stack>


  );
});

DashboardActionButtons.displayName = 'DashboardActionButtons';

export default DashboardActionButtons;
