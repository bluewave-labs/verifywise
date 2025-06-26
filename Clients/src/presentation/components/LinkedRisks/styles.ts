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
    gap: 10
  },
  headingSection: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: '100%'
  },
  searchInputWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
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