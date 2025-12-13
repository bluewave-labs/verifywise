/**
 * @fileoverview ErrorState Component
 *
 * Error state component for the deadline warning box.
 * Displays error messages and retry functionality when API calls fail.
 *
 * @package components/DeadlineWarningBox
 */

import React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Clock,
} from "lucide-react";
import { ErrorStateProps } from "./types";

/**
 * Error state component with retry functionality
 *
 * @param props - Component props
 * @returns JSX element
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryText = "Try Again",
  showDetails = false,
}) => {
  const theme = useTheme();
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  // Get appropriate error icon based on error type
  const getErrorIcon = () => {
    switch (error.code) {
      case "NETWORK_ERROR":
        return <WifiOff size={20} />;
      case "TIMEOUT":
        return <Clock size={20} />;
      default:
        return <AlertTriangle size={20} />;
    }
  };

  // Get user-friendly error message
  const getUserFriendlyMessage = () => {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "Unable to connect to the server. Please check your internet connection.";
      case "TIMEOUT":
        return "The request took too long. Please try again.";
      case "CANCELLED":
        return "The request was cancelled.";
      case "UNAUTHORIZED":
        return "You don't have permission to access deadline information.";
      case "FORBIDDEN":
        return "Access to deadline information is restricted.";
      case "NOT_FOUND":
        return "Deadline information is not available.";
      case "SERVER_ERROR":
        return "Server error occurred. Please try again later.";
      default:
        return error.message || "An unexpected error occurred while loading deadline information.";
    }
  };

  const userMessage = getUserFriendlyMessage();

  return (
    <Alert
      severity="error"
      icon={getErrorIcon()}
      sx={{
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.dark,
        "& .MuiAlert-icon": {
          color: theme.palette.error.dark,
        },
      }}
    >
      <AlertTitle sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
        Failed to Load Deadlines
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {userMessage}
      </Typography>

      {/* Retry button */}
      {onRetry && (
        <Button
          size="small"
          variant="outlined"
          onClick={onRetry}
          startIcon={<RefreshCw size={14} />}
          sx={{
            fontSize: "0.75rem",
            textTransform: "none",
            borderColor: theme.palette.error.dark,
            color: theme.palette.error.dark,
            "&:hover": {
              borderColor: theme.palette.error.main,
              backgroundColor: theme.palette.error.main + "10",
            },
          }}
        >
          {retryText}
        </Button>
      )}

      {/* Error details toggle */}
      {showDetails && (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            endIcon={detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            sx={{
              fontSize: "0.75rem",
              textTransform: "none",
              color: theme.palette.error.dark,
            }}
          >
            {detailsExpanded ? "Hide" : "Show"} Technical Details
          </Button>

          <Collapse in={detailsExpanded}>
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            >
              <Stack spacing={0.5}>
                {error.code && (
                  <Box>
                    <strong>Code:</strong> {error.code}
                  </Box>
                )}
                {error.statusCode && (
                  <Box>
                    <strong>Status:</strong> {error.statusCode}
                  </Box>
                )}
                <Box>
                  <strong>Message:</strong> {error.message}
                </Box>
                <Box>
                  <strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      )}
    </Alert>
  );
};

export default ErrorState;