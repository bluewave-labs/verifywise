import React, { useMemo, memo, useCallback, useEffect } from 'react';
import { Stack, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Puzzle, Zap } from 'lucide-react';
import { useAuth } from '../../../application/hooks/useAuth';
import VWTooltip from '../VWTooltip';
import { Box } from '@mui/material';
import RequestorApprovalModal from '../Modals/RequestorApprovalModal';
import ApprovalButton from './ApprovalButton';

interface DashboardActionButtonsProps {
  hideOnMainDashboard?: boolean;
}

// Keyboard shortcut badge component
const KeyboardBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minWidth: '22px',
    }}
  >
    {children}
  </Box>
);

// Tooltip content for Wise Search
const WiseSearchTooltipContent: React.FC<{ isMac: boolean }> = ({ isMac }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <KeyboardBadge>{isMac ? '⌘' : 'Ctrl'}</KeyboardBadge>
      <KeyboardBadge>K</KeyboardBadge>
    </Box>
    <Box sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', lineHeight: 1.5 }}>
      Search across all projects, tasks, vendors, policies, and more in your workspace.
    </Box>
  </Box>
);

// Ghost style - transparent with borders
const STYLE = {
  search: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderColor: '#d0d5dd' },
  },
  integrations: {
    backgroundColor: 'transparent',
    color: '#8B5CF6',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.08)', borderColor: '#8B5CF6' },
    '&.Mui-disabled': { backgroundColor: 'transparent', color: '#8B5CF6', opacity: 0.5 },
  },
  automations: {
    backgroundColor: 'transparent',
    color: '#F97316',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)', borderColor: '#F97316' },
  },
};

const DashboardActionButtons: React.FC<DashboardActionButtonsProps> = memo(({
  hideOnMainDashboard = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRoleName } = useAuth();
  const isAdmin = userRoleName === "Admin";

  // Detect if user is on Mac for keyboard shortcuts
  const isMac = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.platform?.toLowerCase().includes('mac') ||
        navigator.userAgent?.toLowerCase().includes('mac');
    }
    return false;
  }, []);

  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [isRequestor, setIsRequestor] = React.useState(false);


  // Check if we're on the main dashboard - memoized to prevent unnecessary re-renders
  const isMainDashboard = useMemo(
    () => location.pathname === '/' || location.pathname === '',
    [location.pathname]
  );

  const shouldHide = hideOnMainDashboard && isMainDashboard;

  const handleOpenCommandPalette = useCallback(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
  }, []);

  const baseStyles = {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  const [approvalRequestsCount, setApprovalRequestsCount] = React.useState(0);
  const [requestorRequestsCount, setRequestorRequestsCount] = React.useState(0);

  useEffect(() => {
    // Fetch counts from API or state management
    // For demonstration, we'll set static values
    setApprovalRequestsCount(5);
    setRequestorRequestsCount(3);
  }, []);


  return (
    <Stack
      direction="row"
      spacing={'8px'}
      alignItems="center"
      sx={{
        visibility: shouldHide ? 'hidden' : 'visible',
        opacity: shouldHide ? 0 : 1,
        pointerEvents: shouldHide ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Wise Search */}
      <VWTooltip header="Wise Search" content={<WiseSearchTooltipContent isMac={isMac} />} placement="bottom" maxWidth={280}>
        <IconButton size="small" onClick={handleOpenCommandPalette} sx={{ ...baseStyles, ...STYLE.search }}>
          <Search size={16} />
        </IconButton>
      </VWTooltip>

      <ApprovalButton
        label="Approval requests"
        count={approvalRequestsCount}
        onClick={() => { setIsRequestModalOpen(true); setIsRequestor(false); }}
      />
      <ApprovalButton
        label="Requestor requests"
        count={requestorRequestsCount}
        onClick={() => { setIsRequestModalOpen(true); setIsRequestor(true); }}
      />

      {/* Integrations */}
      <VWTooltip
        header="Integrations"
        content={isAdmin ? "Connect external tools and services." : "Admin access required."}
        placement="bottom"
        maxWidth={200}
      >
        <span>
          <IconButton
            size="small"
            onClick={isAdmin ? () => navigate('/integrations') : undefined}
            disabled={!isAdmin}
            sx={{ ...baseStyles, ...STYLE.integrations }}
          >
            <Puzzle size={16} />
          </IconButton>
        </span>
      </VWTooltip>

      {/* Automations */}
      <VWTooltip header="Automations" content="Set up automated workflows." placement="bottom" maxWidth={200}>
        <IconButton size="small" onClick={() => navigate('/automations')} sx={{ ...baseStyles, ...STYLE.automations }}>
          <Zap size={16} />
        </IconButton>
      </VWTooltip>


      <RequestorApprovalModal
        isOpen={isRequestModalOpen}
        isRequestor={isRequestor}
        onClose={() => setIsRequestModalOpen(false)} />
    </Stack>
  );
});

DashboardActionButtons.displayName = 'DashboardActionButtons';

export default DashboardActionButtons;
