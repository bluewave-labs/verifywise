// styles.ts for FairnessTable
  export const styles = {
    textBase : {
      fontSize: "13px", 
      color: "#475467"
    }
  }
  
  export const paginationWrapper = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mt: 2,
    flexWrap: "wrap",
    rowGap: 1,
  };
  
  export const paginationStatus = {
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

  export const emptyData = ( theme:any ) => ({
    padding: theme.spacing(15, 5),
    paddingBottom: theme.spacing(20),
  })
  