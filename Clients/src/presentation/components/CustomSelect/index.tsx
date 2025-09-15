/**
 * CustomSelect Component
 * 
 * A reusable selection component that can be used across different features.
 * Uses the standard Select component with configurable options and handlers.
 * 
 * Features:
 * - Fully configurable options
 * - Interactive updates with loading states
 * - Consistent styling with design system
 * - Error handling and validation
 * - Reusable for status, sort, filter, or any selection needs
 * 
 * @component
 * @example
 * ```tsx
 * // For status updates
 * <CustomSelect
 *   currentValue="In Progress"
 *   onValueChange={handleStatusUpdate}
 *   options={["Open", "In Progress", "Completed"]}
 * />
 * 
 * // For sorting
 * <CustomSelect
 *   currentValue="newest"
 *   onValueChange={handleSortChange}
 *   options={["newest", "oldest", "priority"]}
 * />
 * ```
 */

import React, { useState } from "react";
import { SelectChangeEvent } from "@mui/material";
import Select from "../Inputs/Select";

interface CustomSelectProps {
  /** Current selected value */
  currentValue: string;
  /** Value change handler - should return boolean for success/failure */
  onValueChange: (newValue: string) => Promise<boolean>;
  /** Array of available options */
  options: string[];
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Size of the select component */
  size?: "small" | "medium";
  /** Additional styling */
  sx?: object;
}

const CustomSelect: React.FC<CustomSelectProps> = React.memo(({
  currentValue,
  onValueChange,
  options,
  disabled = false,
  size = "small",
  sx = {},
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (event: SelectChangeEvent<string | number>) => {
    const newValue = event.target.value as string;
    if (newValue === currentValue || isUpdating || disabled) return;
    
    setIsUpdating(true);
    try {
      const success = await onValueChange(newValue);
      if (!success) {
        console.error('Failed to update value');
      }
    } catch (error) {
      console.error('Error updating value:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectItems = options.map(option => ({
    _id: option,
    name: option,
  }));

  return (
    <Select
      id={`custom-select-${Date.now()}`}
      value={currentValue}
      items={selectItems}
      onChange={handleChange}
      getOptionValue={(item: any) => item._id}
      disabled={disabled || isUpdating}
      sx={{
        minWidth: size === "small" ? 120 : 140,
        '& .MuiOutlinedInput-root': {
          height: '34px',
        },
        ...sx,
      }}
    />
  );
});

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;