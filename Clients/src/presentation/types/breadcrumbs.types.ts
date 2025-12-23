import { SxProps, Theme } from "@mui/material";
import {
  IBreadcrumbsCoreProps,
  IPageBreadcrumbsCoreProps,
} from "../../domain/types/breadcrumbs.types";

/**
 * Presentation adapter for Breadcrumbs component
 * Extends domain props with MUI-specific styling
 */
export interface IBreadcrumbsProps extends IBreadcrumbsCoreProps {
  /** Custom styles using MUI's sx prop */
  sx?: SxProps<Theme>;
}

/**
 * Presentation adapter for PageBreadcrumbs component
 * Extends domain props with MUI-specific styling
 */
export interface IPageBreadcrumbsProps extends IPageBreadcrumbsCoreProps {
  /** Additional styling with proper MUI typing */
  sx?: SxProps<Theme>;
}
