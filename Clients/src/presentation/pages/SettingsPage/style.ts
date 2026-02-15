import { Theme } from "@mui/material/styles";

export const tabIndicatorStyle = (theme: Theme) => ({ style: { backgroundColor: theme.palette.primary.main } });

export const tabContainerStyle = {
  minHeight: "20px",
  "& .MuiTabs-flexContainer": { columnGap: "34px" },
};

export const settingTabStyle = (theme: Theme) => ({
  textTransform: "none",
  fontWeight: 400,
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "16px 0 7px",
  minWidth: "auto",
  minHeight: "20px",
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
});
