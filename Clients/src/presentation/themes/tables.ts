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
        paddingLeft: "16px",
      },
    },
    body: {
      backgroundColor: "white",
      row: {
        textTransform: "capitalize",
        borderBottom: "1px solid #EEEEEE",
        backgroundColor: "white",
      },
      cell: {
        fontSize: fontSizes.medium,
        paddingY: "12px",
        backgroundColor: "white",
      },
    },
  },
};
