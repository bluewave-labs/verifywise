import type { FC } from "react";
import { Stack, Typography, Box, useTheme } from "@mui/material";
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
export const EmptyState: FC<EmptyStateProps> = ({
  message = "There is currently no data in this table.",
  imageAlt = "No data available",
  showHalo = false,
  showBorder = false,
}) => {
  const theme = useTheme();

  return (
    <Stack
      alignItems="center"
      sx={{
        ...(showBorder && {
          border: `1px solid ${theme.palette.border.dark}`,
          borderRadius: "4px",
          backgroundColor: theme.palette.background.main,
        }),
        pt: "75px",
        pb: 16,
      }}
      role="status"
      aria-label={imageAlt}
    >
      <Box sx={{ mb: 10 }}>
        <SkeletonCard showHalo={showHalo} />
      </Box>
      <Typography
        sx={{ fontSize: theme.typography.fontSize, color: theme.palette.text.accent, fontWeight: 400, paddingX: 10 }}
      >
        {message}
      </Typography>
    </Stack>
  );
};
