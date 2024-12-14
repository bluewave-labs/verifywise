/**
 * VWButton component
 *
 * This component renders a button with various styles and properties.
 *
 * @component
 * @example
 * <VWButton
 *   variant="contained"
 *   size="medium"
 *   isDisabled={false}
 *   isLink={false}
 *   color="primary"
 *   onClick={() => console.log('Button clicked')}
 *   sx={{ margin: 1 }}
 * />
 *
 * @typedef {Object} VWButtonProps
 * @property {"contained" | "outlined" | "text"} [variant="contained"] - The variant of the button.
 * @property {"small" | "medium" | "large"} [size="medium"] - The size of the button.
 * @property {boolean} [isDisabled=false] - If true, the button will be disabled.
 * @property {boolean} [isLink=false] - If true, the button will be styled as a link.
 * @property {"primary" | "secondary" | "success" | "warning" | "error" | "info"} [color="primary"] - The color of the button.
 * @property {function} [onClick] - The function to call when the button is clicked.
 * @property {SxProps} [sx] - The system prop that allows defining system overrides as well as additional CSS styles.
 */

import { Button } from "@mui/material";
import PropTypes from "prop-types";
import { SxProps } from "@mui/system";
import { ButtonProps } from "@mui/material/Button";

import singleTheme from "../../themes/v1SingleTheme";

interface VWButtonProps {
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  isDisabled?: boolean;
  isLink?: boolean;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  sx?: SxProps;
}

const VWButton: React.FC<VWButtonProps> = ({
  variant = "contained",
  size = "medium",
  isDisabled = false,
  isLink = false,
  color = "primary",
  onClick,
  sx,
}) => {
  const appearance = singleTheme.buttons[color][variant];

  return (
    <Button
      disableRipple
      variant={variant as ButtonProps["variant"]}
      size={size as ButtonProps["size"]}
      disabled={isDisabled}
      color={color as ButtonProps["color"]}
      onClick={onClick}
      sx={{ appearance, ...sx }}
      disableElevation={variant === "contained" && !isLink}
    >
      VWButton
    </Button>
  );
};

VWButton.propTypes = {
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
};

export default VWButton;
