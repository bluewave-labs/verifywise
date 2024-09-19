import "./index.css";
import { Link as MuiLink, useTheme } from "@mui/material";

/**
 * Link component that renders a styled link based on the provided level.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.level - The level of the link which determines its styling. Can be 'primary', 'secondary', 'tertiary', or 'error'.
 * @param {string} props.label - The text to be displayed for the link.
 * @param {string} props.url - The URL that the link points to.
 *
 * @returns {JSX.Element} The rendered link component.
 */

interface LinkProps {
  level: "primary" | "secondary" | "tertiary" | "error";
  label: string;
  url: string;
}

const Link: React.FC<LinkProps> = ({ level, label, url }) => {
  const theme = useTheme();

  const levelConfig = {
    primary: {
      color: theme.palette.text.primary,
      sx: {},
    },
    secondary: {
      color: theme.palette.text.secondary,
      sx: {
        ":hover": {
          color: theme.palette.text.secondary,
        },
      },
    },
    tertiary: {
      color: theme.palette.text.tertiary,
      sx: {
        textDecoration: "underline",
        textDecorationStyle: "dashed",
        textDecorationColor: theme.palette.primary.main,
        textUnderlineOffset: "1px",
        ":hover": {
          color: theme.palette.text.tertiary,
          textDecorationColor: theme.palette.primary.main,
          backgroundColor: theme.palette.background.fill,
        },
      },
    },
    error: {
      color: theme.palette.error.main,
      sx: {
        ":hover": {
          color: theme.palette.error.dark,
        },
      },
    },
  };

  const { sx, color } = levelConfig[level];

  return (
    <MuiLink
      href={url}
      sx={{ width: "fit-content", ...sx }}
      color={color}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </MuiLink>
  );
};

export default Link;
