import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Chip,
  CircularProgress,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon, CheckCircle as CheckIcon, AlertCircle as ErrorIcon, XCircle as DisconnectIcon } from 'lucide-react';
import { cardStyles } from '../../themes/components';
import { IntegrationCardProps, IntegrationStatus } from '../../../domain/types/Integrations';

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onManage,
  loading = false,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case IntegrationStatus.CONFIGURED:
        return 'success';
      case IntegrationStatus.CONFIGURING:
        return 'warning';
      case IntegrationStatus.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case IntegrationStatus.CONFIGURED:
        return <CheckIcon size={16} />;
      case IntegrationStatus.ERROR:
        return <ErrorIcon size={16} />;
      case IntegrationStatus.NOT_CONFIGURED:
        return <DisconnectIcon size={16} />;
      default:
        return undefined;
    }
  };

  const handleActionClick = async () => {
    if (loading) return;

    try {
      // For Slack and MLFlow, always navigate to management page
      if (integration.id === 'slack' || integration.id === 'mlflow') {
        if (onManage) onManage(integration);
        return;
      }

      // For other integrations, use the normal flow
      switch (integration.status) {
        case IntegrationStatus.NOT_CONFIGURED:
        case IntegrationStatus.ERROR:
          if (onConnect) await onConnect(integration);
          break;
        case IntegrationStatus.CONFIGURED:
          if (onManage) onManage(integration);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to handle action for ${integration.displayName}:`, error);
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...(cardStyles.base(theme) as any),
        margin: 0, // Remove any default margin like dashboard cards
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        "&:hover": {
          background: "linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%)",
          borderColor: "#D1D5DB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleActionClick}
    >
      <CardContent
        sx={{
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          backgroundColor: "transparent",
          "&:last-child": {
            paddingBottom: 2,
          },
        }}
      >
        {/* Header Section: Icon and Integration Name with Status */}
        <Box sx={{ p: 2, m: 3, backgroundColor: "transparent" }}>
          {/* Integration Icon */}
          <Box
            component="img"
            src={integration.logo}
            alt={`${integration.displayName} logo`}
            sx={{
              width: 48,
              height: 48,
              mb: 3,
              objectFit: "contain",
            }}
          />

          {/* Integration Name and Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography
              variant="h6"
              sx={(theme) => ({
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "15px",
              })}
            >
              {integration.displayName}
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Chip
                size="small"
                label={integration.status}
                color={getStatusColor(integration.status)}
                icon={getStatusIcon(integration.status)}
                sx={{
                  fontSize: '11px',
                  height: 22,
                  borderRadius: '4px',
                  backgroundColor: getStatusColor(integration.status) === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                                 getStatusColor(integration.status) === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                 getStatusColor(integration.status) === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                                 'rgba(107, 114, 128, 0.1)',
                  color: getStatusColor(integration.status) === 'success' ? '#16a34a' :
                         getStatusColor(integration.status) === 'error' ? '#dc2626' :
                         getStatusColor(integration.status) === 'warning' ? '#d97706' :
                         '#6b7280',
                  border: `1px solid ${getStatusColor(integration.status) === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                                     getStatusColor(integration.status) === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                                     getStatusColor(integration.status) === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                                     'rgba(107, 114, 128, 0.2)'}`,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Content Section: Description and Tags */}
        <Box sx={{ backgroundColor: "transparent", mx: 3, mb: 4, px: 2, flexGrow: 1 }}>
        {/* Integration Description */}
        <Typography
          variant="body2"
          sx={(theme) => ({
            color: theme.palette.text.secondary,
            fontSize: "13px",
            mb: 0.5, // Reduced gap below description to 4px
          })}
        >
          {integration.description}
        </Typography>

        {(integration.lastSyncAt || integration.lastTestedAt) && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 2 }}>
            {integration.lastSyncAt && (
              <Typography variant="caption" color="text.secondary">
                Last sync: {new Date(integration.lastSyncAt).toLocaleString()}{" "}
                {integration.lastSyncStatus
                  ? `(${integration.lastSyncStatus})`
                  : ""}
              </Typography>
            )}
            {integration.lastTestedAt && (
              <Typography variant="caption" color="text.secondary">
                Last test: {new Date(integration.lastTestedAt).toLocaleString()}{" "}
                {integration.lastTestStatus
                  ? `(${integration.lastTestStatus})`
                  : ""}
              </Typography>
            )}
          </Box>
        )}

          {/* Integration Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 3 }}>
            {integration.features.slice(0, 2).map((feature, index) => (
              <Chip
                key={index}
                size="small"
                label={feature}
                variant="outlined"
                sx={{ fontSize: '10px', height: 20 }}
              />
            ))}
          </Box>
        </Box>

        {/* Action Button: Animated Connect/Manage Button */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
            display: "flex",
            alignItems: "center",
            color: theme.palette.primary.main,
            transition: "all 0.3s ease",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "13px",
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "translateX(0)" : "translateX(10px)",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  mr: isHovered ? 1 : 0,
                }}
              >
                {(integration.id === 'slack' || integration.id === 'mlflow') ? "Manage" :
                 integration.status === IntegrationStatus.CONFIGURED ? "Manage" :
                 integration.status === IntegrationStatus.CONFIGURING ? "Configuring..." :
                 integration.status === IntegrationStatus.ERROR ? "Retry" : "Configure"}
              </Typography>
              <ChevronRightIcon
                size={20}
                style={{
                  transform: isHovered ? "translateX(0)" : "translateX(0)",
                  transition: "all 0.3s ease",
                }}
              />
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default IntegrationCard;
