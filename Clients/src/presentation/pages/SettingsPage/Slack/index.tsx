import { Box, CircularProgress, Typography } from "@mui/material";
import { lazy, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../application/hooks/useAuth";
import { createSlackIntegration } from "../../../../application/repository/slack.integration.repository";
import useSlackIntegrations, {
  SlackWebhook,
} from "../../../../application/hooks/useSlackIntegrations";
import { ENV_VARs } from "../../../../../env.vars";
import Alert from "../../../components/Alert";
import { vwhomeHeading } from "../../Home/1.0Home/style";
import allowedRoles from "../../../../application/constants/permissions";
import singleTheme from "../../../themes/v1SingleTheme";

const SlackIntegrations = lazy(() => import("./SlackIntegrations"));

const Slack = () => {
  const { userId, userRoleName } = useAuth();
  const {
    loading: loadingData,
    error: slackError,
    slackIntegrations,
    refreshSlackIntegrations,
  } = useSlackIntegrations(userId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [integrationData, setIntegrationData] = useState<SlackWebhook[]>([]);
  const [searchParams] = useSearchParams();

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
  }, [slackIntegrations, refreshSlackIntegrations]);

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

  const url = `${ENV_VARs.SLACK_URL}?client_id=${ENV_VARs.CLIENT_ID}&scope=${scopes}&user_scope=${userScopes}&redirect_uri=${window.location.origin}/setting/?activeTab=slack`;

  // Handle the callback when user returns from Slack
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      showAlert("error", "Error", `Slack authorization failed: ${error}`);
      removeUnusedParams();
      return;
    }

    if (code) {
      exchangeCodeForTokens(code);
    }
  }, [searchParams]);

  useEffect(() => {
    if (slackError) {
      showAlert("error", "Error", `${slackError}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slackError]);

  const exchangeCodeForTokens = async (code: string) => {
    setIsLoading(true);

    try {
      // This should be done on your backend for security
      const body = { code, userId };
      await createSlackIntegration({ body });
      refreshSlackIntegrations();

      // Clear URL parameters
      removeUnusedParams();
    } catch (error) {
      showAlert(
        "error",
        "Error",
        `Failed to complete Slack integration: ${error}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeUnusedParams = () => {
    // Preserve the activeTab query param when clearing others
    const params = new URLSearchParams(window.location.search);
    const activeTab = params.get("activeTab");
    const newUrl = activeTab
      ? `${window.location.pathname}?activeTab=${activeTab}`
      : window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
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

  if (isPermissionDenied) {
    return (
      <Typography sx={{ mt: 20 }} variant="h6" color="error">
        You are not authorized to view this section.
      </Typography>
    );
  }

  if (isLoading || loadingData) {
    return (
      <Box sx={{ mt: 20, display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>Connecting to Slack...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 20,
      }}
    >
      <Typography sx={vwhomeHeading}>Slack Integration</Typography>
      <Typography sx={singleTheme.textStyles.pageDescription}>
        Connect you Slack workspace and route VerifyWise notifications to
        specific channels.
      </Typography>
      {/* This is embeddable html provided by Slack */}
      <a href={`${url}`}>
        <img
          alt="Add to Slack"
          height="40"
          width="139"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>

      {alert.visible && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={alert.isToast}
          onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {integrationData.length > 0 && (
        <SlackIntegrations
          integrationData={integrationData}
          showAlert={showAlert}
          refreshSlackIntegrations={refreshSlackIntegrations}
        />
      )}
    </Box>
  );
};

export default Slack;
