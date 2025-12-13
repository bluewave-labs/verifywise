/**
 * @fileoverview DeadlineWarningBox Component
 *
 * Main deadline warning box component that displays deadline counts
 * and provides filtering capabilities. Integrates with the deadline
 * analytics API and manages loading/error states.
 *
 * @package components/DeadlineWarningBox
 */

import React, { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Fade,
  Slide,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  RefreshCw,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";

import useDeadlineWarnings from "../../hooks/useDeadlineWarnings";
import { DeadlineWarningBoxProps } from "./types";
import DeadlineChip from "./DeadlineChip";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

/**
 * Main deadline warning box component
 *
 * @param props - Component props
 * @returns JSX element or null if hidden
 */
export const DeadlineWarningBox: React.FC<DeadlineWarningBoxProps> = ({
  refreshInterval = 60000,
  animations = true,
  maxVisibleChips = 3,
  darkMode = true,
  onFilterClick,
  onRetry,
  className,
  style,
  hideWhenEmpty = true,
  showLoadingSkeleton = true,
}) => {
  const theme = useTheme();

  // Use the deadline warnings hook
  const {
    data,
    loadingState,
    error,
    totalOverdue,
    totalDueSoon,
    hasWarnings,
    retry,
    refresh,
    toggleFilter,
    activeFilters,
  } = useDeadlineWarnings({
    refreshInterval,
  });

  // Generate deadline chips from analytics data
  const deadlineChips = useMemo(() => {
    if (!data) return [];

    const chips: Array<{
      count: number;
      severity: "overdue" | "dueSoon";
      entityType: string;
    }> = [];

    // Process each entity type
    Object.entries(data).forEach(([entityType, entityData]) => {
      if (entityType.startsWith("total") || entityType === "lastUpdated") return;

      const entityInfo = entityData as any;
      if (entityInfo?.overdue > 0) {
        chips.push({
          count: entityInfo.overdue,
          severity: "overdue",
          entityType,
        });
      }
      if (entityInfo?.dueSoon > 0) {
        chips.push({
          count: entityInfo.dueSoon,
          severity: "dueSoon",
          entityType,
        });
      }
    });

    // Sort by severity (overdue first) and count (highest first)
    return chips.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === "overdue" ? -1 : 1;
      }
      return b.count - a.count;
    });
  }, [data]);

  // Determine if component should be hidden
  const shouldHide = useMemo(() => {
    if (!hideWhenEmpty) return false;
    if (loadingState === "loading") return false;
    if (loadingState === "error") return false;
    return !hasWarnings;
  }, [hideWhenEmpty, loadingState, hasWarnings]);

  // Handle chip click
  const handleChipClick = (severity: "overdue" | "dueSoon", entityType: string) => {
    onFilterClick?.(severity, entityType);
  };

  // Handle retry button click
  const handleRetry = () => {
    onRetry?.();
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refresh?.();
  };

  // Check if a specific chip is selected
  const isChipSelected = (severity: "overdue" | "dueSoon", entityType: string) => {
    return activeFilters[entityType]?.[severity] === true;
  };

  // Render loading state
  if (loadingState === "loading") {
    return (
      <Fade in={true} timeout={animations ? 300 : 0}>
        <Box className={className} style={style}>
          <LoadingState
            showSkeleton={showLoadingSkeleton}
            skeletonCount={Math.min(maxVisibleChips, 3)}
          />
        </Box>
      </Fade>
    );
  }

  // Render error state
  if (loadingState === "error" && error) {
    return (
      <Fade in={true} timeout={animations ? 300 : 0}>
        <Box className={className} style={style}>
          <ErrorState
            error={error}
            onRetry={handleRetry}
            showDetails={false}
          />
        </Box>
      </Fade>
    );
  }

  // Hide component if no warnings
  if (shouldHide) {
    return null;
  }

  // Calculate remaining chips count
  const visibleChips = deadlineChips.slice(0, maxVisibleChips);
  const remainingCount = deadlineChips.length - maxVisibleChips;

  return (
    <Fade in={true} timeout={animations ? 400 : 0}>
      <Box
        className={className}
        style={style}
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius * 2,
          boxShadow: theme.shadows[1],
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header with title and actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: totalOverdue > 0
                    ? theme.palette.error.main
                    : theme.palette.warning.main,
                  color: "#ffffff",
                }}
              >
                <AlertTriangle size={18} />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Deadline Warnings
              </Typography>

              {data?.lastUpdated && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.75rem",
                  }}
                >
                  Updated {new Date(data.lastUpdated).toLocaleTimeString()}
                </Typography>
              )}
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <RefreshCw size={16} />
                </IconButton>
              </Tooltip>

              {/* Optional: Dismiss button for temporary snooze */}
              <Tooltip title="Dismiss temporarily">
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <X size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Chips section */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {/* Render visible chips */}
            <Slide
              in={true}
              direction="up"
              timeout={animations ? { enter: 400, exit: 200 } : 0}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {visibleChips.map((chip, index) => (
                  <Slide
                    key={`${chip.entityType}-${chip.severity}`}
                    in={true}
                    direction="up"
                    timeout={animations ? { enter: 300 + index * 50, exit: 200 } : 0}
                  >
                    <Box>
                      <DeadlineChip
                        count={chip.count}
                        severity={chip.severity}
                        entityType={chip.entityType}
                        onClick={() => handleChipClick(chip.severity, chip.entityType)}
                        isSelected={isChipSelected(chip.severity, chip.entityType)}
                        size="medium"
                        variant="default"
                      />
                    </Box>
                  </Slide>
                ))}

                {/* Show "more" chip if there are additional items */}
                {remainingCount > 0 && (
                  <Slide
                    in={true}
                    direction="up"
                    timeout={animations ? { enter: 400 + visibleChips.length * 50, exit: 200 } : 0}
                  >
                    <Box>
                      <DeadlineChip
                        count={remainingCount}
                        severity="overdue"
                        entityType="more"
                        onClick={() => {
                          // TODO: Implement "show all" functionality
                        }}
                        isSelected={false}
                        size="medium"
                        variant="outlined"
                      />
                    </Box>
                  </Slide>
                )}
              </Stack>
            </Slide>
          </Stack>
        </Box>

        {/* Active filters indicator */}
        {Object.keys(activeFilters).length > 0 && (
          <Box
            sx={{
              px: 2,
              py: 1,
              backgroundColor: theme.palette.primary.light + "10",
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Info size={14} color={theme.palette.primary.main} />
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: "0.75rem",
                }}
              >
                {Object.keys(activeFilters).length} filter{Object.keys(activeFilters).length !== 1 ? "s" : ""} active
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default DeadlineWarningBox;