/**
 * @fileoverview LoadingState Component
 *
 * Loading state component for the deadline warning box.
 * Displays skeleton loaders and loading messages during data fetch.
 *
 * @package components/DeadlineWarningBox
 */

import React from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingStateProps } from "./types";

/**
 * Loading state component with skeleton and loading indicator
 *
 * @param props - Component props
 * @returns JSX element
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading deadline information...",
  showSkeleton = true,
  skeletonCount = 3,
}) => {
  const theme = useTheme();

  // Skeleton chip component
  const SkeletonChip: React.FC<{ index: number }> = ({ index }) => (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadius * 2,
        minWidth: 80,
        height: 32,
        animation: `pulse 1.5s ease-in-out ${index * 0.2}s infinite`,
        "@keyframes pulse": {
          "0%": {
            opacity: 0.6,
          },
          "50%": {
            opacity: 1,
          },
          "100%": {
            opacity: 0.6,
          },
        },
      }}
    />
  );

  return (
    <Box
      sx={{
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
      }}
    >
      <Stack direction="column" spacing={2}>
        {/* Loading header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
        >
          <CircularProgress size={16} thickness={4} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            {message}
          </Typography>
        </Stack>

        {/* Skeleton chips */}
        {showSkeleton && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            {Array.from({ length: skeletonCount }, (_, index) => (
              <SkeletonChip key={index} index={index} />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default LoadingState;