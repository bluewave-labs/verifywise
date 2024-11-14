import { createTheme } from "@mui/material/styles";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    group: true;
  }
}

const text = {
  primary: "#1c2130",
  secondary: "#344054",
  tertiary: "#475467",
  accent: "#838c99",
};

const background = {
  main: "#FFFFFF",
  alt: "#FCFCFD",
  fill: "#F4F4F4",
  accent: "#f9fafb",
};

const fontFamilyDefault =
  "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";

const shadow =
  "0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

const light = createTheme({
  typography: { fontFamily: fontFamilyDefault, fontSize: 13 },
  spacing: 2,
  palette: {
    primary: { main: "#1570EF" },
    secondary: { main: "#F4F4F4", dark: "#e3e3e3", contrastText: "#475467" },
    text: text,
    background: background,
    border: {
      light: "#eaecf0",
      dark: "#d0d5dd",
    },
    status: {
      info: {
        text: text.primary,
        main: text.tertiary,
        bg: background.main,
        light: background.main,
        border: "#d0d5dd",
      },
      success: {
        text: "#079455",
        main: "#17b26a",
        light: "#d4f4e1",
        bg: "#ecfdf3",
      },
      error: {
        text: "#f04438",
        main: "#d32f2f",
        light: "#fbd1d1",
        bg: "#f9eced",
        border: "#FDA29B",
      },
      warning: {
        text: "#DC6803",
        main: "#fdb022",
        light: "#ffecbc",
        bg: "#fffcf5",
        border: "#fec84b",
      },
    },
    other: {
      icon: "#667085",
      line: "#d6d9dd",
      fill: "#e3e3e3",
      grid: "#a2a3a3",
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
        body: {},
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
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
                borderColor: theme.palette.border.light,
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
            backgroundColor: background.fill,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          marginTop: 4,
          border: 1,
          borderStyle: "solid",
          borderColor: "#eaecf0",
          borderRadius: 4,
          boxShadow: shadow,
          backgroundColor: background.main,
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
          marginBottom: 0,
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
          backgroundColor: "#f2f4f7",
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

export default light;
