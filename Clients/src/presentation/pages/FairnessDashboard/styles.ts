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
      borderColor: "divider"
    },
    tabList: {
      minHeight: "32px",
      "& .MuiTabs-flexContainer": { columnGap: "24px" },
      "& .MuiTab-root": {
                      minHeight: "32px",
                      padding: 0,
                      fontSize: "13px",
                      fontWeight: 500,
                      textTransform: "capitalize",
                      color: "#4B5563",
                      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                      width: "fit-content",
                      minWidth: "unset",
                    },
                    "& .MuiTab-root.Mui-selected": {
                      color: "#13715B !important",
                      display: "table",
                      minWidth: "unset",
                      width: "fit-content",
                      paddingLeft: 0,
                      paddingRight: 0,
                    },              
    },
    greenButton: {
      backgroundColor: "#13715B",
      
    }
  }