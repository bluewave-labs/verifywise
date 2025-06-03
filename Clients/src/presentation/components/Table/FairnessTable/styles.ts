// styles.ts for FairnessTable
export const styles = {
    textBase: {
      fontSize: "14px",
      color: "#4B5563",
      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
      fontWeight: 400,
      textAlign: "center",
      mt: 2,
    },
  };
  
  export const emptyData = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "220px",
    padding: "1rem",
  };
  
  export const paginationWrapper = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mt: 2,
    flexWrap: "wrap",
    rowGap: 1,
  };
  
  export const pagniationStatus = {
    fontSize: "14px",
    color: "#4B5563",
    fontWeight: 400,
  };
  
  export const paginationStyle = {
    '& .MuiTablePagination-toolbar': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
      fontSize: "14px",
    },
  };
  
  export const paginationDropdown = {
    mt: 1,
    borderRadius: "8px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
  };
  
  export const paginationSelect = {
    fontSize: "14px",
    padding: "6px 12px",
  }
  