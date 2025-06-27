export const textfieldStyle = {
  backgroundColor: "#FFFFFF",
  "& input": {
    padding: "0 14px",
  },
};

export const tableWrapper = ( theme:any) => ({
  '& .MuiTableCell-root.MuiTableCell-footer': {
    paddingX: theme.spacing(8),
    paddingY: theme.spacing(4),
  }
})

export const emptyData = ( theme:any ) => ({
  padding: theme.spacing(15, 5),
  paddingBottom: theme.spacing(20),
})

export const styles = {
  textBase : {
    fontSize: "13px", 
    color: "#475467"
  },
  textTitle : {
    fontSize: 16, 
    color: "#344054", 
    fontWeight: "bold"
  },
  container: {
    width: "100%",
    backgroundColor: "#FCFCFD",
    padding: 10,
    borderRadius: "4px",
    gap: 10,
    justifyContent: "space-between",
    minHeight: "520px"
  },
  headingSection: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: '100%',
    marginBottom: "20px"
  },
  searchInputWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "24px"
  },
  clearIconStyle: {
    color: "#98A2B3", 
    cursor: "pointer"
  },
  CustomizableButton: {
    width: { xs: "100%", sm: 160 },
    backgroundColor: "#13715B",
    color: "#fff",
    border: "1px solid #13715B",
    gap: 2,
  },
  cancelBtn: {
    fontSize: "13px", 
    color: "#475467",
    marginRight: "27px"
  }
}

export const paginationStyle = ( theme:any ) => ({ 
  mt: theme.spacing(6),
  color: theme.palette.text.secondary,
    "& .MuiSelect-icon": {
    width: "24px",
    height: "fit-content",
  },
  "& .MuiSelect-select": {
    width: theme.spacing(10),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.border.light}`,
    padding: theme.spacing(4),
  },
});

export const paginationSelect = ( theme:any ) => ({ 
  ml: theme.spacing(4),
  mr: theme.spacing(12),
  minWidth: theme.spacing(20),
  textAlign: "left",
  "&.Mui-focused > div": {
    backgroundColor: theme.palette.background.main,
  },
});

export const paginationDropdown = ( theme:any ) => ({
  mt: 0,
  mb: theme.spacing(2)
})

export const paginationWrapper = ( theme:any ) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingX: theme.spacing(4),
  "& p": {
    color: theme.palette.text.tertiary,
  },
})