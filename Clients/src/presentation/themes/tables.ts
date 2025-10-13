const fontSizes = {
  small: "11px",
  medium: "13px",
  large: "16px",
};

export const tableStyles = {
  primary: {
    frame: {
      border: "1px solid #EEEEEE",
      borderRadius: "4px",
      "& td, & th": {
        border: 0,
      },
    },
    header: {
      backgroundColors: "#fafafa",
      row: {
        textTransform: "uppercase",
        borderBottom: "1px solid #EEEEEE",
      },
      cell: {
        color: "#475467",
        fontSize: fontSizes.medium,
        fontWeight: 400,
        padding: "12px 10px",
        whiteSpace: "nowrap",
        "&:not(:lastChild)": {
          minWidth: "120px",
          width: "120px",
        },
      },
    },
    body: {
      backgroundColor: "white",
      row: {
        textTransform: "capitalize",
        borderBottom: "1px solid #EEEEEE",
        backgroundColor: "white",
        transition: "background-color 0.3s ease-in-out",
        "&:hover td": {
          backgroundColor: " #fafafa",
        },
        "&:hover": {
          cursor: "pointer",
        },
      },
      cell: {
        fontSize: fontSizes.medium,
        padding: "12px 10px",
        whiteSpace: "nowrap",
        backgroundColor: "white",
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
          backgroundColor: "#13715B",
          color: "#fff",
          border: "1px solid #13715B",
          cursor: "pointer",
        },
      }
    },
  },
};
