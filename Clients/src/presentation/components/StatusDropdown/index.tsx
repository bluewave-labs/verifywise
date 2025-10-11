/**
 * StatusDropdown Component
 * 
 * A colored dropdown component that replaces status chips with interactive dropdowns.
 * Maintains the same visual appearance as status chips but allows direct status updates.
 * 
 * Features:
 * - Colored background matching status colors
 * - Loading states during updates
 * - Error handling with user feedback
 * - Consistent styling with existing design system
 * - Support for different sizes (small, medium)
 */

import React, { useState } from "react";
import {
  MenuItem,
  Select as MuiSelect,
  Stack,
  CircularProgress,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import { ChevronDown as WhiteDownArrowIcon } from "lucide-react";
import { getStatusColor } from "../../pages/ISO/style";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<boolean>;
  disabled?: boolean;
  size?: 'small' | 'medium';
  allowedRoles?: string[];
  userRole?: string;
  statusOptions?: string[];
}

const STATUS_OPTIONS = [
  "Not started",
  "Draft", 
  "In progress",
  "Awaiting review",
  "Awaiting approval",
  "Implemented",
  // "Audited",
  "Needs rework"
];

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'small',
  allowedRoles = [],
  userRole = '',
}) => {
  const theme = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Normalize status for consistent handling
  const normalizedStatus = currentStatus || "Not started";
  const statusColor = getStatusColor(normalizedStatus);
  
  // Check if user has permission to edit
  const canEdit = allowedRoles.length === 0 || allowedRoles.includes(userRole);
  const isDisabled = disabled || !canEdit;
  
  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;
    if (newStatus === normalizedStatus || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
      // Parent component handles success/error messaging
    } catch (error) {
      console.error('Error in StatusDropdown:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderValue = (value: unknown) => {
    const selected = value as string;
    const displayText = selected
      ? selected.charAt(0).toUpperCase() + selected.slice(1).toLowerCase()
      : "Not started";
    
    return (
      <Stack direction="row" alignItems="center" gap={0.5}>
        {isUpdating && (
          <CircularProgress 
            size={size === 'small' ? 10 : 12} 
            sx={{ color: "#fff" }}
          />
        )}
        <span
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            maxWidth: "100%",
            color: "#fff",
            fontWeight: 500,
          }}
        >
          {displayText}
        </span>
      </Stack>
    );
  };

  const dropdownHeight = size === 'small' ? 28 : 34;
  const fontSize = size === 'small' ? 12 : 13;
  const padding = size === 'small' ? "4px 8px" : "5px 10px";
  const minWidth = size === 'small' ? '100px' : '120px';

  const handleClick = (event: React.MouseEvent) => {
    // Prevent event bubbling to parent elements (e.g., drawer opening)
    event.stopPropagation();
  };

  return (
    <MuiSelect
      value={normalizedStatus}
      onChange={handleStatusChange}
      onClick={handleClick}
      disabled={isDisabled || isUpdating}
      displayEmpty
      renderValue={renderValue}
      IconComponent={WhiteDownArrowIcon}
      MenuProps={{
        disableScrollLock: true,
        PaperProps: {
          sx: {
            borderRadius: theme.shape.borderRadius || 4,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            mt: 0.5,
            "& .MuiMenuItem-root": {
              fontSize: fontSize,
              color: theme.palette.text?.primary || "#000",
              "&:hover": {
                backgroundColor: theme.palette.action?.hover || "#f5f5f5",
              },
              "&.Mui-selected": {
                backgroundColor: theme.palette.action?.hover || "#f5f5f5",
                "&:hover": {
                  backgroundColor: theme.palette.action?.hover || "#f5f5f5",
                },
              },
            },
          },
        },
      }}
      sx={{
        minWidth: minWidth,
        height: dropdownHeight,
        fontSize: fontSize,
        backgroundColor: statusColor,
        color: "#fff",
        borderRadius: "4px",
        "& .MuiSelect-select": {
          padding: padding,
          display: "flex",
          alignItems: "center",
        },
        "& fieldset": {
          border: "none",
        },
        "&:hover fieldset": {
          border: "none",
        },
        "&.Mui-focused fieldset": {
          border: "none",
        },
        "& .MuiSelect-icon": {
          color: "#fff",
          right: size === 'small' ? 4 : 6,
        },
        "&:hover": {
          backgroundColor: statusColor,
          opacity: isDisabled ? 0.6 : 0.9,
        },
        "&.Mui-disabled": {
          backgroundColor: statusColor,
          opacity: 0.6,
          color: "#fff",
        },
      }}
    >
      {STATUS_OPTIONS.map((status) => (
        <MenuItem
          key={status}
          value={status}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "2px",
              backgroundColor: getStatusColor(status),
              marginRight: 8,
            }}
          />
          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
        </MenuItem>
      ))}
    </MuiSelect>
  );
};

export default StatusDropdown;