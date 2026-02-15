/**
 * @fileoverview Reusable Column Selector Component
 *
 * A dropdown menu for selecting which columns to display in any table.
 * Works with the useColumnVisibility hook.
 *
 * @module presentation/components/Table/ColumnSelector
 *
 * @example
 * const { visibleColumns, allColumns, toggleColumn, resetToDefaults } = useColumnVisibility({
 *   tableId: "my-table",
 *   columns: MY_COLUMNS,
 * });
 *
 * <ColumnSelector
 *   columns={allColumns}
 *   visibleColumns={visibleColumns}
 *   onToggleColumn={toggleColumn}
 *   onResetToDefaults={resetToDefaults}
 * />
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Popover,
  Typography,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import { Columns } from "lucide-react";
import { ColumnConfig } from "../../../../application/hooks/useColumnVisibility";

interface ColumnSelectorProps<TKey extends string = string> {
  /** All available column configurations */
  columns: ColumnConfig<TKey>[];
  /** Set of currently visible column keys */
  visibleColumns: Set<TKey>;
  /** Callback when a column is toggled */
  onToggleColumn: (column: TKey) => void;
  /** Callback to reset to default visibility */
  onResetToDefaults: () => void;
  /** Optional button text (default: "Columns") */
  buttonText?: string;
  /** Optional button variant */
  variant?: "text" | "outlined" | "contained";
}

/**
 * Reusable Column Selector Component
 *
 * Renders a button that opens a popover with checkboxes for each column.
 * Columns marked as alwaysVisible cannot be unchecked.
 */
export function ColumnSelector<TKey extends string = string>({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetToDefaults,
  buttonText = "Columns",
  variant = "outlined",
}: ColumnSelectorProps<TKey>): React.ReactElement {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Count visible vs total (excluding always visible)
  const toggleableColumns = columns.filter((c) => !c.alwaysVisible);
  const visibleToggleableCount = toggleableColumns.filter((c) =>
    visibleColumns.has(c.key)
  ).length;

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        startIcon={<Columns size={16} />}
        sx={{
          height: 34,
          minWidth: 100,
          padding: "6px 12px",
          borderRadius: "4px",
          border: variant === "outlined" ? `1px solid ${theme.palette.border.dark}` : undefined,
          backgroundColor: variant === "outlined" ? theme.palette.background.main : undefined,
          color: theme.palette.text.secondary,
          fontSize: 13,
          fontWeight: 500,
          textTransform: "none",
          "&:hover": {
            backgroundColor: variant === "outlined" ? theme.palette.background.accent : undefined,
            borderColor: variant === "outlined" ? "#98A2B3" : undefined,
          },
        }}
      >
        {buttonText}
        {toggleableColumns.length > 0 && (
          <Typography
            component="span"
            sx={{
              ml: 0.5,
              fontSize: 12,
              color: theme.palette.other.icon,
            }}
          >
            ({visibleToggleableCount}/{toggleableColumns.length})
          </Typography>
        )}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              maxWidth: 280,
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
              borderRadius: "4px",
              border: "1px solid #E0E4E9",
            },
          },
        }}
      >
        <Box sx={{ padding: "12px 16px" }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#101828",
              mb: 0.5,
            }}
          >
            Show columns
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.other.icon,
            }}
          >
            Select which columns to display
          </Typography>
        </Box>

        <Divider />

        <Stack sx={{ padding: "8px 0", maxHeight: 300, overflowY: "auto" }}>
          {columns.map((column) => (
            <Box
              key={column.key}
              onClick={() => {
                if (!column.alwaysVisible) {
                  onToggleColumn(column.key);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                cursor: column.alwaysVisible ? "not-allowed" : "pointer",
                opacity: column.alwaysVisible ? 0.6 : 1,
                "&:hover": {
                  backgroundColor: column.alwaysVisible
                    ? "transparent"
                    : theme.palette.background.accent,
                },
              }}
            >
              <Checkbox
                checked={visibleColumns.has(column.key)}
                disabled={column.alwaysVisible}
                onChange={(e) => {
                  e.stopPropagation();
                  if (!column.alwaysVisible) {
                    onToggleColumn(column.key);
                  }
                }}
                size="small"
                sx={{
                  padding: 0,
                  marginRight: 1.5,
                  color: theme.palette.border.dark,
                  "&.Mui-checked": {
                    color: theme.palette.primary.main,
                  },
                  "&.Mui-disabled": {
                    color: theme.palette.border.dark,
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: 13,
                  color: theme.palette.text.secondary,
                }}
              >
                {column.label}
              </Typography>
              {column.alwaysVisible && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#98A2B3",
                    ml: "auto",
                  }}
                >
                  Required
                </Typography>
              )}
            </Box>
          ))}
        </Stack>

        <Divider />

        <Box sx={{ padding: "8px 16px" }}>
          <Button
            onClick={() => {
              onResetToDefaults();
              handleClose();
            }}
            fullWidth
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.palette.other.icon,
              textTransform: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: theme.palette.background.accent,
                color: theme.palette.text.secondary,
              },
            }}
          >
            Reset to defaults
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default ColumnSelector;
