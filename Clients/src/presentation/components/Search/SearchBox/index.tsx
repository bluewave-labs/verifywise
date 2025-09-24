import React from "react";
import { Box, InputBase, SxProps, Theme } from "@mui/material";
import { ReactComponent as SearchIcon } from "../../../assets/icons/search.svg";

export interface SearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
  fullWidth?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  sx = {},
  inputProps = {},
  disabled = false,
  fullWidth = true,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const searchBoxStyle: SxProps<Theme> = {
    display: "flex",
    alignItems: "center",
    border: "1px solid #eaecf0",
    borderRadius: 1,
    p: "4px 6px",
    bgcolor: "#fff",
    height: "34px",
    ...(fullWidth && { flex: 1 }),
    ...sx,
  };

  const searchInputStyle: SxProps<Theme> = {
    flex: 1,
    fontSize: "13px",
    fontFamily: "inherit",
  };

  return (
    <Box sx={searchBoxStyle}>
      <SearchIcon style={{ color: "#6b7280", marginRight: "8px" }} />
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