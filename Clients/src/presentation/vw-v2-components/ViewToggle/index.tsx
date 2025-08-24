import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";

export type ViewMode = "card" | "table";

interface ViewToggleProps {
  /**
   * Current view mode
   */
  viewMode: ViewMode;
  /**
   * Callback fired when the view mode changes
   */
  onViewChange: (mode: ViewMode) => void;
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  /**
   * Size of the toggle buttons
   */
  size?: "small" | "medium" | "large";
  /**
   * Additional styling
   */
  sx?: object;
}

/**
 * ViewToggle - Reusable component for switching between card and table views
 * 
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useState<ViewMode>("card");
 * 
 * <ViewToggle
 *   viewMode={viewMode}
 *   onViewChange={setViewMode}
 * />
 * ```
 */
const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewChange,
  disabled = false,
  size = "small",
  sx = {},
}) => {
  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewMode | null
  ) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewChange}
      size={size}
      disabled={disabled}
      sx={{
        "& .MuiToggleButton-root": {
          border: "1px solid #D0D5DD",
          color: "#475467",
          padding: "6px 12px",
          "&.Mui-selected": {
            backgroundColor: "#13715B",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#13715B",
            },
          },
          "&:hover": {
            backgroundColor: "#F9FAFB",
          },
          "&.Mui-disabled": {
            color: "#D0D5DD",
            backgroundColor: "#F9FAFB",
          },
        },
        ...sx,
      }}
    >
      <ToggleButton value="card" aria-label="card view" disableRipple>
        <ViewModuleIcon sx={{ fontSize: "16px" }} />
      </ToggleButton>
      <ToggleButton value="table" aria-label="table view" disableRipple>
        <TableRowsIcon sx={{ fontSize: "16px" }} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewToggle;