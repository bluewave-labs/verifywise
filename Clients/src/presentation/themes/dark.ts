import { createTheme } from "@mui/material/styles";

const text = {
  primary: "#e6e8eb",
  secondary: "#b0b4bb",
  tertiary: "#8b909a",
  accent: "#6b7280",
  muted: "#6b7280",
  dark: "#d1d5db",
  heading: "#f3f4f6",
};

const background = {
  main: "#0f1117",
  alt: "#141720",
  modal: "#1a1d23",
  fill: "#21242b",
  accent: "#181b22",
  hover: "#1a1d23",
  subtle: "#181b22",
};

const fontFamilyDefault =
  "'Geist', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const shadow =
  "0px 4px 24px -4px rgba(0, 0, 0, 0.4), 0px 3px 3px -3px rgba(0, 0, 0, 0.2)";

const dark = createTheme({
  typography: { fontFamily: fontFamilyDefault, fontSize: 13 },
  spacing: 2,
  palette: {
    mode: "dark",
    primary: { main: "#1a9e7e" },
    secondary: { main: "#2a2d35", dark: "#363940", contrastText: "#b0b4bb" },
    text: text,
    background: background,
    border: {
      light: "#2a2d35",
      dark: "#3a3d45",
      medium: "#4a4d55",
      input: "#3a3d45",
    },
    status: {
      info: {
        text: text.primary,
        main: text.tertiary,
        bg: background.main,
        light: background.main,
        border: "#3a3d45",
      },
      success: {
        text: "#34d399",
        main: "#22c55e",
        light: "#14532d",
        bg: "#052e16",
      },
      error: {
        text: "#f87171",
        main: "#ef4444",
        light: "#7f1d1d",
        bg: "#450a0a",
        border: "#b91c1c",
      },
      warning: {
        text: "#fbbf24",
        main: "#f59e0b",
        light: "#78350f",
        bg: "#451a03",
        border: "#d97706",
      },
      inactive: {
        text: "#8b909a",
        main: "#6b7280",
        light: "#21242b",
        bg: "#141720",
      },
    },
    other: {
      icon: "#8b909a",
      line: "#2a2d35",
      fill: "#363940",
      grid: "#4a4d55",
    },
    unresolved: { main: "#818cf8", light: "#1e1b4b", bg: "#1a1d2e" },
    chart: {
      blue: "#3B82F6",
      amber: "#F59E0B",
      purple: "#8B5CF6",
      emerald: "#10B981",
      red: "#EF4444",
      darkRed: "#DC2626",
      darkEmerald: "#059669",
      orange: "#F97316",
      indigo: "#6366f1",
      slate: "#64748b",
    },
    divider: "#2a2d35",
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
          borderColor: "#2a2d35",
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
          borderBottomColor: "#2a2d35",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, #181b22 0%, #1a1d24 100%)",
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          backgroundColor: background.main,
          border: 1,
          borderStyle: "solid",
          borderColor: "#2a2d35",
          "& button": {
            color: text.tertiary,
            borderRadius: 4,
          },
          "& li:first-of-type button, & li:last-of-type button": {
            border: 1,
            borderStyle: "solid",
            borderColor: "#2a2d35",
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
          backgroundColor: "#21242b",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: background.modal,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: background.modal,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: background.main,
          "& .MuiOutlinedInput-root": {
            backgroundColor: background.main,
            borderRadius: 2,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#3a3d45",
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#4a4d55",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1a9e7e",
              borderWidth: "1px",
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: background.main,
          borderRadius: 2,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3a3d45",
            borderWidth: "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4a4d55",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1a9e7e",
            borderWidth: "1px",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: background.main,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          backgroundColor: background.main,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '13px',
          backgroundColor: '#e6e8eb',
          color: '#1c2130',
          padding: '8px 12px',
          borderRadius: '4px',
        },
        arrow: {
          color: '#e6e8eb',
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
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiToggleButton: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiSwitch: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiRadio: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

export default dark;
