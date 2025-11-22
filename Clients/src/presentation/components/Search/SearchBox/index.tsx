import React from "react";
import { Box, InputBase, SxProps, Theme, useTheme } from "@mui/material";
import { Search } from "lucide-react";
import { ISearchBoxProps } from "../../../../domain/interfaces/iWidget";
import { getSearchBoxStyles } from "../../../utils/inputStyles";

const SearchBox: React.FC<ISearchBoxProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  sx = {},
  inputProps = {},
  disabled = false,
  fullWidth = true,
}) => {
  const theme = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const searchBoxStyle: SxProps<Theme> = {
    display: "flex",
    alignItems: "center",
    ...getSearchBoxStyles(theme),
    px: "10px",
    bgcolor: "#fff",
    height: "34px !important",
    minHeight: "34px",
    maxHeight: "34px",
    boxSizing: "border-box",
    ...(fullWidth && { width: "100%" }),
    ...sx,
  };

  const searchInputStyle: SxProps<Theme> = {
    flex: 1,
    fontSize: "13px",
    fontFamily: "inherit",
    "& .MuiInputBase-input": {
      padding: 0,
    },
  };

  return (
    <Box sx={searchBoxStyle}>
      <Search size={16} style={{ color: "#6b7280", marginRight: "8px" }} />
      <InputBase
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        sx={searchInputStyle}
        inputProps={{
          "aria-label": "Search",
          ...inputProps,
        }}
        disabled={disabled}
      />
    </Box>
  );
};

export default SearchBox;
