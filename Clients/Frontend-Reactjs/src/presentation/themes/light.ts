import { createTheme } from "@mui/material/styles";

const text = {
  primary: "#1c2130",
  secondary: "#344054",
  tertiary: "#475467",
  accent: "#838c99",
};

const background = {
  main: "#FFFFFF",
  alt: "#FCFCFD",
  fill: "#F4F4F4",
  accent: "#f9fafb",
};

const border = "#eaecf0";

const shadow =
  "0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

const light = createTheme({
  spacing: 2,
  palette: {
    primary: { main: "#1570EF" },
    secondary: { main: "#F4F4F4", dark: "#e3e3e3", contrastText: "#475467" },
    border: border,
    background: background,
    text: text,
    status: {
      info: {
        text: text.primary,
        main: text.tertiary,
        bg: background.main,
        light: background.main,
        border: "#27272a",
      },
      success: {
        text: "#079455",
        main: "#17b26a",
        light: "#d4f4e1",
        bg: "#ecfdf3",
        border: "#079455",
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
    },
    other: {
      icon: "#667085",
      line: "#d6d9dd",
      fill: "#e3e3e3",
      grid: "#a2a3a3",
    },
  },
  shape: {
    borderRadius: 2,
  },
  boxShadow: shadow,
});

export default light;
