import React from "react";
import { SxProps, Theme } from "@mui/material";
import {
  IBreadcrumbsCoreProps,
  IPageBreadcrumbsCoreProps,
} from "../../domain/types/breadcrumbs.types";

/**
 * Presentation adapter for Breadcrumbs component
 * Extends domain props with MUI-specific styling
 * Overrides unknown types from domain with React.ReactNode
 */
export interface IBreadcrumbsProps extends Omit<IBreadcrumbsCoreProps, 'separator'> {
  /** Custom separator icon (overrides domain unknown type) */
  separator?: React.ReactNode;
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

/**
 * Presentation adapter for IBreadcrumbItem
 * Overrides unknown types from domain with React.ReactNode
 */
export interface IBreadcrumbItemPresentation extends Omit<import("../../domain/types/breadcrumbs.types").IBreadcrumbItem, 'icon'> {
  /** Icon to display (overrides domain unknown type) */
  icon?: React.ReactNode;
}
