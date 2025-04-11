export const textfieldStyle = {
  backgroundColor: "#FFFFFF",
  "& input": {
    padding: "0 14px",
  },
};

export const dropdownStyle = {
  width: "350px",
  backgroundColor: "#FFFFFF",
};

export const createProjectButtonStyle = {
  backgroundColor: "#13715B",
  border: "1px solid #13715B",
  gap: 2,
};

export const datePickerStyle = {
  width: "130px",
  "& input": { width: "85px" },
};

export const teamMembersRenderInputStyle = {
  "& .MuiOutlinedInput-root": {
    paddingTop: "3.8px !important",
    paddingBottom: "3.8px !important",
  },
  "& ::placeholder": {
    fontSize: "13px",
  },
};

export const teamMembersSxStyle = {
  width: "350px",
  "& .MuiOutlinedInput-root": {
    borderRadius: "3px",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#888",
      borderWidth: "1px",
    },
  },
};

export const teamMembersSlotProps = {
  paper: {
    sx: {
      "& .MuiAutocomplete-listbox": {
        "& .MuiAutocomplete-option": {
          fontSize: "13px",
          color: "#1c2130",
          paddingLeft: "9px",
          paddingRight: "9px",
        },
        "& .MuiAutocomplete-option.Mui-focused": {
          background: "#f9fafb",
        },
      },
      "& .MuiAutocomplete-noOptions": {
        fontSize: "13px",
        paddingLeft: "9px",
        paddingRight: "9px",
      },
    },
  },
};
