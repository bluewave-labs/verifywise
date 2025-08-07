// Export individual styles for use in components
const primaryColor = "#13715B";

export const aiTrustCenterHeaderTitle = {
    color: "#1A1919",
    fontWeight: 600,
    mb: "6px",
    fontSize: 16,
  };
  
  export const aiTrustCenterHeaderDesc = {
    fontSize: 13,
    color: "#344054",
  };
  
  export const aiTrustCenterTabStyle = {
    textTransform: "none",
    fontWeight: 400,
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "16px 0 7px",
    minHeight: "20px",
    minWidth: "auto",
    "&.Mui-selected": {
      color: primaryColor,
    },
  };
  
  export const aiTrustCenterTabPanelStyle = {
    padding: 0,
    pt: 5,
    width: "100%",
  };
  
  export const aiTrustCenterTabListStyle = {
    minHeight: "20px",
    "& .MuiTabs-flexContainer": { columnGap: "34px" },
  }; 
  
  export const aiTrustCenterPreviewButtonStyle = {
    backgroundColor: primaryColor,
    border: `1px solid ${primaryColor}`,
    gap: 2,
    marginLeft: "auto",
    marginRight: "0",
  };

export const aiTrustCenterTableCell = {
  px: 4,
};