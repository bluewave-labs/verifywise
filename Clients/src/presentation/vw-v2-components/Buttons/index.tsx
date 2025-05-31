/**
 * This file is currently in use
 */

/**
 * CustomizableButton component
 *
 * This component renders a button with various styles and properties.
 *
 * @component
 * @example
 * <CustomizableButton
 *   variant="contained"
 *   size="medium"
 *   isDisabled={false}
 *   isLink={false}
 *   color="primary"
 *   onClick={() => console.log('Button clicked')}
 *   sx={{ margin: 1 }}
 * />
 *
 * @typedef {Object} CustomizableButtonProps
 * @property {"contained" | "outlined" | "text"} [variant="contained"] - The variant of the button.
 * @property {"small" | "medium" | "large"} [size="medium"] - The size of the button.
 * @property {boolean} [isDisabled=false] - If true, the button will be disabled.
 * @property {boolean} [isLink=false] - If true, the button will be styled as a link.
 * @property {"primary" | "secondary" | "success" | "warning" | "error" | "info"} [color="primary"] - The color of the button.
 * @property {function} [onClick] - The function to call when the button is clicked.
 * @property {SxProps} [sx] - The system prop that allows defining system overrides as well as additional CSS styles.
 */

import React from "react";
import { Button } from "@mui/material";
import PropTypes from "prop-types";
import { ButtonProps } from "@mui/material/Button";
import singleTheme from "../../themes/v1SingleTheme";

interface CustomizableButtonProps {
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  isDisabled?: boolean;
  isLink?: boolean;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: any;
  sx?: any;
  text?: string;
  icon?: any;
}

const CustomizableButton = React.forwardRef<
  HTMLButtonElement,
  CustomizableButtonProps
>(
  (
    {
      variant = "contained",
      size = "medium",
      isDisabled = false,
      isLink = false,
      color = "primary",
      onClick,
      sx,
      text = "CustomizableButton",
      icon,
      ...rest
    },
    ref
  ) => {
    const appearance = singleTheme.buttons[color][variant];

    return (
      <Button
        ref={ref}
        disableRipple
        variant={variant as ButtonProps["variant"]}
        size={size as ButtonProps["size"]}
        disabled={isDisabled}
        color={color as ButtonProps["color"]}
        onClick={onClick}
        sx={{ ...appearance, ...sx }}
        disableElevation={variant === "contained" && !isLink}
        {...rest}
      >
        {icon}
        {text}
      </Button>
    );
  }
);

CustomizableButton.propTypes = {
  variant: PropTypes.oneOf(["contained", "outlined", "text"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  isDisabled: PropTypes.bool,
  isLink: PropTypes.bool,
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "info",
  ]),
  onClick: PropTypes.func,
  sx: PropTypes.object,
  text: PropTypes.string,
  icon: PropTypes.node,
};

export default CustomizableButton;
