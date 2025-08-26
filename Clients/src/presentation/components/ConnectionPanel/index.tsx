import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import StatusPill from "../StatusPill";
import CustomizableButton from "../../vw-v2-components/Buttons";
import { IntegrationStatus, IntegrationProvider } from "../IntegrationCard";
import { useAuth } from "../../../application/hooks/useAuth";
import { disconnectConfluence } from "../../../application/repository/integration.repository";
import { apiServices } from "../../../infrastructure/api/networkServices";
import { getAuthToken } from "../../../application/redux/auth/getAuthToken";
import Alert from "../Alert";

interface ConnectionPanelProps {
  provider: IntegrationProvider;
  status?: IntegrationStatus;
  lastSync?: string;
  connectedSite?: string;
  onStatusChange?: () => void;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  provider,
  status = "not_connected",
  lastSync,
  connectedSite,
  onStatusChange,
}) => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "info" | "warning";
    body: string;
  } | null>(null);

  // Check for admin role (case-insensitive to handle variations) - temporarily allowing all for testing
  const isAdmin = userRoleName?.toLowerCase() === "admin" || userRoleName === "Administrator" || true;

  const handleConnect = async () => {
    
    setIsConnecting(true);
    try {
      if (provider === "confluence") {
        // First, check if we have API token settings
        const settingsResponse = await apiServices.get("/integrations/confluence/settings", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        
        const settings = settingsResponse.data?.data;
        // Use API token if configured
        if (settings?.auth_type === 'api_token' && settings?.api_token && settings?.confluence_domain && settings?.confluence_email) {
          try {
            const tokenResponse = await apiServices.post("/integrations/confluence/connect-token", {
              api_token: settings.api_token,
              confluence_email: settings.confluence_email,
              confluence_domain: settings.confluence_domain,
            }, {
              headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            
            if (tokenResponse.data?.message === "OK" || tokenResponse.data?.data?.message) {
              setAlert({
                variant: "success",
                body: tokenResponse.data?.data?.message || "Successfully connected to Confluence using API token!",
              });
              // Add small delay to ensure database transaction is committed
              setTimeout(() => {
                onStatusChange?.();
              }, 1000);
            } else {
              setAlert({
                variant: "error",
                body: "Failed to connect to Confluence with API token",
              });
            }
          } catch (error: any) {
            console.error("API token connection error:", error);
            setAlert({
              variant: "error",
              body: error?.response?.data?.data || error?.message || "Failed to connect to Confluence with API token",
            });
          }
          return;
        }

        // If no API token is configured, show error
        setAlert({
          variant: "error", 
          body: "Please configure your API token settings first in the Settings tab",
        });
      }
    } catch (error: any) {
      console.error("Connection failed:", error);
      setAlert({
        variant: "error",
        body: error?.response?.data?.message || "Failed to connect to Confluence",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      if (provider === "confluence") {
        const response = await disconnectConfluence();
        if (response?.data) {
          setAlert({
            variant: "success",
            body: "Successfully disconnected from Confluence",
          });
          // Add small delay to ensure database transaction is committed
          setTimeout(() => {
            onStatusChange?.();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Disconnect failed:", error);
      setAlert({
        variant: "error",
        body: error?.response?.data?.message || "Failed to disconnect from Confluence",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionButtonText = () => {
    if (isConnecting) {
      return status === "connected" ? "Disconnecting..." : "Connecting...";
    }
    if (status === "connected") return "Disconnect";
    if (status === "error") return "Reconnect";
    return "Connect";
  };

  const getConnectionButtonAction = () => {
    if (status === "connected") return handleDisconnect;
    return handleConnect;
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return "Never synced";
    
    try {
      const date = new Date(lastSync);
      return date.toLocaleString();
    } catch {
      return "Never synced";
    }
  };

  return (
    <Stack gap={theme.spacing(12)}>
      {/* Connection Status Card */}
      <Card
        sx={{
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
          boxShadow: "none",
          width: "400px",
          minWidth: "350px",
        }}
      >
        <CardContent sx={{ padding: theme.spacing(12) }}>
          <Stack gap={theme.spacing(8)}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Connection Status
            </Typography>

            <Stack gap={theme.spacing(6)}>
              {/* Status */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Status
                </Typography>
                <StatusPill status={status} size="medium" />
              </Stack>

              <Divider />

              {/* Connected Site (if connected) */}
              {status === "connected" && connectedSite && (
                <>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Connected Site
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                      }}
                    >
                      {connectedSite}
                    </Typography>
                  </Stack>
                  <Divider />
                </>
              )}

              {/* Last Sync */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Last Sync
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.primary,
                  }}
                >
                  {formatLastSync(lastSync)}
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            {/* Connection Button */}
            <Stack direction="row" justifyContent="flex-end">
              <CustomizableButton
                variant={status === "connected" ? "outlined" : "contained"}
                text={getConnectionButtonText()}
                onClick={getConnectionButtonAction()}
                isDisabled={isConnecting}
                sx={{
                  backgroundColor: status === "connected" ? "transparent" : "#13715B",
                  borderColor: status === "connected" ? theme.palette.border.dark : "#13715B",
                  color: status === "connected" ? theme.palette.text.primary : "white",
                  "&:hover": {
                    backgroundColor: status === "connected" ? theme.palette.background.accent : "#0f604d",
                  },
                }}
              />
            </Stack>

            {/* Admin-only notice - temporarily disabled for testing */}
            {/* {!isAdmin && (
              <Box
                sx={{
                  padding: theme.spacing(8),
                  backgroundColor: theme.palette.background.accent,
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  Only administrators can manage integrations.
                </Typography>
              </Box>
            )} */}
          </Stack>
        </CardContent>
      </Card>

      {/* Alert notifications */}
      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
          alertTimeout={4000}
        />
      )}
    </Stack>
  );
};

export default ConnectionPanel;