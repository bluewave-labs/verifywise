/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Developer Note:
 * ESLint rules disabled intentionally to allow use of flexible types and unused variables during
 * theme-based dynamic prop handling and ref forwarding.
 */
/**
 * This file is currently in use
 */

import React, { memo, useCallback } from "react";
import { Button, CircularProgress, Box } from "@mui/material";
import { ButtonProps, SxProps, Theme } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { ICustomizableButtonProps } from "../../../../domain/interfaces/i.button";

/**
 * CustomizableButton component
 *
 * A highly customizable button component that extends Material-UI Button with additional features.
 * Supports various styles, loading states, icons, and accessibility features.
 *
 * Features:
 * - Theme-based styling with customizable variants
 * - Loading state with spinner
 * - Icon positioning with proper spacing
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation support
 * - Performance optimized with memoization
 *
 * @component
 * @example
 * ```tsx
 * <CustomizableButton
 *   variant="contained"
 *   size="medium"
 *   color="primary"
 *   loading={false}
 *   startIcon={<SaveIcon />}
 *   onClick={handleSave}
 *   ariaLabel="Save document"
 * >
 *   Save Document
 * </CustomizableButton>
 * ```
 */

/**
 * Props interface for the CustomizableButton component
 */
export interface CustomizableButtonProps {
  /** The variant of the button */
  variant?: "contained" | "outlined" | "text";
  /** The size of the button */
  size?: "small" | "medium" | "large";
  /** If true, the button will be disabled */
  isDisabled?: boolean;
  /** If true, the button will be styled as a link */
  isLink?: boolean;
  /** The color theme of the button */
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  /** Click event handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Custom styles using MUI's sx prop */
  sx?: SxProps<Theme>;
  /** Button text content (deprecated: use children instead) */
  text?: string;
  /** Icon element (deprecated: use startIcon or endIcon instead) */
  icon?: React.ReactNode;
  /** Icon to display at the start of the button */
  startIcon?: React.ReactNode;
  /** Icon to display at the end of the button */
  endIcon?: React.ReactNode;
  /** Button content */
  children?: React.ReactNode;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA described by for accessibility */
  ariaDescribedBy?: string;
  /** Test identifier for automated testing */
  testId?: string;
  /** Button type attribute */
  type?: "button" | "submit" | "reset";
  /** Full width button */
  fullWidth?: boolean;
  /** Custom class name */
  className?: string;
  /** Tooltip text */
  title?: string;
  indicator?: boolean; //`indicator` prop: used to optionally show a custom visual indicator on the button.
  textColor?: string; // Added textColor prop to allow custom inline text color customization when needed.
}

/**
 * CustomizableButton component implementation
 */
const CustomizableButton = memo(
  React.forwardRef<HTMLButtonElement, ICustomizableButtonProps>(
    (
      {
        variant = "contained",
        size = "medium",
        isDisabled = false,
        isLink = false,
        color = "primary",
        onClick,
        sx,
        text,
        icon,
        startIcon,
        endIcon,
        children,
        loading = false,
        loadingIndicator,
        ariaLabel,
        ariaDescribedBy,
        testId,
        type = "button",
        fullWidth = false,
        className,
        title,
        indicator,
        textColor, // 🧩 Add this line
        ...rest
      },
      ref
    ) => {
      // Handle click events with error boundary
      const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
          if (loading || isDisabled) {
            event.preventDefault();
            return;
          }

          try {
            onClick?.(event);
          } catch (error) {
            console.error("CustomizableButton onClick error:", error);
          }
        },
        [onClick, loading, isDisabled]
      );

      // Handle keyboard events for accessibility
      const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!loading && !isDisabled) {
              // For keyboard accessibility, call handleClick directly
              // We need to create a proper synthetic event to avoid TypeScript errors
              handleClick(
                event as unknown as React.MouseEvent<HTMLButtonElement>
              );
            }
          }
        },
        [handleClick, loading, isDisabled]
      );

      // Get theme-based appearance - ensure proper typing for MUI sx prop
      const appearance = (singleTheme.buttons?.[color]?.[variant] ||
        {}) as SxProps<Theme>;

      // Determine button content
      const buttonText = children || text || "CustomizableButton";
      const resolvedStartIcon = startIcon || icon;

      // Custom loading indicator or default spinner
      const spinner = loadingIndicator || (
        <CircularProgress
          size={16}
          color="inherit"
          sx={{ mr: resolvedStartIcon || endIcon ? 1 : 0 }}
        />
      );

      // FIX: Filtered out `selectionFollowsFocus` — not a valid DOM attribute.
// This avoids React warnings about invalid props being passed to DOM elements.
      const { selectionFollowsFocus, ...filteredRest } = rest as any;

      return (
        <Button
          ref={ref}
          className={className}
          disableRipple
          variant={variant as ButtonProps["variant"]}
          size={size as ButtonProps["size"]}
          disabled={isDisabled || loading}
          color={color as ButtonProps["color"]}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          type={type}
          fullWidth={fullWidth}
          title={title}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-disabled={isDisabled || loading}
          data-testid={testId}
          sx={[
            appearance,
            {
              position: "relative",
              minHeight: "34px",
              "&.Mui-disabled": {
                pointerEvents: loading ? "none" : "auto",
              },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          disableElevation={variant === "contained" && !isLink}
          startIcon={
            loading ? (
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                {spinner}
              </Box>
            ) : (
              resolvedStartIcon
            )
          }
          endIcon={!loading ? endIcon : undefined}
          {...filteredRest}
        >
          {loading && !resolvedStartIcon && !endIcon && (
            <Box
              component="span"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {spinner}
            </Box>
          )}
          <Box
            component="span"
            sx={{
              opacity: loading && !resolvedStartIcon && !endIcon ? 0 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            {buttonText}
          </Box>
        </Button>
      );
    }
  )
);

// Set display name for better debugging and dev tools
CustomizableButton.displayName = "CustomizableButton";

export default CustomizableButton;
