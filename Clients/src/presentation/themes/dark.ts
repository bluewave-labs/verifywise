import { createTheme } from "@mui/material/styles";

const text = {
  primary: "#fafafa",
  secondary: "#e6e6e6",
  tertiary: "#a1a1aa",
  accent: "#8e8e8f",
  disabled: "rgba(172, 172, 172, 0.3)",
};

const background = {
  main: "#151518",
  alt: "#09090b",
  fill: "#2D2D33",
  accent: "#18181a",
};

const fontFamilyDefault =
  "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";

const shadow =
  "0px 4px 24px -4px rgba(255, 255, 255, 0.03), 0px 3px 3px -3px rgba(255, 255, 255, 0.01)";

const dark = createTheme({
  typography: { fontFamily: fontFamilyDefault, fontSize: 13 },
  spacing: 2,
  palette: {
    mode: "dark",
    primary: { main: "#1570ef" },
    secondary: { main: "#2D2D33" },
    text: text,
    background: background,
    border: {
      light: "#eaecf0",
      dark: "#d0d5dd",
    },
    status: {
      info: {
        text: text.primary,
        main: text.secondary,
        bg: background.main,
        light: background.main,
        border: "#eaecf0",
      },
      success: {
        text: "#079455",
        main: "#45bb7a",
        light: "#1c4428",
        bg: "#12261e",
      },
      error: {
        text: "#f04438",
        main: "#d32f2f",
        light: "#542426",
        bg: "#301a1f",
        dark: "#932020",
        border: "#f04438",
      },
      warning: {
        text: "#e88c30",
        main: "#FF9F00",
        light: "#624711",
        bg: "#262115",
        border: "#e88c30",
      },
    },
    other: {
      icon: "#e6e6e6",
      line: "#27272a",
      fill: "#18181a",
      grid: "#454546",
    },
    unresolved: { main: "#4e5ba6", light: "#e2eaf7", bg: "#f2f4f7" },
    divider: "#eaecf0",
  },
  shape: {
    borderRadius: 2,
  },
  boxShadow: shadow,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle, #09090b, #0c0c0e, #0f0f11, #111113, #131315, #131315, #131315, #131315, #111113, #0f0f11, #0c0c0e, #09090b)",
          lineHeight: "inherit",
          paddingLeft: "calc(100vw - 100%)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: (props) => props.variant === "group",
              style: {
                color: theme.palette.secondary.contrastText,
                backgroundColor: theme.palette.background.main,
                border: 1,
                borderStyle: "solid",
                borderColor: theme.palette.border.light,
              },
            },
            {
              props: (props) =>
                props.variant === "group" && props.filled === "true",
              style: {
                backgroundColor: theme.palette.secondary.main,
              },
            },
            {
              props: (props) =>
                props.variant === "contained" && props.color === "secondary",
              style: {
                border: 1,
                borderStyle: "solid",
                borderColor: theme.palette.border.dark,
              },
            },
          ],
          fontWeight: 400,
          borderRadius: 4,
          boxShadow: "none",
          textTransform: "none",
          "&:focus": {
            outline: "none",
          },
          "&:hover": {
            boxShadow: "none",
          },
        }),
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          padding: 4,
          transition: "none",
          "&:hover": {
            backgroundColor: "#eaecf0",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          marginTop: 4,
          padding: 0,
          border: 1,
          borderStyle: "solid",
          borderColor: "#eaecf0",
          borderRadius: 4,
          boxShadow: shadow,
          backgroundColor: background.main,
          backgroundImage: "none",
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItemButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          transition: "none",
        },
      },
    },
    MuiMenuItem: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: "inherit",
          padding: "4px 6px",
          color: text.secondary,
          fontSize: 13,
          margin: 2,
          minWidth: 100,
          "&:hover, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible":
            {
              backgroundColor: background.fill,
            },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: "#eaecf0",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: background.accent,
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          backgroundColor: background.main,
          border: 1,
          borderStyle: "solid",
          borderColor: "#eaecf0",
          "& button": {
            color: text.tertiary,
            borderRadius: 4,
          },
          "& li:first-of-type button, & li:last-of-type button": {
            border: 1,
            borderStyle: "solid",
            borderColor: "#eaecf0",
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          "&:not(.MuiPaginationItem-ellipsis):hover, &.Mui-selected": {
            backgroundColor: background.fill,
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "#151518",
        },
      },
    },

    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiFab: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButtonGroup: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

export default dark;
