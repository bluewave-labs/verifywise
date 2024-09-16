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
    border: border,
    background: background,
    text: text,
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
