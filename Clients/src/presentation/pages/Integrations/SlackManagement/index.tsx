import { Box, CircularProgress, Typography } from "@mui/material";
import { lazy, useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Slack as SlackIcon, Plug } from "lucide-react";
import { useAuth } from "../../../../application/hooks/useAuth";
import { createSlackIntegration } from "../../../../application/repository/slack.integration.repository";
import useSlackIntegrations, {
  SlackWebhook,
} from "../../../../application/hooks/useSlackIntegrations";
import { ENV_VARs } from "../../../../../env.vars";
import Alert from "../../../components/Alert";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import allowedRoles from "../../../../application/constants/permissions";

const SlackIntegrationsTable = lazy(() => import("./SlackIntegrationsTable"));

/**
 * Helper function to format error messages consistently
 */
const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const SlackManagement = () => {
  const navigate = useNavigate();
  const { userId, userRoleName } = useAuth();
  const {
    loading: loadingData,
    error: slackError,
    slackIntegrations,
    refreshSlackIntegrations,
  } = useSlackIntegrations(userId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [integrationData, setIntegrationData] = useState<SlackWebhook[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title: string;
    body: string;
    isToast: boolean;
    visible: boolean;
  }>({
    variant: "info",
    title: "",
    body: "",
    isToast: true,
    visible: false,
  });

  useEffect(() => {
    if (slackIntegrations) {
      setIntegrationData(slackIntegrations);
    }
  }, [slackIntegrations]);

  const scopes = [
    "channels:read",
    "channels:manage",
    "chat:write",
    "incoming-webhook",
    "chat:write.public",
    "groups:write",
    "groups:read",
    "im:read",
    "mpim:read",
  ].join(",");

  const userScopes = [
    "channels:read",
    "channels:write.invites",
    "groups:read",
    "groups:write.invites",
    "channels:write",
    "chat:write",
    "im:read",
    "mpim:read",
  ].join(",");

  // Updated redirect URI to point to /integrations/slack
  const url = `${ENV_VARs.SLACK_URL}?client_id=${ENV_VARs.CLIENT_ID}&scope=${scopes}&user_scope=${userScopes}&redirect_uri=${window.location.origin}/integrations/slack`;

  // Handle the callback when user returns from Slack
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      showAlert("error", "Error", `Slack authorization failed: ${formatErrorMessage(error)}`);
      removeUnusedParams();
      return;
    }

    if (code) {
      exchangeCodeForTokens(code);
    }
  }, [searchParams]);

  useEffect(() => {
    if (slackError) {
      showAlert("error", "Error", formatErrorMessage(slackError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showAlert is a stable callback
  }, [slackError]);

  const exchangeCodeForTokens = async (code: string) => {
    setIsLoading(true);

    try {
      // This should be done on your backend for security
      const body = { code, userId };
      await createSlackIntegration({ body });
      refreshSlackIntegrations();
      showAlert("success", "Success", "Slack integration added successfully!");

      // Redirect back to integrations page after 2 seconds to show the success message
      const timeoutId = setTimeout(() => {
        navigate('/integrations');
      }, 2000);
      setRedirectTimeout(timeoutId);
    } catch (error) {
      showAlert(
        "error",
        "Error",
        `Failed to complete Slack integration: ${formatErrorMessage(error)}`,
      );
    } finally {
      // Clear URL parameters
      removeUnusedParams();
      setIsLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  const removeUnusedParams = () => {
    searchParams.delete("code");
    searchParams.delete("state");
    searchParams.delete("error");
    setSearchParams(searchParams);
  };

  /**
   * Show alert with auto-hide functionality
   */
  const showAlert = useCallback(
    (
      variant: "success" | "info" | "warning" | "error",
      title: string,
      body: string,
    ) => {
      setAlert({
        variant,
        title,
        body,
        isToast: true,
        visible: true,
      });

      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
    },
    [],
  );

  const isPermissionDenied = !allowedRoles.slack.view.includes(userRoleName);

  const breadcrumbItems = [
    {
      label: "Integrations",
      path: "/integrations",
      icon: <Plug size={16} />,
    },
    {
      label: "Slack",
      icon: <SlackIcon size={16} />,
    }
  ];

  if (isPermissionDenied) {
    return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />
        <Typography sx={{ mt: 4 }} variant="h6" color="error">
          You are not authorized to view this section.
        </Typography>
      </Box>
    );
  }

  if (isLoading || loadingData) {
    return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />
        <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Connecting to Slack...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />

      {/* Header */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, fontSize: '15px' }}>
          Slack Integration
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '13px' }} color="text.secondary">
          Connect your Slack workspace and route VerifyWise notifications to specific channels.
        </Typography>
      </Box>

      {alert.visible && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={alert.isToast}
          onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <SlackIntegrationsTable
        integrationData={integrationData}
        showAlert={showAlert}
        refreshSlackIntegrations={refreshSlackIntegrations}
        slackUrl={url}
      />
    </Box>
  );
};

export default SlackManagement;
