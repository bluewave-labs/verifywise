import { Box, Chip } from "@mui/material";
import { ReactNode } from "react";

export interface TabLabelWithCountOptions {
  label: string;
  count?: number;
  showZero?: boolean;
  isLoading?: boolean;
  chipSx?: object;
}

/**
 * Creates a tab label with an optional count badge.
 *
 * @param options - Configuration options for the tab label
 * @param options.label - The text label for the tab
 * @param options.count - Optional count to display in a chip badge
 * @param options.showZero - Whether to show the chip when count is 0 (default: false)
 * @param options.isLoading - Hide the chip during loading states (default: false)
 * @param options.chipSx - Optional custom styles for the chip
 *
 * @returns A ReactNode that can be passed to MUI Tab's label prop
 *
 * @example
 * // Simple usage with count
 * <Tab
 *   label={createTabLabelWithCount({ label: "Vendors", count: 10 })}
 *   value="1"
 * />
 *
 * @example
 * // With loading state
 * <Tab
 *   label={createTabLabelWithCount({
 *     label: "Vendors",
 *     count: vendors.length,
 *     isLoading: isVendorsLoading
 *   })}
 *   value="1"
 * />
 *
 * @example
 * // Tab without count (returns plain string)
 * <Tab label={createTabLabelWithCount({ label: "Settings" })} value="3" />
 * // Or just use a string directly:
 * <Tab label="Settings" value="3" />
 */
export const createTabLabelWithCount = ({
  label,
  count,
  showZero = false,
  isLoading = false,
  chipSx,
}: TabLabelWithCountOptions): ReactNode => {
  const shouldShowChip = !isLoading &&
                         count !== undefined &&
                         (showZero || count > 0);

  // If no chip needed, return plain string for better performance
  if (!shouldShowChip) {
    return label;
  }

  // Return JSX with circular badge
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      {label}
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '22px',
          height: '22px',
          padding: '0 6px',
          fontSize: '10px',
          fontWeight: 600,
          color: '#047857',
          backgroundColor: '#D1FAE5',
          borderRadius: '11px',
          lineHeight: 1,
          ...chipSx, // Allow custom overrides
        }}
      >
        {count! > 99 ? "99+" : count}
      </Box>
    </Box>
  );
};

/**
 * Shorthand version of createTabLabelWithCount for simple use cases.
 *
 * @param label - The text label for the tab
 * @param count - Optional count to display
 * @returns A ReactNode that can be passed to MUI Tab's label prop
 *
 * @example
 * <Tab label={tabLabelWithCount("Vendors", 10)} value="1" />
 */
export const tabLabelWithCount = (label: string, count?: number): ReactNode =>
  createTabLabelWithCount({ label, count });
