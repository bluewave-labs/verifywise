import {
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
} from "@mui/material";

/**
 * A custom Button component that wraps the Material-UI Button (`MUIButton`) component.
 * It applies default styles and allows additional styles to be merged via the `sx` prop.
 *
 * @component
 * @param {MUIButtonProps} props - The props for the Material-UI Button component.
 * @param {React.ReactNode} props.children - The content to be displayed inside the button.
 * @param {object} [props.sx] - Additional styles to be merged with the default styles.
 * @param {object} [props.rest] - Any other props supported by the Material-UI Button component.
 *
 * @returns {JSX.Element} A styled Material-UI Button component.
 */
const Button: React.FC<MUIButtonProps> = ({ children, sx, ...rest }) => {
  const styles = {
    mt: 2,
    borderRadius: 2,
    width: "fit-content",
    height: 25,
    fontSize: 11,
    border: "1px solid #13715B",
    backgroundColor: "#13715B",
    color: "white",
    ...sx,
  };

  return <MUIButton sx={styles} {...rest}>{children}</MUIButton>;
};

export default Button;
