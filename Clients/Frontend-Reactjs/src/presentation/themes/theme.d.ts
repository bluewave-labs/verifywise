import {
  Palette,
  PaletteOptions,
  TypeBackground,
  TypeText,
} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    border: string;
    other: {
      icon: string;
      line: string;
      fill: string;
      grid: string;
    };
  }
  interface PaletteOptions {
    border?: string;
    other?: {
      icon?: string;
      line?: string;
      fill?: string;
      grid?: string;
    };
  }
  interface TypeBackground {
    main: string;
    alt: string;
    fill: string;
    accent: string;
  }
  interface TypeText {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  }
}
