import { useState, useEffect } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import { X, Info, AlertCircle } from "lucide-react";

interface InfoBoxProps {
  message: string;
  storageKey: string; // Unique key for localStorage to track dismissal
  variant?: "info" | "warning"; // Icon type: info (green) or warning (yellow)
  header?: string; // Optional header for tips
  onDismiss?: () => void; // Optional custom dismiss handler
}

const InfoBox = ({ message, storageKey, variant = "info", header, onDismiss }: InfoBoxProps) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  // Icon configuration based on variant
  const iconConfig = {
    info: {
      Icon: Info,
      color: "#059669", // Green
    },
    warning: {
      Icon: AlertCircle,
      color: "#D97706", // Yellow/Orange
    },
  };

  const { Icon, color } = iconConfig[variant];

  // Check if this info box has been dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem(`infoBox_${storageKey}`);
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, [storageKey]);

  const handleClose = () => {
    // Save dismissal to localStorage
    localStorage.setItem(`infoBox_${storageKey}`, "true");
    setIsVisible(false);

    // Call custom dismiss handler if provided
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.background.paper,
        padding: "12px 16px",
        borderRadius: "4px",
        border: `1px solid ${theme.palette.divider}`,
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1 }}>
        <Icon size={18} strokeWidth={2} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
          {header && (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.palette.text.primary,
                lineHeight: 1.5,
              }}
            >
              {header}
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>
        </Box>
      </Box>
      <IconButton
        onClick={handleClose}
        size="small"
        sx={{
          padding: "4px",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <X size={16} strokeWidth={2} />
      </IconButton>
    </Box>
  );
};

export default InfoBox;
