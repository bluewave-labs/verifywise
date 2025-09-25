export const DatePickerStyle = {
  backgroundColor: "#FFFFFF",
  ".MuiIconButton-root:hover": { backgroundColor: "unset" },
  "& svg": { display: "none" },
  "& button": {
    position: "absolute",
    left: "14px",
    top: "7px",
    width: "20px",
    height: "20px",
  },
  "& button:before": {
    content: "url('/assets/icons/calendar.svg')",
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
  },
  "& .MuiInputBase-root input": {
    position: "absolute",
    left: "36px",
    top: "3px",
    maxWidth: "145px",
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "2px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d0d5dd",
      borderWidth: "1px",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d0d5dd",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d0d5dd",
      borderWidth: "1px",
    },
  },
};
