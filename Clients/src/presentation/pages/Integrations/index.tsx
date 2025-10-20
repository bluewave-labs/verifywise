import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import PageBreadcrumbs from '../../components/Breadcrumbs/PageBreadcrumbs';
import IntegrationCard from '../../components/IntegrationCard';
import { AVAILABLE_INTEGRATIONS } from '../../../config/integrations';
import { Integration, IntegrationStatus, IntegrationConnectionHandler } from '../../../domain/types/integrations';
import useSlackIntegrations from '../../../application/hooks/useSlackIntegrations';
import { useAuth } from '../../../application/hooks/useAuth';

const Integrations: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { slackIntegrations } = useSlackIntegrations(userId);
  const [integrations, setIntegrations] = useState(AVAILABLE_INTEGRATIONS.slice(0, 3)); // Only show first 3 integrations
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update Slack integration status based on actual data
  useEffect(() => {
    if (slackIntegrations && slackIntegrations.length > 0) {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === 'slack'
            ? { ...int, status: IntegrationStatus.CONFIGURED }
            : int
        )
      );
    } else {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === 'slack'
            ? { ...int, status: IntegrationStatus.NOT_CONFIGURED }
            : int
        )
      );
    }
  }, [slackIntegrations]);

  // Handle integration connection
  const handleConnect: IntegrationConnectionHandler = useCallback(async (integration: Integration) => {
    setLoadingStates(prev => ({ ...prev, [integration.id]: true }));
    setError(null);

    try {
      // Simulate API call for connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update integration status to configured
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, status: IntegrationStatus.CONFIGURED, lastSyncAt: new Date() }
            : int
        )
      );

      setSuccessMessage(`${integration.displayName} configured successfully!`);
    } catch (err) {
      setError(`Failed to configure ${integration.displayName}. Please try again.`);

      // Update integration status to error
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, status: IntegrationStatus.ERROR, error: 'Configuration failed' }
            : int
        )
      );
    } finally {
      setLoadingStates(prev => ({ ...prev, [integration.id]: false }));
    }
  }, []);

  // Handle integration management
  const handleManage = useCallback((integration: Integration) => {
    // Navigate to integration-specific management page
    if (integration.id === 'slack') {
      navigate('/integrations/slack');
    }
    // TODO: Add navigation for other integration management pages
  }, [navigate]);

  // Close error snackbar
  const handleCloseError = () => {
    setError(null);
  };

  // Close success snackbar
  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumbs />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, fontSize: '15px' }}>
          Integrations
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '13px' }} color="text.secondary">
          Connect your favorite tools to streamline your AI governance workflow
        </Typography>
      </Box>

  
      {/* Integration Cards Grid */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          {integrations.map((integration) => (
            <Box
              key={integration.id}
              sx={{
                width: { xs: "100%", md: "calc(50% - 8px)", lg: "calc(33.333% - 11px)" }
              }}
            >
              <IntegrationCard
                integration={integration}
                onConnect={handleConnect}
                onManage={handleManage}
                loading={loadingStates[integration.id] || false}
              />
            </Box>
          ))}
        </Box>

        </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Integrations;