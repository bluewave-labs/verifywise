import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Stack,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StatusPill from "../StatusPill";
import CustomizableButton from "../../vw-v2-components/Buttons";
import { useAuth } from "../../../application/hooks/useAuth";
import confluenceLogo from "../../assets/imgs/confluence-logo.png";

export type IntegrationStatus = "not_connected" | "connected" | "error";
export type IntegrationProvider = "confluence";

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  provider: IntegrationProvider;
}

interface IntegrationCardProps {
  integration: Integration;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userRoleName } = useAuth();
  
  const isAdmin = userRoleName?.toLowerCase() === "admin" || userRoleName === "Administrator";


  const getButtonText = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return "Manage";
      case "error":
        return "Reconnect";
      default:
        return "Connect";
    }
  };

  const handleCardClick = () => {
    navigate(`/integrations/${integration.id}`);
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isAdmin) {
      navigate(`/integrations/${integration.id}`);
    }
  };

  return (
    <Card
      sx={{
        cursor: "pointer",
        height: "100%",
        transition: "all 0.2s ease-in-out",
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.shape.borderRadius,
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
          borderColor: theme.palette.border.dark,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent
        sx={{
          padding: theme.spacing(16),
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack gap={theme.spacing(12)} sx={{ flex: 1 }}>
          {/* Header with logo and status */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            {/* Logo */}
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {integration.provider === "confluence" && (
                <img 
                  src={confluenceLogo} 
                  alt="Confluence"
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "contain" 
                  }}
                />
              )}
            </Box>
            <StatusPill status={integration.status} />
          </Stack>

          {/* Name and description */}
          <Stack gap={theme.spacing(4)}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {integration.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
                lineHeight: 1.5,
              }}
            >
              {integration.description}
            </Typography>
          </Stack>

          {/* Button */}
          <Box sx={{ mt: "auto" }}>
            {isAdmin ? (
              <CustomizableButton
                variant="outlined"
                text={getButtonText(integration.status)}
                onClick={handleButtonClick}
                sx={{
                  width: "100%",
                  borderColor: theme.palette.border.dark,
                  color: theme.palette.text.primary,
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.background.accent,
                  },
                }}
              />
            ) : (
              <Tooltip title="Admins only" placement="top">
                <Box>
                  <CustomizableButton
                    variant="outlined"
                    text={getButtonText(integration.status)}
                    isDisabled={true}
                    sx={{
                      width: "100%",
                      borderColor: theme.palette.border.light,
                      color: theme.palette.text.disabled,
                      cursor: "not-allowed",
                    }}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default IntegrationCard;