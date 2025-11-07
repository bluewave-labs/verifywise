import React from "react";
import { Stack, Typography } from "@mui/material";
import SkeletonCard from "../SkeletonCard";
import {
  emptyStateTextStyle
} from "../../pages/ModelInventory/style";

interface EmptyStateProps {
  /**
   * Custom message to display. If not provided, shows default message.
   */
  message?: string;
  /**
   * Alt text for the placeholder image
   */
  imageAlt?: string;
}

/**
 * Reusable EmptyState component for tables and lists
 * Displays a skeleton card stack when no data is available
 * Standardized height for consistent UI across FileManager and PolicyManager
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  message = "There is currently no data in this table.",
  imageAlt = "No data available"
}) => {

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        border: "1px solid #EEEEEE",
        borderRadius: "4px",
        padding: "60px 20px 80px 20px",
        gap: "20px",
        minHeight: 300,
        backgroundColor: "#f6f8fb",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
      role="img"
      aria-label={imageAlt}
    >
      <SkeletonCard />
      <Typography sx={emptyStateTextStyle}>
        {message}
      </Typography>
    </Stack>
  );
};

export default EmptyState;