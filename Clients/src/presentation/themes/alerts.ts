const lightAlertStyles = {
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
    border: "#12715B",
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

const darkAlertStyles = {
  info: {
    text: "#63b3ed",
    main: "#8b909a",
    bg: "#141720",
    light: "#0f1117",
    border: "#3a3d45",
  },
  success: {
    text: "#34d399",
    main: "#22c55e",
    light: "#14532d",
    bg: "#052e16",
    border: "#1a9e7e",
  },
  error: {
    text: "#f87171",
    main: "#ef4444",
    light: "#7f1d1d",
    bg: "#450a0a",
    border: "#f87171",
  },
  warning: {
    text: "#fbbf24",
    main: "#f59e0b",
    light: "#78350f",
    bg: "#451a03",
    border: "#d97706",
  },
};

export const getAlertStyles = (mode: "light" | "dark" = "light") =>
  mode === "dark" ? darkAlertStyles : lightAlertStyles;

/** @deprecated Use getAlertStyles(mode) instead for theme-aware colors */
export const alertStyles = lightAlertStyles;
