/**
 * ChangelogTab - Displays version history
 * Uses VerifyWise theme variables for consistent styling
 */

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { ChangelogTabProps } from "./types";
import {
  colors,
  spacing,
  typography,
} from "../../UserGuide/styles/theme";

const ChangelogTab: React.FC<ChangelogTabProps> = ({ plugin }) => {
  if (!plugin.changelog || plugin.changelog.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ fontSize: typography.fontSize.md, color: colors.text.muted }}>
          No changelog available for this plugin.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ gap: spacing.lg }}>
      {plugin.changelog.map((entry, index) => (
        <Box key={index}>
          <Stack direction="row" alignItems="center" sx={{ gap: spacing.lg, mb: spacing.xs }}>
            <Typography
              sx={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.secondary,
              }}
            >
              v{entry.version}
            </Typography>
            {entry.date && (
              <Typography sx={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            )}
          </Stack>
          {entry.name && (
            <Typography
              sx={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.muted,
                mb: spacing.sm,
              }}
            >
              {entry.name}
            </Typography>
          )}
          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2.5,
              "& li": {
                fontSize: typography.fontSize.base,
                color: colors.text.muted,
                lineHeight: typography.lineHeight.relaxed,
                mb: spacing.xs,
              },
            }}
          >
            {entry.changes.map((change, changeIndex) => (
              <li key={changeIndex}>{change}</li>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

export default ChangelogTab;
