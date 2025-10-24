/**
 * This file has similar use as our main theme files, but it is temporary, with purpose of gathering
 * all the similar values, merging them and then adding them to the main theme files
 */

import { alertStyles } from "./alerts";
import { tableStyles } from "./tables";

const backgroundColors = {
  primary: "#13715B",
  error: "#DB504A",
};

const borderColors = {
  primary: "#13715B",
  error: "#DB504A",
};

const textColors = {
  theme: "#0f604d",
  error: "#DB504A",
};

const effects = {
  rippleEffect: false,
};

const shadowEffect = {
  NoShadow: "none",
  primary:
    "0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)",
};

const fontSizes = {
  small: "11px",
  medium: "13px",
  large: "16px",
};

// Standardized button sizes
const buttonSizes = {
  small: {
    height: 28,
    fontSize: "12px",
    padding: "6px 12px",
    minHeight: 28,
  },
  medium: {
    height: 32,
    fontSize: "13px",
    padding: "8px 16px",
    minHeight: 32,
  },
  large: {
    height: 40,
    fontSize: "14px",
    padding: "10px 20px",
    minHeight: 40,
  },
};

// Standardized color palette
const colors = {
  primary: "#13715B",
  primaryHover: "#0f604d",
  secondary: "#6B7280",
  secondaryHover: "#4B5563",
  success: "#059669",
  successHover: "#047857",
  warning: "#D97706",
  warningHover: "#B45309",
  error: "#DB504A",
  errorHover: "#B91C1C",
  info: "#3B82F6",
  infoHover: "#2563EB",
};

const buttons = {
  // Primary buttons - main actions
  primary: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.primary,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.primaryHover,
        boxShadow: "0px 2px 4px rgba(19, 113, 91, 0.2)",
      },
      "&:active": {
        backgroundColor: colors.primaryHover,
        boxShadow: "none",
      },
      "&.Mui-disabled": {
        backgroundColor: "#E5E7EB",
        color: "#9CA3AF",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.primary}08`,
        borderColor: colors.primaryHover,
        boxShadow: "0px 1px 2px rgba(19, 113, 91, 0.1)",
      },
      "&:active": {
        backgroundColor: `${colors.primary}12`,
      },
      "&.Mui-disabled": {
        borderColor: "#E5E7EB",
        color: "#9CA3AF",
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.primary,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.primary}08`,
        boxShadow: "none",
      },
      "&:active": {
        backgroundColor: `${colors.primary}12`,
      },
      "&.Mui-disabled": {
        color: "#9CA3AF",
      },
    },
  },
  // Secondary buttons - utility actions
  secondary: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.secondary,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.secondaryHover,
        boxShadow: "0px 2px 4px rgba(107, 114, 128, 0.2)",
      },
      "&:active": {
        backgroundColor: colors.secondaryHover,
        boxShadow: "none",
      },
      "&.Mui-disabled": {
        backgroundColor: "#E5E7EB",
        color: "#9CA3AF",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.secondary,
      border: `1px solid ${colors.secondary}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.secondary}08`,
        borderColor: colors.secondaryHover,
      },
      "&:active": {
        backgroundColor: `${colors.secondary}12`,
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.secondary,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.secondary}08`,
      },
      "&:active": {
        backgroundColor: `${colors.secondary}12`,
      },
    },
  },
  // Success buttons
  success: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.success,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.successHover,
        boxShadow: "0px 2px 4px rgba(5, 150, 105, 0.2)",
      },
      "&:active": {
        backgroundColor: colors.successHover,
        boxShadow: "none",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.success,
      border: `1px solid ${colors.success}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.success}08`,
        borderColor: colors.successHover,
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.success,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.success}08`,
      },
    },
  },
  // Warning buttons
  warning: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.warning,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.warningHover,
        boxShadow: "0px 2px 4px rgba(217, 119, 6, 0.2)",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.warning,
      border: `1px solid ${colors.warning}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.warning}08`,
        borderColor: colors.warningHover,
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.warning,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.warning}08`,
      },
    },
  },
  // Error buttons (destructive actions)
  error: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.error,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.errorHover,
        boxShadow: "0px 2px 4px rgba(219, 80, 74, 0.2)",
      },
      "&:active": {
        backgroundColor: colors.errorHover,
        boxShadow: "none",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.error,
      border: `1px solid ${colors.error}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.error}08`,
        borderColor: colors.errorHover,
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.error,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.error}08`,
      },
    },
  },
  // Info buttons
  info: {
    contained: {
      ...buttonSizes.medium,
      backgroundColor: colors.info,
      color: "#fff",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      border: "none",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: colors.infoHover,
        boxShadow: "0px 2px 4px rgba(59, 130, 246, 0.2)",
      },
    },
    outlined: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.info,
      border: `1px solid ${colors.info}`,
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.info}08`,
        borderColor: colors.infoHover,
      },
    },
    text: {
      ...buttonSizes.medium,
      backgroundColor: "transparent",
      color: colors.info,
      border: "none",
      boxShadow: "none",
      textTransform: "inherit",
      borderRadius: "4px",
      fontWeight: 500,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: `${colors.info}08`,
      },
    },
  },
};

const textStyles = {
  pageTitle: {
    color: "#1A1919",
    fontSize: fontSizes.large,
    fontWeight: 600,
  },
  pageDescription: {
    color: "#344054",
    fontSize: fontSizes.medium,
  },
};

const dropDownStyles = {
  primary: {
    width: 190,
    "& ul": { p: "5px" },
    "& li": {
      m: 0,
      fontSize: 13,
      "& .MuiTouchRipple-root": {
        display: "none",
      },
    },
    "& li:hover": { borderRadius: 4 },
    boxShadow: shadowEffect.primary,
  },
};

const iconButtons = {
  "&:focus": {
    outline: "none",
  },
  "& svg path": {
    stroke: "#667085",
  },
  "&:hover": {
    backgroundColor: "transparent",
  },
};

const singleTheme = {
  effects,
  shadowEffect,
  textTransform: "inherit",
  buttons,
  borderRadius: "4px",
  fontSizes,
  textStyles,
  tableStyles,
  dropDownStyles,
  iconButtons,
  alertStyles,
  textColors,
};

export default singleTheme;
