import { SxProps, Theme } from "@mui/material";

// Back button
export const backButton: SxProps<Theme> = {
  color: "#344054",
  fontSize: "13px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
};

// Plugin icon placeholder
export const pluginIconPlaceholder = (pluginKey: string, category?: string): SxProps<Theme> => ({
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    pluginKey === "risk-import"
      ? "rgba(16, 185, 129, 0.1)"
      : category === "data_management"
      ? "rgba(139, 92, 246, 0.1)"
      : "rgba(99, 102, 241, 0.1)",
  borderRadius: "12px",
});

// Status chip
export const installedStatusChip: SxProps<Theme> = {
  fontSize: "11px",
  height: 24,
  borderRadius: "4px",
  backgroundColor: "rgba(34, 197, 94, 0.1)",
  color: "#16a34a",
  border: "1px solid rgba(34, 197, 94, 0.2)",
  fontWeight: 500,
};

// Install button
export const installButton: SxProps<Theme> = {
  backgroundColor: "#13715B",
  textTransform: "none",
  fontSize: "13px",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#0f5a47",
  },
};

// Uninstall button
export const uninstallButton: SxProps<Theme> = {
  textTransform: "none",
  fontSize: "13px",
  fontWeight: 500,
  borderColor: "#dc2626",
  color: "#dc2626",
  "&:hover": {
    backgroundColor: "rgba(220, 38, 38, 0.04)",
    borderColor: "#dc2626",
  },
};

// Form field label
export const formFieldLabel: SxProps<Theme> = {
  mb: 0.75,
  color: "#344054",
};

// Test connection button
export const testConnectionButton: SxProps<Theme> = {
  borderColor: "#13715B",
  color: "#13715B",
  textTransform: "none",
  fontSize: "13px",
  fontWeight: 500,
  "&:hover": {
    borderColor: "#0f5a47",
    backgroundColor: "rgba(19, 113, 91, 0.04)",
  },
  "&:disabled": {
    borderColor: "#d0d5dd",
    color: "#98a2b3",
  },
};

// Save configuration button
export const saveConfigButton: SxProps<Theme> = {
  backgroundColor: "#13715B",
  textTransform: "none",
  fontSize: "13px",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#0f5a47",
  },
  "&:disabled": {
    backgroundColor: "#d0d5dd",
  },
};

// Text field styling
export const configTextField: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    fontSize: "13px",
    backgroundColor: "white",
  },
};

// Select field styling
export const configSelect: SxProps<Theme> = {
  fontSize: "13px",
  backgroundColor: "white",
};

// Checkbox styling
export const configCheckbox: SxProps<Theme> = {
  color: "#13715B",
  "&.Mui-checked": {
    color: "#13715B",
  },
};
