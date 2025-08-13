export const styles = {
  vwHeadingTitle: {
    color: "#1A1919",
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  vwSubHeadingTitle: {
    color: "#344054",
    fontSize: 13,
  },
  tabDivider: {
    borderBottom: 1,
    borderColor: "divider",
  },
  tabList: {
    minHeight: "20px",
    "& .MuiTabs-flexContainer": { columnGap: "34px" },
  },
  reportButtonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    mb: 2,
    "& button": {
      backgroundColor: "#1976d2",
      color: "#fff",
      padding: "0",
      textTransform: "none",
      "&:hover": {
        backgroundColor: "#1565c0",
      },
      "&:focus": {
        outline: "none",
        boxShadow: "0 0 0 0",
      },
      "&:active": {
        backgroundColor: "#013973",
      },
    },
  },
};
