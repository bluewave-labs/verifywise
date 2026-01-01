import { SxProps, Theme } from "@mui/material";
import { IVWLinkCoreProps } from "./interfaces/i.link";

/**
 * Presentation adapter for VWLink component
 * Extends domain props with MUI-specific styling
 */
export interface IVWLinkProps extends IVWLinkCoreProps {
  /** Custom styles using MUI's sx prop */
  sx?: SxProps<Theme>;
}
