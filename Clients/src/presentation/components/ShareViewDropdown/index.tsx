import React, { useState } from "react";
import {
  Box,
  Popover,
  Typography,
  Switch,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Copy,
  RotateCw,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

/**
 * Configuration for share view settings
 */
export interface ShareViewSettings {
  /** Whether to share all fields in the view */
  shareAllFields: boolean;
  /** Whether to allow data export */
  allowDataExport: boolean;
  /** Whether to allow viewers to open individual records */
  allowViewersToOpenRecords: boolean;
  /** Whether to display the toolbar */
  displayToolbar: boolean;
  /** Whether to restrict access with a passcode */
  restrictAccessWithPasscode: boolean;
}

/**
 * Props for the ShareViewDropdown component
 */
export interface ShareViewDropdownProps {
  /** The shareable link URL */
  shareableLink?: string;
  /** Whether the share view is enabled */
  enabled?: boolean;
  /** Initial settings for the share view */
  initialSettings?: Partial<ShareViewSettings>;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Callback when settings change */
  onSettingsChange?: (settings: ShareViewSettings) => void;
  /** Callback when the link is copied */
  onCopyLink?: (link: string) => void;
  /** Callback when the link refresh is requested */
  onRefreshLink?: () => void;
  /** Callback when opening the link in a new tab */
  onOpenLink?: (link: string) => void;
  /** Callback when help is requested */
  onHelpClick?: () => void;
  /** The anchor element to position the dropdown */
  anchorEl: HTMLElement | null;
  /** Callback when the dropdown should close */
  onClose: () => void;
}

const defaultSettings: ShareViewSettings = {
  shareAllFields: false,
  allowDataExport: true,
  allowViewersToOpenRecords: false,
  displayToolbar: true,
  restrictAccessWithPasscode: false,
};

/**
 * ShareViewDropdown component for sharing table views
 * Provides options to generate shareable links and configure view permissions
 */
const ShareViewDropdown: React.FC<ShareViewDropdownProps> = ({
  shareableLink = "https://app.smartsuite.com/shared/snb5x1rl/hn...",
  enabled = false,
  initialSettings = {},
  onEnabledChange,
  onSettingsChange,
  onCopyLink,
  onRefreshLink,
  onOpenLink,
  onHelpClick,
  anchorEl,
  onClose,
}) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [settings, setSettings] = useState<ShareViewSettings>({
    ...defaultSettings,
    ...initialSettings,
  });

  const handleToggleEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = event.target.checked;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
  };

  const handleSettingChange = (key: keyof ShareViewSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    onCopyLink?.(shareableLink);
  };

  const handleRefreshLink = () => {
    onRefreshLink?.();
  };

  const handleOpenLink = () => {
    window.open(shareableLink, "_blank");
    onOpenLink?.(shareableLink);
  };

  const open = Boolean(anchorEl);
  const id = open ? "share-view-dropdown" : undefined;

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        mt: 1,
        "& .MuiPopover-paper": {
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          overflow: "visible",
          backgroundColor: "#fff",
          width: "420px",
        },
      }}
    >
      <Box
        role="dialog"
        aria-label="Share view settings"
        sx={{
          p: 0,
          width: "100%",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000",
                  mb: 0.5,
                }}
              >
                Share View
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "13px",
                  color: "#666",
                  lineHeight: 1.4,
                }}
              >
                Send a view only link to anyone or embed this report on a
                website
              </Typography>
            </Box>
            <Switch
              checked={isEnabled}
              onChange={handleToggleEnabled}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#f97316",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#f97316",
                },
              }}
            />
          </Box>
        </Box>

        {/* Shareable Link Section */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ExternalLink size={18} color="#666" />
            <Typography
              variant="subtitle2"
              sx={{
                ml: 1,
                fontSize: "14px",
                fontWeight: 600,
                color: "#000",
              }}
            >
              Shareable Link
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#fff5ee",
              border: "1px solid #fed7aa",
              borderRadius: "6px",
              p: 1.5,
              gap: 1,
            }}
          >
            <Copy
              size={18}
              color="#f97316"
              style={{ flexShrink: 0, cursor: "pointer" }}
              onClick={handleCopyLink}
            />
            <TextField
              value={shareableLink}
              fullWidth
              variant="standard"
              InputProps={{
                disableUnderline: true,
                readOnly: true,
                sx: {
                  fontSize: "13px",
                  color: "#666",
                  "& input": {
                    cursor: "default",
                  },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleRefreshLink}
              sx={{
                p: 0.5,
                color: "#f97316",
                "&:hover": {
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                },
              }}
            >
              <RotateCw size={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleOpenLink}
              sx={{
                p: 0.5,
                color: "#f97316",
                "&:hover": {
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                },
              }}
            >
              <ExternalLink size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* Settings Section */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#000",
              }}
            >
              ⚙️ Settings
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <SettingItem
              label="Share all fields"
              checked={settings.shareAllFields}
              onChange={() => handleSettingChange("shareAllFields")}
              helpText="Include all fields in the shared view"
            />
            <SettingItem
              label="Allow data to be exported"
              checked={settings.allowDataExport}
              onChange={() => handleSettingChange("allowDataExport")}
              helpText="Enable data export functionality for viewers"
            />
            <SettingItem
              label="Allow viewers to open records"
              checked={settings.allowViewersToOpenRecords}
              onChange={() => handleSettingChange("allowViewersToOpenRecords")}
              helpText="Let viewers open and view individual records"
            />
            <SettingItem
              label="Display toolbar"
              checked={settings.displayToolbar}
              onChange={() => handleSettingChange("displayToolbar")}
              helpText="Show the toolbar in the shared view"
            />
            <SettingItem
              label="Restrict access with a passcode"
              checked={settings.restrictAccessWithPasscode}
              onChange={() =>
                handleSettingChange("restrictAccessWithPasscode")
              }
              helpText="Require a passcode to access the shared view"
            />
          </Box>
        </Box>

        <Divider />

        {/* Help Section */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#f9fafb",
            },
          }}
          onClick={onHelpClick}
        >
          <HelpCircle size={20} color="#f97316" />
          <Typography
            sx={{
              ml: 1,
              fontSize: "14px",
              fontWeight: 500,
              color: "#f97316",
            }}
          >
            Need Help
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
};

/**
 * Individual setting item with checkbox and help icon
 */
interface SettingItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  helpText: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  checked,
  onChange,
  helpText,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={onChange}
            sx={{
              color: "#d1d5db",
              "&.Mui-checked": {
                color: "#f97316",
              },
            }}
          />
        }
        label={
          <Typography
            sx={{
              fontSize: "13px",
              color: "#374151",
            }}
          >
            {label}
          </Typography>
        }
        sx={{ flexGrow: 1, mr: 1 }}
      />
      <Tooltip title={helpText} arrow placement="left">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "#e5e7eb",
            cursor: "help",
            "&:hover": {
              backgroundColor: "#d1d5db",
            },
          }}
        >
          <HelpCircle size={14} color="#6b7280" />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default ShareViewDropdown;
