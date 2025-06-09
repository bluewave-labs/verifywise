export const styles = {
  btnWrap: {
    marginTop: 'auto',
    paddingTop: 12,
    display: "flex",
    alignItems: "flex-end",
  },
  CustomizableButton: {
    width: { xs: "100%", sm: 160 },
    backgroundColor: "#13715B",
    color: "#fff",
    border: "1px solid #13715B",
    gap: 2,
  },
  titleText: {
    fontSize: 16,
    color: "#344054",
    fontWeight: "bold",
  },
  baseText: {
    color: "#344054",
    fontSize: 13,
  },
  semiTitleText: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "medium",
  },
};

export const fieldStyle = (theme: any) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.background.main,
  "& input": {
    padding: "0 14px",
  },
});
