/**
 * FilterButton Component
 *
 * A reusable filter button component that shows active filter state
 * and provides consistent styling across the application.
 */

import React from "react";
import { Box } from "@mui/material";
import CustomizableButton from "../CustomizableButton";
import { IFilterButtonProps } from "../../../../domain/interfaces/i.button";

const FilterIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 12H18M3 6H21M9 18H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FilterButton: React.FC<IFilterButtonProps> = ({
  isOpen,
  hasActiveFilters,
  activeFilterCount,
  onClick,
  disabled = false,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <CustomizableButton
        variant="outlined"
        icon={<FilterIcon />}
        text="Filters"
        onClick={onClick}
        isDisabled={disabled}
        sx={{
          backgroundColor: isOpen ? "#f5f5f5" : "transparent",
          height: "34px",
          minHeight: "34px",
          ...sx,
        }}
      />
      {hasActiveFilters && (
        <Box
          sx={{
            backgroundColor: "#13715B",
            color: "white",
            px: 1,
            py: 0.2,
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: 600,
            minWidth: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ml: 0.5,
          }}
        >
          {activeFilterCount !== undefined ? activeFilterCount : "Active"}
        </Box>
      )}
    </Box>
  );
};

export default FilterButton;
