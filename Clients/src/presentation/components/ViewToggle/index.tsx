import React from "react";
import { ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";

import {
  LayoutGrid as ViewModuleIcon,
  List as TableRowsIcon,
} from "lucide-react";
import {
  IViewMode,
  IViewToggleProps,
} from "../../../domain/interfaces/i.toggle";

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
const ViewToggle: React.FC<IViewToggleProps> = ({
  viewMode,
  onViewChange,
  disabled = false,
  size = "small",
  sx,
}) => {
  const theme = useTheme();
  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: IViewMode | null
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
      sx={[
        {
          "& .MuiToggleButton-root": {
            border: `1px solid ${theme.palette.border.dark}`,
            color: theme.palette.text.tertiary,
            padding: "6px 12px",
            "&.Mui-selected": {
              backgroundColor: "#13715B",
              color: theme.palette.background.main,
              "&:hover": {
                backgroundColor: "#13715B",
              },
            },
            "&:hover": {
              backgroundColor: theme.palette.background.accent,
            },
            "&.Mui-disabled": {
              color: theme.palette.border.dark,
              backgroundColor: theme.palette.background.accent,
            },
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <ToggleButton value="card" aria-label="card view" disableRipple>
        <ViewModuleIcon size={16} />
      </ToggleButton>
      <ToggleButton value="table" aria-label="table view" disableRipple>
        <TableRowsIcon size={16} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewToggle;
