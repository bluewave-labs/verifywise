/**
 * LifecycleProgressBar - Horizontal progress bar showing completion across all phases.
 * Clickable phase segments to jump to that phase.
 */

import {
  Stack,
  Typography,
  Box,
  Tooltip,
  useTheme,
} from "@mui/material";
import { LifecycleProgress } from "../../../../../domain/interfaces/i.modelLifecycle";

interface LifecycleProgressBarProps {
  progress: LifecycleProgress | null;
  onPhaseClick?: (phaseId: number) => void;
}

function LifecycleProgressBar({
  progress,
  onPhaseClick,
}: LifecycleProgressBarProps) {
  const theme = useTheme();

  if (!progress || progress.phases.length === 0) {
    return null;
  }

  const getPhaseColor = (filled: number, total: number) => {
    if (total === 0) return theme.palette.background.fill;
    if (filled === total) return theme.palette.status.success.text;
    if (filled > 0) return theme.palette.status.info.text;
    return theme.palette.border.light;
  };

  return (
    <Stack sx={{ gap: "12px" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "14px" }}
        >
          Lifecycle Progress
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.tertiary, fontSize: "13px" }}
        >
          {progress.completion_percentage}% complete ({progress.filled_items}/{progress.total_items} items)
        </Typography>
      </Stack>

      {/* Segmented progress bar */}
      <Stack direction="row" sx={{ gap: "6px", width: "100%" }}>
        {progress.phases.map((phase) => {
          const pct = phase.total_items > 0
            ? (phase.filled_items / phase.total_items) * 100
            : 0;
          const color = getPhaseColor(phase.filled_items, phase.total_items);

          return (
            <Tooltip
              key={phase.phase_id}
              title={`${phase.phase_name}: ${phase.filled_items}/${phase.total_items} items`}
              arrow
            >
              <Box
                onClick={() => onPhaseClick?.(phase.phase_id)}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 3,
                  overflow: "hidden",
                  backgroundColor: theme.palette.border.light,
                  cursor: onPhaseClick ? "pointer" : "default",
                  "&:hover": onPhaseClick ? { opacity: 0.8 } : {},
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: `${pct}%`,
                    height: "100%",
                    backgroundColor: color,
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Stack>

      {/* Phase labels */}
      <Stack direction="row" sx={{ gap: "6px", width: "100%" }}>
        {progress.phases.map((phase) => (
          <Typography
            key={phase.phase_id}
            variant="caption"
            sx={{
              flex: 1,
              textAlign: "center",
              fontSize: "11px",
              color: theme.palette.text.tertiary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: onPhaseClick ? "pointer" : "default",
            }}
            onClick={() => onPhaseClick?.(phase.phase_id)}
          >
            {phase.phase_name}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}

export default LifecycleProgressBar;
