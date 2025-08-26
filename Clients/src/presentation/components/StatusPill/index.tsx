import React from "react";
import { Chip, useTheme } from "@mui/material";
import { IntegrationStatus } from "../IntegrationCard";

interface StatusPillProps {
  status: IntegrationStatus;
  size?: "small" | "medium";
}

const StatusPill: React.FC<StatusPillProps> = ({ status, size = "small" }) => {
  const theme = useTheme();

  const getStatusConfig = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return {
          label: "Connected",
          color: "#10B981", // Green
          backgroundColor: "#ECFDF5", // Light green background
        };
      case "error":
        return {
          label: "Error",
          color: "#EF4444", // Red
          backgroundColor: "#FEF2F2", // Light red background
        };
      case "not_connected":
      default:
        return {
          label: "Not connected",
          color: "#6B7280", // Gray
          backgroundColor: "#F9FAFB", // Light gray background
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Chip
      label={statusConfig.label}
      size={size}
      sx={{
        fontSize: 13,
        height: size === "small" ? "20px" : "24px",
        fontWeight: 500,
        color: statusConfig.color,
        backgroundColor: statusConfig.backgroundColor,
        border: `1px solid ${statusConfig.color}20`, // 20% opacity border
        borderRadius: theme.shape.borderRadius,
        "& .MuiChip-label": {
          px: theme.spacing(6),
        },
      }}
    />
  );
};

export default StatusPill;