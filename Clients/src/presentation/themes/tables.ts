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
        color: "#a1afc6",
        fontWeight: 400,
        paddingLeft: "10px",
        whiteSpace: "nowrap",
        "&:not(:last-child)": {
          minWidth: "fit-content",
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
        paddingY: "12px",
        whiteSpace: "nowrap",
        backgroundColor: "white",
        "&:not(:last-child)": {
          minWidth: "fit-content",
        },
      },
    },
  },
};
