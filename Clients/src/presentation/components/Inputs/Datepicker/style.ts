export const DatePickerStyle = {
  backgroundColor: "#FFFFFF",
  ".MuiIconButton-root:hover": { backgroundColor: "unset" },
  "& svg": { display: "none" },
  // Icon button positioning (MUI v8 uses MuiInputAdornment-root)
  "& .MuiInputAdornment-root": {
    position: "absolute",
    left: "8px",
    marginRight: 0,
    zIndex: 1,
  },
  "& .MuiInputAdornment-root button": {
    width: "20px",
    height: "20px",
    padding: 0,
  },
  "& .MuiInputAdornment-root button:before": {
    content: "url('/assets/icons/calendar.svg')",
    display: "block",
  },
  // MUI v8 DatePicker uses sectionsContainer for the date display
  "& .MuiPickersOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
    paddingLeft: "36px !important",
  },
  "& .MuiPickersInputBase-sectionsContainer": {
    paddingLeft: "0 !important",
    fontSize: "13px !important",
  },
  "& .MuiPickersInputBase-sectionContent": {
    fontSize: "13px !important",
  },
  // Fallback for hidden input element
  "& .MuiPickersInputBase-input, & .MuiPickersOutlinedInput-input": {
    fontSize: "13px !important",
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
  },
};
