import React from "react";
import { Stack, Typography, Box } from "@mui/material";
import SkeletonCard from "../SkeletonCard";

interface EmptyStateProps {
  /**
   * Custom message to display. If not provided, shows default message.
   */
  message?: string;
  /**
   * Alt text for accessibility
   */
  imageAlt?: string;
  /**
   * Whether to show the soft spotlight halo effect on the skeleton card
   * @default false for table empty states, true for full-page empty states
   */
  showHalo?: boolean;
  /**
   * Whether to show border around the empty state container
   * @default false for table cells, true for standalone containers
   */
  showBorder?: boolean;
}

/**
 * Reusable EmptyState component for tables and lists
 * Displays a skeleton card stack when no data is available
 * All styling is encapsulated - no need to wrap with additional containers
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  message = "There is currently no data in this table.",
  imageAlt = "No data available",
  showHalo = false,
  showBorder = false,
}) => {
  return (
    <Stack
      alignItems="center"
      sx={{
        ...(showBorder && {
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          backgroundColor: "#FFFFFF",
        }),
        pt: "75px",
        pb: 16,
      }}
      role="img"
      aria-label={imageAlt}
    >
      <Box sx={{ mb: "20px" }}>
        <SkeletonCard showHalo={showHalo} />
      </Box>
      <Typography
        sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400, paddingX: 10 }}
      >
        {message}
      </Typography>
    </Stack>
  );
};

export default EmptyState;
