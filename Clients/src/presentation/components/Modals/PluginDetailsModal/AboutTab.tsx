/**
 * AboutTab - Displays plugin metadata, status, and permissions
 * Uses VerifyWise components and theme variables for consistent styling
 */

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import CompactChip from "../../Chip/CompactChip";
import { VWLink } from "../../Link";
import { AboutTabProps } from "./types";
import { getTypeChipConfig } from "./utils";
import {
  colors,
  spacing,
  typography,
  border,
} from "../../UserGuide/styles/theme";

const AboutTab: React.FC<AboutTabProps> = ({ plugin }) => {
  const typeColors = getTypeChipConfig(plugin.type);

  return (
    <Stack sx={{ gap: spacing.lg }}>
      {/* Type and Status */}
      <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: spacing.sm }}>
        <CompactChip
          label={plugin.type}
          size="medium"
          backgroundColor={typeColors.backgroundColor}
          textColor={typeColors.textColor}
        />
        <CompactChip
          label={plugin.installed ? "Installed" : "Not installed"}
          size="medium"
          variant={plugin.installed ? "success" : "default"}
        />
        {plugin.installed && (
          <CompactChip
            label={plugin.enabled ? "Enabled" : "Disabled"}
            size="medium"
            variant={plugin.enabled ? "success" : "warning"}
          />
        )}
        {plugin.isBuiltin && (
          <CompactChip
            label="Built-in"
            size="medium"
            backgroundColor="#E5E7EB"
            textColor={colors.text.secondary}
          />
        )}
      </Stack>

      {/* Description */}
      <Box>
        <Typography
          sx={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            mb: spacing.xs,
          }}
        >
          Description
        </Typography>
        <Typography
          sx={{
            fontSize: typography.fontSize.base,
            color: colors.text.muted,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {plugin.description}
        </Typography>
      </Box>

      {/* Metadata */}
      <Stack direction="row" sx={{ gap: spacing.xl }}>
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            Version
          </Typography>
          <Typography sx={{ fontSize: typography.fontSize.base, color: colors.text.muted }}>
            v{plugin.version}
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            Author
          </Typography>
          <Typography sx={{ fontSize: typography.fontSize.base, color: colors.text.muted }}>
            {plugin.author}
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            Plugin ID
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.base,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {plugin.id}
          </Typography>
        </Box>
      </Stack>

      {/* Detailed Description */}
      {plugin.detailedDescription && (
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            Details
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.base,
              color: colors.text.muted,
              lineHeight: typography.lineHeight.relaxed,
              whiteSpace: "pre-wrap",
            }}
          >
            {plugin.detailedDescription}
          </Typography>
        </Box>
      )}

      {/* Links */}
      {(plugin.homepage || plugin.repository || plugin.supportUrl) && (
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.sm,
            }}
          >
            Links
          </Typography>
          <Stack sx={{ gap: spacing.sm }}>
            {plugin.homepage && (
              <VWLink url={plugin.homepage} openInNewTab showIcon sx={{ fontSize: typography.fontSize.base }}>
                Homepage
              </VWLink>
            )}
            {plugin.repository && (
              <VWLink url={plugin.repository} openInNewTab showIcon sx={{ fontSize: typography.fontSize.base }}>
                Source code
              </VWLink>
            )}
            {plugin.supportUrl && (
              <VWLink url={plugin.supportUrl} openInNewTab showIcon sx={{ fontSize: typography.fontSize.base }}>
                Support
              </VWLink>
            )}
          </Stack>
        </Box>
      )}

      {/* Tags */}
      {plugin.tags && plugin.tags.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.sm,
            }}
          >
            Tags
          </Typography>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: spacing.sm }}>
            {plugin.tags.map((tag) => (
              <CompactChip
                key={tag}
                label={tag}
                size="small"
                backgroundColor="#F3F4F6"
                textColor={colors.text.muted}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Compatibility */}
      {plugin.compatibility && (plugin.compatibility.minCoreVersion || plugin.compatibility.maxCoreVersion) && (
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            Compatibility
          </Typography>
          <Typography sx={{ fontSize: typography.fontSize.base, color: colors.text.muted }}>
            {plugin.compatibility.minCoreVersion && `VerifyWise v${plugin.compatibility.minCoreVersion}`}
            {plugin.compatibility.minCoreVersion && plugin.compatibility.maxCoreVersion && " - "}
            {plugin.compatibility.maxCoreVersion && `v${plugin.compatibility.maxCoreVersion}`}
            {plugin.compatibility.minCoreVersion && !plugin.compatibility.maxCoreVersion && " or higher"}
          </Typography>
        </Box>
      )}

      {/* Permissions */}
      {plugin.permissions && plugin.permissions.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              mb: spacing.sm,
            }}
          >
            Permissions
          </Typography>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: spacing.sm }}>
            {plugin.permissions.map((permission) => (
              <Box
                key={permission}
                sx={{
                  fontSize: 11,
                  fontFamily: typography.fontFamily.mono,
                  backgroundColor: "#F3F4F6",
                  color: colors.text.muted,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: border.radius,
                  border: border.default,
                }}
              >
                {permission}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default AboutTab;
