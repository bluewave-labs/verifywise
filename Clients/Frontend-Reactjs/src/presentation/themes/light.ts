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

const light = createTheme({
  spacing: 2,
  palette: {
    primary: { main: "#1570EF" },
    border: border,
    background: background,
    text: text,
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
});

export default light;
