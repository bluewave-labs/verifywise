/**
 * LifecycleSidebar - Vertical stepper sidebar showing lifecycle phase navigation.
 * Displays overall progress summary and clickable phase steps with completion indicators.
 */

import { useMemo, useCallback } from "react";
import { Stack, Typography, Box, useTheme } from "@mui/material";
import { Check } from "lucide-react";
import {
  LifecyclePhase,
  LifecycleProgress,
} from "../../../../../domain/interfaces/i.modelLifecycle";

interface LifecycleSidebarProps {
  phases: LifecyclePhase[];
  progress: LifecycleProgress | null;
  activePhaseId: number | null;
  onPhaseSelect: (phaseId: number) => void;
}

function LifecycleSidebar({
  phases,
  progress,
  activePhaseId,
  onPhaseSelect,
}: LifecycleSidebarProps) {
  const theme = useTheme();

  const phaseData = useMemo(() => {
    return phases.map((phase) => {
      const phaseProgress = progress?.phases.find(
        (p) => p.phase_id === phase.id
      );
      return {
        id: phase.id,
        name: phase.name,
        totalItems: phaseProgress?.total_items ?? phase.items?.length ?? 0,
        filledItems: phaseProgress?.filled_items ?? 0,
      };
    });
  }, [phases, progress]);

  const handleClick = useCallback(
    (phaseId: number) => {
      onPhaseSelect(phaseId);
    },
    [onPhaseSelect]
  );

  return (
    <Stack
      sx={{
        width: 280,
        minWidth: 280,
        borderRight: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.alt,
      }}
    >
      {/* Overall progress summary */}
      <Box sx={{ px: "20px", py: "16px", borderBottom: `1px solid ${theme.palette.border.light}` }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "13px",
            color: theme.palette.text.primary,
            mb: "4px",
          }}
        >
          Lifecycle Progress
        </Typography>
        <Typography
          sx={{
            fontSize: "12px",
            color: theme.palette.text.tertiary,
          }}
        >
          {progress?.completion_percentage ?? 0}% complete
          {progress ? ` (${progress.filled_items}/${progress.total_items} items)` : ""}
        </Typography>
      </Box>

      {/* Phase step list */}
      <Stack sx={{ py: "8px" }}>
        {phaseData.map((phase, index) => {
          const isActive = phase.id === activePhaseId;
          const isComplete =
            phase.totalItems > 0 && phase.filledItems === phase.totalItems;
          const hasProgress = phase.filledItems > 0;

          return (
            <Stack
              key={phase.id}
              direction="row"
              alignItems="center"
              onClick={() => handleClick(phase.id)}
              sx={{
                px: "20px",
                py: "10px",
                gap: "12px",
                cursor: "pointer",
                borderLeft: isActive
                  ? `3px solid ${theme.palette.primary.main}`
                  : "3px solid transparent",
                backgroundColor: isActive
                  ? "rgba(19,113,91,0.06)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: isActive
                    ? "rgba(19,113,91,0.06)"
                    : theme.palette.background.accent,
                },
                transition: "background-color 0.15s ease",
              }}
            >
              {/* Step indicator */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isComplete
                    ? theme.palette.primary.main
                    : isActive
                    ? theme.palette.primary.main
                    : theme.palette.background.fill,
                  color: isComplete || isActive ? "#fff" : theme.palette.text.tertiary,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {isComplete ? (
                  <Check size={14} />
                ) : (
                  index + 1
                )}
              </Box>

              {/* Phase name + count */}
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    color: theme.palette.text.primary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {phase.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: hasProgress
                      ? theme.palette.text.secondary
                      : theme.palette.text.tertiary,
                  }}
                >
                  {phase.filledItems}/{phase.totalItems} items
                </Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export default LifecycleSidebar;
