/**
 * This file has similar use as our main theme files, but it is temporary, with purpose of gathering
 * all the similar values, merging them and then adding them to the main theme files
 */

const backgroundColors = {
  primary: "#4C7DE7",
};

const borderColors = {
  primary: "#175CD3",
};

const textColors = {
  theme: "#0f604d",
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
    height: 34,
    fontSize: fontSizes.medium,
    backgroundColor: backgroundColors.primary,
    borderRadius: "4px",
    border: `1px solid ${borderColors.primary}`,
    "&:hover": {
      boxShadow: shadowEffect.NoShadow,
      backgroundColor: "#175CD3 ",
    },
    fontSizes: fontSizes.medium,
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

const tableStyles = {
  primary: {
    frame: {
      border: "1px solid #EEEEEE",
      borderRadius: "4px",
      "& td, & th": {
        border: 0,
      },
    },
    header: {
      backgroundColors: "#fafafa",
      row: {
        textTransform: "uppercase",
        borderBottom: "1px solid #EEEEEE",
      },
      cell: {
        color: "#a1afc6",
        fontWeight: 400,
        paddingLeft: "16px",
      },
    },
    body: {
      row: {
        textTransform: "capitalize",
        borderBottom: "1px solid #EEEEEE",
      },
      cell: {
        fontSize: fontSizes.medium,
        paddingY: "12px",
      },
    },
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
    "& li:last-of-type": {
      color: "#d32f2f",
    },
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

const alertStyles = {
  info: {
    text: "#0288d1",
    main: "#475467",
    bg: "#e5f6fd",
    light: "#FFFFFF",
    border: "#d0d5dd",
  },
  success: {
    text: "#079455",
    main: "#17b26a",
    light: "#d4f4e1",
    bg: "#ecfdf3",
  },
  error: {
    text: "#f04438",
    main: "#d32f2f",
    light: "#fbd1d1",
    bg: "#f9eced",
    border: "#f04438",
  },
  warning: {
    text: "#DC6803",
    main: "#fdb022",
    light: "#ffecbc",
    bg: "#fffcf5",
    border: "#fec84b",
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
