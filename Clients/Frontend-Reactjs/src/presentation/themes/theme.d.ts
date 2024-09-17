import {
  Palette,
  PaletteOptions,
  TypeBackground,
  TypeText,
  PaletteColor,
  PaletteColorOptions,
  Shape,
  ShapeOptions,
} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    border: string;
    background: TypeBackground;
    text: TypeText;
    status: StatusPalette;
    other: {
      icon: string;
      line: string;
      fill: string;
      grid: string;
    };
  }
  interface PaletteOptions {
    border?: string;
    background?: TypeBackground;
    text?: TypeText;
    status?: StatusPaletteOptions;
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
  interface PaletteColor {
    text?: string;
    main?: string;
    light?: string;
    dark?: string;
    bg?: string;
    border?: string;
  }
  interface PaletteColorOptions {
    text?: string;
    main?: string;
    light?: string;
    dark?: string;
    bg?: string;
    border?: string;
  }
  interface StatusPalette {
    info: PaletteColor;
    success: PaletteColor;
    error: PaletteColor;
    warning: PaletteColor;
  }
  interface StatusPaletteOptions {
    info?: PaletteColorOptions;
    success?: PaletteColorOptions;
    error?: PaletteColorOptions;
    warning?: PaletteColorOptions;
  }
  interface Shape {
    borderRadius: number | string;
  }
  interface ShapeOptions {
    borderRadius?: number | string;
  }
  interface Shadows {
    boxShadow: string; // Add this line
  }
  interface ThemeOptions {
    boxShadow?: string; // Add this line
  }
  interface Theme {
    boxShadow: string; // Add this line
  }
}
