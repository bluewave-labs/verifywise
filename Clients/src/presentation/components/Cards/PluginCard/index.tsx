import { Stack, Box, Typography, IconButton, Tooltip, Button, CircularProgress } from "@mui/material";
import { Trash2 as UninstallIcon, Download, Check, Puzzle } from "lucide-react";
import { VWLink } from "../../Link";

export interface PluginCardProps {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  type: string;
  icon?: string;
  installed: boolean;
  enabled: boolean;
  isBuiltin?: boolean;
  isProcessing?: boolean;
  /** Card variant: "settings" for plugin management, "marketplace" for browsing */
  variant?: "settings" | "marketplace";
  onInstall?: (id: string) => void;
  onUninstall?: (id: string) => void;
  onToggleEnabled?: (id: string) => void;
  onConfigure?: (id: string) => void;
}

/**
 * PluginCard component for displaying plugin information
 * Supports two variants:
 * - "settings": For plugin management (enable/disable, uninstall, configure)
 * - "marketplace": For browsing/installing (install button, installed badge)
 */
const PluginCard: React.FC<PluginCardProps> = ({
  id,
  name,
  description,
  version,
  author,
  authorUrl,
  icon,
  installed,
  enabled,
  isBuiltin = false,
  isProcessing = false,
  variant = "settings",
  onInstall,
  onUninstall,
  onToggleEnabled,
  onConfigure,
}) => {
  const isMarketplace = variant === "marketplace";

  return (
    <Box
      sx={{
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
        padding: "16px",
        background: enabled || isMarketplace ? "#FFFFFF" : "#FEFEFE",
        opacity: isProcessing ? 0.7 : 1,
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(19, 113, 91, 0.08)",
          background: enabled || isMarketplace ? "#FAFAFA" : "#F8F8F8",
        },
      }}
    >
      {/* Header with icon */}
      <Stack direction="row" alignItems="flex-start" spacing="12px" sx={{ mb: 2 }}>
        {/* Icon - supports SVG (inline) or base64 data URI (PNG/JPG) */}
        {icon ? (
          icon.startsWith("data:image/") ? (
            // Base64 encoded image (PNG, JPG, etc.)
            <Box
              component="img"
              src={icon}
              alt={`${name} icon`}
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "6px",
                objectFit: "contain",
              }}
            />
          ) : (
            // Inline SVG content
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": {
                  width: "100%",
                  height: "100%",
                },
              }}
              dangerouslySetInnerHTML={{ __html: icon }}
            />
          )
        ) : (
          <Box
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "6px",
              backgroundColor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Puzzle size={18} color="#13715B" />
          </Box>
        )}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>
            {name}
          </Typography>
        </Stack>
      </Stack>

      {/* Description */}
      <Typography
        sx={{
          fontSize: 13,
          color: "#666666",
          mb: 2,
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </Typography>

      {/* Info line: version | author | view details */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          fontSize: 11,
          color: "#999999",
          mb: 2,
          gap: "4px",
        }}
      >
        <Typography component="span" sx={{ fontSize: 11, color: "#999999" }}>
          v{version}
        </Typography>
        <Typography component="span" sx={{ fontSize: 11, color: "#d0d5dd" }}>
          |
        </Typography>
        {authorUrl ? (
          <VWLink
            url={authorUrl}
            openInNewTab={true}
            showUnderline={true}
            showIcon={false}
            sx={{ fontSize: 11 }}
          >
            by {author}
          </VWLink>
        ) : (
          <Typography component="span" sx={{ fontSize: 11, color: "#999999" }}>
            by {author}
          </Typography>
        )}
        {onConfigure && (
          <>
            <Typography component="span" sx={{ fontSize: 11, color: "#d0d5dd" }}>
              |
            </Typography>
            <VWLink
              onClick={() => onConfigure(id)}
              showUnderline={true}
              showIcon={false}
              sx={{ fontSize: 11 }}
            >
              View details
            </VWLink>
          </>
        )}
      </Stack>

      {/* Actions */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={1}
        sx={{ mt: "auto" }}
      >
        {isMarketplace ? (
          // Marketplace variant: Install button or Installed badge
          installed ? (
            <Button
              disabled
              startIcon={<Check size={14} />}
              sx={{
                height: 34,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "none",
                backgroundColor: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                borderRadius: "4px",
                px: "16px",
                "&.Mui-disabled": {
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                },
              }}
            >
              Installed
            </Button>
          ) : (
            <Button
              onClick={() => onInstall?.(id)}
              disabled={isProcessing}
              startIcon={
                isProcessing ? (
                  <CircularProgress size={14} sx={{ color: "#FFFFFF" }} />
                ) : (
                  <Download size={14} />
                )
              }
              sx={{
                height: 34,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "none",
                backgroundColor: "#13715B",
                color: "#FFFFFF",
                borderRadius: "4px",
                px: "16px",
                "&:hover": {
                  backgroundColor: "#0e5c47",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#13715B",
                  color: "#FFFFFF",
                  opacity: 0.7,
                },
              }}
            >
              {isProcessing ? "Installing..." : "Install"}
            </Button>
          )
        ) : (
          // Settings variant: Enable/Disable link, uninstall, or install link
          installed ? (
            <>
              <VWLink
                onClick={() => onToggleEnabled?.(id)}
                showUnderline={true}
                showIcon={false}
              >
                {enabled ? "Disable" : "Enable"}
              </VWLink>
              {/* Only show uninstall button for non-builtin plugins */}
              {!isBuiltin && (
                <Tooltip title="Uninstall">
                  <IconButton
                    size="small"
                    onClick={() => onUninstall?.(id)}
                    disabled={isProcessing}
                    disableRipple
                    sx={{
                      color: "#DC2626",
                      opacity: 0.6,
                      "&:hover": { backgroundColor: "#FEF2F2", opacity: 1 },
                    }}
                  >
                    <UninstallIcon size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <VWLink
              onClick={() => onInstall?.(id)}
              showUnderline={true}
              showIcon={false}
            >
              {isBuiltin ? "Enable" : "Install"}
            </VWLink>
          )
        )}
      </Stack>
    </Box>
  );
};

export default PluginCard;
