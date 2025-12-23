import { SxProps, Theme } from "@mui/material";
import { AlertCorProps } from "../../domain/types/alert.types";

/**
 * Presentation adapter for Alert component
 * Extends domain props with MUI-specific styling
 */

export interface AlertProps extends AlertCorProps {
  sx?: SxProps<Theme> | undefined;
}
