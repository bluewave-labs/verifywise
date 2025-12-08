/**
 * PluginDetailsModal - Displays detailed information about a plugin
 *
 * Uses StandardModal as its base and provides a consistent layout
 * for showing plugin metadata, status, permissions, and configuration.
 */

import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import StandardModal from "../StandardModal";
import CompactChip from "../../Chip/CompactChip";
import { PluginDTO } from "../../../../application/repository/plugin.repository";

interface PluginDetailsModalProps {
  /** The plugin to display details for */
  plugin: PluginDTO | null;

  /** Controls whether the modal is visible */
  isOpen: boolean;

  /** Callback function called when modal should close */
  onClose: () => void;
}

/**
 * Get chip colors based on plugin type
 */
const getTypeChipConfig = (
  type: string
): { backgroundColor: string; textColor: string } => {
  switch (type) {
    case "framework":
      return { backgroundColor: "#E3F2FD", textColor: "#1565C0" };
    case "integration":
      return { backgroundColor: "#F3E8FF", textColor: "#7C3AED" };
    case "feature":
      return { backgroundColor: "#E6F4EA", textColor: "#138A5E" };
    case "reporting":
      return { backgroundColor: "#FFF8E1", textColor: "#795548" };
    default:
      return { backgroundColor: "#F3F4F6", textColor: "#6B7280" };
  }
};

const PluginDetailsModal: React.FC<PluginDetailsModalProps> = ({
  plugin,
  isOpen,
  onClose,
}) => {
  if (!plugin) return null;

  const typeColors = getTypeChipConfig(plugin.type);

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={plugin.name}
      description="Plugin information and configuration"
      cancelButtonText="OK"
      maxWidth="600px"
    >
      <Stack spacing={3}>
        {/* Type and Status */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
        </Stack>

        {/* Description */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 0.5 }}>
            Description
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#475467", lineHeight: 1.6 }}>
            {plugin.description}
          </Typography>
        </Box>

        {/* Metadata */}
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 0.5 }}>
              Version
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#475467" }}>
              v{plugin.version}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 0.5 }}>
              Author
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#475467" }}>
              {plugin.author}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 0.5 }}>
              Plugin ID
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#475467", fontFamily: "monospace" }}>
              {plugin.id}
            </Typography>
          </Box>
        </Stack>

        {/* Permissions */}
        {plugin.permissions && plugin.permissions.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 1 }}>
              Permissions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: "8px" }}>
              {plugin.permissions.map((permission) => (
                <Box
                  key={permission}
                  sx={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {permission}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Configuration (if installed and has config) */}
        {plugin.installed && plugin.config && Object.keys(plugin.config).length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 1 }}>
              Configuration
            </Typography>
            <Box
              sx={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "4px",
                padding: "12px",
              }}
            >
              {Object.entries(plugin.config).map(([key, value]) => (
                <Stack key={key} direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>
                    {key}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#344054", fontFamily: "monospace" }}>
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </StandardModal>
  );
};

export default PluginDetailsModal;
