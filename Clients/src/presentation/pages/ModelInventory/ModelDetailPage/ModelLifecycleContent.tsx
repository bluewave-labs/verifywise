/**
 * ModelLifecycleContent - Standalone plugin component for the lifecycle slot.
 *
 * Receives modelId via slot props and internally wires up all lifecycle hooks.
 * Provides a toggle to switch between Accordion and Stepper views.
 */

import { useState, useCallback, useRef } from "react";
import {
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from "@mui/material";
import { List, GitCommitVertical } from "lucide-react";
import { useModelLifecycle, useLifecycleProgress } from "../../../../application/hooks/useModelLifecycle";
import LifecycleStepperLayout from "../components/LifecycleStepperLayout";
import LifecycleProgressBar from "../components/LifecycleProgressBar";
import LifecyclePhasePanel from "../components/LifecyclePhasePanel";

interface ModelLifecycleContentProps {
  modelId: number;
}

type ViewMode = "accordion" | "stepper";

export default function ModelLifecycleContent({ modelId }: ModelLifecycleContentProps) {
  const theme = useTheme();
  const { phases, loading, refresh } = useModelLifecycle(modelId);
  const { progress, refresh: refreshProgress } = useLifecycleProgress(modelId);

  const [viewMode, setViewMode] = useState<ViewMode>("accordion");
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(() => {
    return new Set();
  });

  // Refs for scrolling to phases on progress bar click
  const phaseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleValueChanged = useCallback(() => {
    refresh();
    refreshProgress();
  }, [refresh, refreshProgress]);

  const handleViewModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
      if (newMode) setViewMode(newMode);
    },
    []
  );

  const togglePhase = useCallback((phaseId: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }, []);

  const handlePhaseClick = useCallback((phaseId: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.add(phaseId);
      return next;
    });
    const el = phaseRefs.current.get(phaseId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Auto-expand first phase on initial load
  const firstPhaseId = phases[0]?.id;
  if (firstPhaseId !== undefined && expandedPhases.size === 0 && phases.length > 0) {
    setExpandedPhases(new Set([firstPhaseId]));
  }

  return (
    <Stack sx={{ gap: "16px" }}>
      {/* View toggle */}
      <Stack direction="row" justifyContent="flex-end">
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: "12px",
              py: "4px",
              fontSize: "13px",
              textTransform: "none",
              gap: "6px",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.border.light,
              "&.Mui-selected": {
                backgroundColor: theme.palette.background.accent,
                color: theme.palette.text.primary,
              },
            },
          }}
        >
          <ToggleButton value="accordion" aria-label="Accordion view">
            <List size={16} />
            Accordion
          </ToggleButton>
          <ToggleButton value="stepper" aria-label="Stepper view">
            <GitCommitVertical size={16} />
            Stepper
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Views */}
      {viewMode === "accordion" ? (
        <Stack sx={{ gap: "16px" }}>
          <LifecycleProgressBar
            progress={progress}
            onPhaseClick={handlePhaseClick}
          />
          {phases.map((phase) => (
            <div
              key={phase.id}
              ref={(el) => {
                if (el) phaseRefs.current.set(phase.id, el);
                else phaseRefs.current.delete(phase.id);
              }}
            >
              <LifecyclePhasePanel
                phase={phase}
                modelId={modelId}
                expanded={expandedPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
                onValueChanged={handleValueChanged}
              />
            </div>
          ))}
        </Stack>
      ) : (
        <LifecycleStepperLayout
          phases={phases}
          progress={progress}
          modelId={modelId}
          loading={loading}
          onValueChanged={handleValueChanged}
        />
      )}
    </Stack>
  );
}
