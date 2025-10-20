import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { Suspense } from 'react';
import PageBreadcrumbs from '../../components/Breadcrumbs/PageBreadcrumbs';
import IntegrationCard from '../../components/IntegrationCard';
import { AVAILABLE_INTEGRATIONS } from '../../../config/integrations';
import { Integration, IntegrationStatus, IntegrationConnectionHandler } from '../../../domain/types/integrations';
import Alert from '../../components/Alert';

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState(AVAILABLE_INTEGRATIONS.slice(0, 3)); // Only show first 3 integrations
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  // Handle integration connection
  const handleConnect: IntegrationConnectionHandler = useCallback(async (integration: Integration) => {
    setLoadingStates(prev => ({ ...prev, [integration.id]: true }));

    try {
      // Simulate API call for connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update integration status to connected
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, status: IntegrationStatus.CONNECTED, lastSyncAt: new Date() }
            : int
        )
      );

      setToast({
        variant: "success",
        body: `${integration.displayName} connected successfully!`,
        visible: true,
      });
    } catch (err) {
      setToast({
        variant: "error",
        body: `Failed to connect to ${integration.displayName}. Please try again.`,
        visible: true,
      });

      // Update integration status to error
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, status: IntegrationStatus.ERROR, error: 'Connection failed' }
            : int
        )
      );
    } finally {
      setLoadingStates(prev => ({ ...prev, [integration.id]: false }));
    }
  }, []);

  // Handle integration management
  const handleManage = useCallback((integration: Integration) => {
    // Navigate to integration management page or open modal
    console.log(`Managing ${integration.displayName}...`);
    // TODO: Navigate to integration management page
  }, []);

  // Close toast
  const handleCloseToast = () => {
    setToast(null);
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast && toast.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

      {/* VerifyWise Toast */}
      {toast && toast.visible && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={toast.variant}
            body={toast.body}
            isToast={true}
            onClick={handleCloseToast}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default Integrations;