import { Theme } from "@mui/material";

export const inputStyles = {
  minWidth: 100,
  maxWidth: 200,
  height: 34,
};

export const getDropdownStyles = (theme: Theme) => ({
  borderRadius: 2,
  padding: "0 12px 0 0",
  fontSize: 13,
  color: theme.palette.text.primary,
  "&:hover": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.border.dark,
    },
  },
  "&.Mui-focused": {
    "& .MuiOutlinedInput-notchedOutline": {
      border: `1px solid ${theme.palette.border.dark}`,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${theme.palette.border.dark}`,
  },
});
