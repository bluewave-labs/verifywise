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

const border = "#d0d5dd";

const dark = createTheme({
  spacing: 2,
  palette: {
    primary: { main: "#1570ef" },
    secondary: { main: "#2D2D33" },
    border: border,
    background: background,
    text: text,
    status: {
      info: {
        text: text.primary,
        main: text.secondary,
        bg: background.main,
        light: background.main,
        border: "#36363e",
      },
      success: {
        text: "#079455",
        main: "#45bb7a",
        light: "#1c4428",
        bg: "#12261e",
      },
      error: {
        text: "#f04438",
        main: "#d32f2f",
        light: "#542426",
        bg: "#301a1f",
        dark: "#932020",
        border: "#f04438",
      },
      warning: {
        text: "#e88c30",
        main: "#FF9F00",
        light: "#624711",
        bg: "#262115",
        border: "#e88c30",
      },
    },
    other: {
      icon: "#e6e6e6",
      line: "#27272a",
      fill: "#18181a",
      grid: "#454546",
    },
  },
  shape: {
    borderRadius: 2,
  },
});

export default dark;
