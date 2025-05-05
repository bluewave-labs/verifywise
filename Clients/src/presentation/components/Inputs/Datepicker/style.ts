export const DatePickerStyle = {
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
};
