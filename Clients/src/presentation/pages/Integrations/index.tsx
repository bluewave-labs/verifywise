import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Stack,
} from '@mui/material';
import { Suspense } from 'react';
import PageBreadcrumbs from '../../components/Breadcrumbs/PageBreadcrumbs';
import PageHeader from '../../components/Layout/PageHeader';
import IntegrationCard from '../../components/IntegrationCard';
import { AVAILABLE_INTEGRATIONS } from '../../../config/integrations';
import { Integration, IntegrationStatus, IntegrationConnectionHandler } from '../../../domain/types/integrations';
import Alert from '../../components/Alert';
import useSlackIntegrations from '../../../application/hooks/useSlackIntegrations';
import { useAuth } from '../../../application/hooks/useAuth';
import { apiServices } from '../../../infrastructure/api/networkServices';

const Integrations: React.FC = () => {
  const navigate = useNavigate();
  const { userId, userRoleName } = useAuth();
  const { slackIntegrations } = useSlackIntegrations(userId);
  const [integrations, setIntegrations] = useState(AVAILABLE_INTEGRATIONS);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  const isAdmin = userRoleName === "Admin";

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

  useEffect(() => {
    const fetchMlflowStatus = async () => {
      try {
        const [configResponse, statusResponse] = await Promise.all([
          apiServices.get<{
            configured: boolean;
            config?: {
              lastTestStatus?: 'success' | 'error';
              lastTestedAt?: string;
            };
          }>("/integrations/mlflow/config"),
          apiServices.get<{
            success: boolean;
            data: {
              configured: boolean;
              lastSyncedAt: string | null;
              lastSyncStatus: 'success' | 'partial' | 'error' | null;
              lastTestStatus: 'success' | 'error' | null;
              lastTestedAt: string | null;
            };
          }>("/integrations/mlflow/sync-status"),
        ]);

        const configured = configResponse.data?.configured;
        const syncData = statusResponse.data?.data;

        setIntegrations(prev =>
          prev.map(int =>
            int.id === 'mlflow'
              ? {
                  ...int,
                  status: configured
                    ? IntegrationStatus.CONFIGURED
                    : IntegrationStatus.NOT_CONFIGURED,
                  lastSyncAt: syncData?.lastSyncedAt ?? null,
                  lastSyncStatus: syncData?.lastSyncStatus ?? null,
                  lastTestStatus:
                    syncData?.lastTestStatus ??
                    configResponse.data?.config?.lastTestStatus ??
                    null,
                  lastTestedAt:
                    syncData?.lastTestedAt ??
                    configResponse.data?.config?.lastTestedAt ??
                    null,
                }
              : int,
          ),
        );
      } catch (error) {
        setIntegrations(prev =>
          prev.map(int =>
            int.id === 'mlflow'
              ? {
                  ...int,
                  status: IntegrationStatus.NOT_CONFIGURED,
                  lastSyncAt: null,
                  lastSyncStatus: null,
                  lastTestStatus: null,
                  lastTestedAt: null,
                }
              : int,
          ),
        );
      }
    };

    fetchMlflowStatus();
  }, []);

  // Handle integration connection
  const handleConnect: IntegrationConnectionHandler = useCallback(async (integration: Integration) => {
    setLoadingStates(prev => ({ ...prev, [integration.id]: true }));

    try {
      // Simulate API call for connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update integration status to configured
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? {
                ...int,
                status: IntegrationStatus.CONFIGURED,
                lastSyncAt: new Date().toISOString(),
              }
            : int
        )
      );

      setToast({
        variant: "success",
        body: `${integration.displayName} configured successfully!`,
        visible: true,
      });
    } catch (err) {
      setToast({
        variant: "error",
        body: `Failed to configure ${integration.displayName}. Please try again.`,
        visible: true,
      });

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
    } else if (integration.id === 'mlflow') {
      navigate('/integrations/mlflow');
    }
    // TODO: Add navigation for other integration management pages
  }, [navigate]);

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
    return;
  }, [toast]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

      <PageHeader
        title="Integrations"
        description="Connect your favorite tools to streamline your AI governance workflow"
      />


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
    </Stack>
  );
};

export default Integrations;
