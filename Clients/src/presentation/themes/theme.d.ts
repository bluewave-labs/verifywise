/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Palette,
  PaletteOptions,
  TypeBackground,
  TypeText,
  PaletteColor,
  PaletteColorOptions,
  Shape,
  ShapeOptions,
} from "@mui/material/styles";
/* eslint-enable @typescript-eslint/no-unused-vars */

declare module "@mui/material/styles" {
  interface ChartPalette {
    blue: string;
    amber: string;
    purple: string;
    emerald: string;
    red: string;
    darkRed: string;
    darkEmerald: string;
    orange: string;
    indigo: string;
    slate: string;
  }
  interface Palette {
    border: {
      light: string;
      dark: string;
      medium: string;
      input: string;
    };
    background: TypeBackground;
    text: TypeText;
    status: StatusPalette;
    other: {
      icon: string;
      line: string;
      fill: string;
      grid: string;
    };
    unresolved: PaletteColor;
    chart: ChartPalette;
  }
  interface PaletteOptions {
    border?: {
      light: string;
      dark: string;
      medium?: string;
      input?: string;
    };
    background?: TypeBackground;
    text?: TypeText;
    status?: StatusPaletteOptions;
    other?: {
      icon?: string;
      line?: string;
      fill?: string;
      grid?: string;
    };
    unresolved?: PaletteColorOptions;
    chart?: ChartPalette;
  }
  interface TypeBackground {
    main: string;
    alt: string;
    modal: string;
    fill: string;
    accent: string;
    hover: string;
    subtle: string;
  }
  interface TypeText {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    muted: string;
    dark: string;
    heading: string;
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
    inactive: PaletteColor;
  }
  interface StatusPaletteOptions {
    info?: PaletteColorOptions;
    success?: PaletteColorOptions;
    error?: PaletteColorOptions;
    warning?: PaletteColorOptions;
    inactive?: PaletteColorOptions;
  }
  interface Shape {
    borderRadius: number | string;
  }
  interface ShapeOptions {
    borderRadius?: number | string;
  }
  interface Shadows {
    boxShadow: string;
  }
  interface ThemeOptions {
    boxShadow?: string;
  }
  interface Theme {
    boxShadow: string;
  }
}
