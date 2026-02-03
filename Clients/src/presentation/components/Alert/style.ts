import type { SxProps, Theme } from "@mui/material";
import type { CSSProperties } from "react";

/**
 * Styles for the IconButton component.
 *
 * @param {boolean} hasIcon - Whether the alert has an icon.
 * @returns {SxProps<Theme>} The styles for the IconButton component.
 */
export const iconButtonStyles = (hasIcon: boolean): SxProps<Theme> => ({
  alignSelf: "flex-start",
  ml: "auto",
  mr: -0.625, // -5px
  mt: hasIcon ? -0.625 : 0, // -5px
  "&:focus-visible": {
    outline: "2px solid currentColor",
    outlineOffset: 2,
  },
  "&:hover": {
    backgroundColor: "transparent",
  },
});

/**
 * Styles for the CloseIcon component.
 *
 * @param {string} text - The color of the close icon.
 * @returns {CSSProperties} The styles for the CloseIcon component.
 */
export const closeIconStyles = (text: string): CSSProperties => ({
  fontSize: 20,
  fill: text,
});
