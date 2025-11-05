import React, { useMemo } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import Tab from "@mui/material/Tab";
import TabList from "@mui/lab/TabList";
import { createTabLabelWithCount } from "../../utils/tabUtils";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  label: string;
  value: string;
  icon?: keyof typeof LucideIcons;
  count?: number;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (event: React.SyntheticEvent, newValue: string) => void;
  /** Optional custom styles for the tab list container */
  tabListSx?: SxProps<Theme>;
  /** Optional custom styles for individual tabs */
  tabSx?: SxProps<Theme>;
  /** Whether to disable ripple effect on tabs */
  disableRipple?: boolean;
  /** Color for the indicator under active tab */
  indicatorColor?: string;
  /** Optional data attribute for page tours/testing */
  dataJoyrideId?: string;
}

// Constants for consistent styling
const TAB_ICON_SIZE = 14;
const TAB_ICON_STROKE_WIDTH = 1.5;
const TAB_ICON_OPACITY = 1;
const TAB_GAP = "34px";
const DEFAULT_INDICATOR_COLOR = "#13715B";

/**
 * Standardized TabBar component for VerifyWise.
 *
 * Provides consistent styling and behavior across all tabbed interfaces.
 * Automatically handles icons, counts, loading states, and disabled states.
 *
 * @example
 * ```tsx
 * <TabBar
 *   tabs={[
 *     { label: "Profile", value: "profile", icon: "User" },
 *     { label: "Team", value: "team", icon: "Users", count: 5, isLoading: false },
 *     { label: "Settings", value: "settings", icon: "Settings", disabled: true },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={handleTabChange}
 * />
 * ```
 */
const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onChange,
  tabListSx,
  tabSx,
  disableRipple = true,
  indicatorColor = DEFAULT_INDICATOR_COLOR,
  dataJoyrideId,
}) => {
  // Memoize styles to prevent unnecessary recalculations
  const standardTabStyle = useMemo<SxProps<Theme>>(() => ({
    textTransform: "none",
    fontWeight: 400,
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "16px 0 7px",
    minHeight: "20px",
    minWidth: "auto",
    "&.Mui-selected": {
      color: indicatorColor,
    },
    ...tabSx,
  }), [indicatorColor, tabSx]);

  const standardTabListStyle = useMemo<SxProps<Theme>>(() => ({
    minHeight: "20px",
    "& .MuiTabs-flexContainer": {
      columnGap: TAB_GAP,
    },
    ...tabListSx,
  }), [tabListSx]);

  // Validate activeTab exists in tabs array (development warning)
  if (process.env.NODE_ENV === 'development') {
    const validValues = tabs.map(t => t.value);
    if (!validValues.includes(activeTab)) {
      console.warn(
        `TabBar: activeTab "${activeTab}" is not in the tabs array. Valid values: ${validValues.join(', ')}`
      );
    }
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <TabList
        onChange={onChange}
        TabIndicatorProps={{ style: { backgroundColor: indicatorColor } }}
        sx={standardTabListStyle}
        data-joyride-id={dataJoyrideId}
      >
        {tabs.map((tab) => {
          // Dynamically get the icon component from lucide-react
          const IconComponent = tab.icon ? (LucideIcons[tab.icon] as LucideIcon) : undefined;
          const iconElement = IconComponent ? (
            <IconComponent
              size={TAB_ICON_SIZE}
              strokeWidth={TAB_ICON_STROKE_WIDTH}
              opacity={TAB_ICON_OPACITY}
            />
          ) : undefined;

          return (
            <Tab
              key={tab.value}
              label={createTabLabelWithCount({
                label: tab.label,
                icon: iconElement,
                count: tab.count,
                isLoading: tab.isLoading,
              })}
              value={tab.value}
              sx={standardTabStyle}
              disableRipple={disableRipple}
              disabled={tab.disabled}
            />
          );
        })}
      </TabList>
    </Box>
  );
};

export default TabBar;
