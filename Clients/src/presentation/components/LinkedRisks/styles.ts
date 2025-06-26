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
  }
}