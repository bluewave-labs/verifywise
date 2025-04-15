/**
 * This file has similar use as our main theme files, but it is temporary, with purpose of gathering
 * all the similar values, merging them and then adding them to the main theme files
 */

import { alertStyles } from "./alerts";
import { tableStyles } from "./tables";

const backgroundColors = {
  primary: "#4C7DE7",
  error: "#DB504A",
};

const borderColors = {
  primary: "#175CD3",
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

const buttons = {
  primary: {
    contained: {
      height: 34,
      fontSize: fontSizes.medium,
      backgroundColor: backgroundColors.primary,
      boxShadow: "none",
      textTransform: "Inherit",
      borderRadius: "4px",
      border: `1px solid ${borderColors.primary}`,
      "&:hover": {
        boxShadow: shadowEffect.NoShadow,
      },
    },
    outlined: {},
    text: {
      "&:hover": {
        boxShadow: shadowEffect.NoShadow,
        backgroundColor: "#fff",
      },
    },
  },
  secondary: {
    contained: {},
    outlined: {},
    text: {},
  },
  success: {
    contained: {},
    outlined: {},
    text: {},
  },
  warning: {
    contained: {},
    outlined: {},
    text: {},
  },
  error: {
    contained: {
      height: 34,
      fontSize: fontSizes.medium,
      backgroundColor: backgroundColors.error,
      boxShadow: "none",
      textTransform: "Inherit",
      borderRadius: "4px",
      border: `1px solid ${borderColors.error}`,
      "&:hover": {
        boxShadow: shadowEffect.NoShadow,
        backgroundColor: "#d32f2f",
      },
    },
    outlined: {},
    text: {},
  },
  info: {
    contained: {},
    outlined: {},
    text: {},
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
