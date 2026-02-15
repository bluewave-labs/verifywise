const fontSizes = {
  small: "11px",
  medium: "13px",
  large: "16px",
};

export const getTableStyles = (mode: "light" | "dark" = "light") => {
  const isDark = mode === "dark";
  return {
    primary: {
      frame: {
        border: `1px solid ${isDark ? "#2a2d35" : "#d0d5dd"}`,
        borderRadius: "4px",
        "& td, & th": {
          border: 0,
        },
      },
      header: {
        backgroundColors: isDark
          ? "linear-gradient(180deg, #181b22 0%, #1a1d24 100%)"
          : "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
        row: {
          textTransform: "uppercase",
          borderBottom: `1px solid ${isDark ? "#2a2d35" : "#d0d5dd"}`,
          background: isDark
            ? "linear-gradient(180deg, #181b22 0%, #1a1d24 100%)"
            : "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
        },
        cell: {
          color: isDark ? "#8b909a" : "#475467",
          fontSize: fontSizes.medium,
          fontWeight: 400,
          padding: "14px 12px",
          whiteSpace: "nowrap",
          "&:not(:lastChild)": {
            minWidth: "120px",
            width: "120px",
          },
        },
      },
      body: {
        backgroundColor: isDark ? "#0f1117" : "white",
        row: {
          textTransform: "none",
          borderBottom: `1px solid ${isDark ? "#2a2d35" : "#eaecf0"}`,
          backgroundColor: isDark ? "#0f1117" : "white",
          transition: "background-color 0.2s ease-in-out",
          "&:nth-of-type(even)": {
            backgroundColor: isDark ? "#141720" : "#fafbfc",
          },
          "&:last-child": {
            borderBottom: "none",
          },
          "&:hover td": {
            backgroundColor: isDark ? "#1a1d23" : "#f5f5f5",
          },
          "&:hover": {
            cursor: "pointer",
          },
        },
        cell: {
          fontSize: fontSizes.medium,
          padding: "14px 12px",
          whiteSpace: "nowrap",
          "&:not(:lastChild)": {
            minWidth: "120px",
            width: "120px",
          },
        },
        button: {
          fontSize: fontSizes.medium,
          padding: "2px 8px",
          textTransform: "none",
          borderRadius: "4px",
          "&:hover": {
            opacity: 0.9,
            backgroundColor: isDark ? "#1a9e7e" : "#13715B",
            color: "#fff",
            border: `1px solid ${isDark ? "#1a9e7e" : "#13715B"}`,
            cursor: "pointer",
          },
        }
      },
      footer: {
        cell: {
          fontSize: fontSizes.small,
          whiteSpace: "nowrap",
          opacity: 0.7,
        },
      },
    },
  };
};

/** @deprecated Use getTableStyles(mode) instead for theme-aware colors */
export const tableStyles = getTableStyles("light");
