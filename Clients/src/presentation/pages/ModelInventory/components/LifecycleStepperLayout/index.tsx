/**
 * LifecycleStepperLayout - Orchestrator composing sidebar stepper + phase content.
 * Two-column layout: sidebar navigation on left, selected phase content on right.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LifecyclePhase,
  LifecycleProgress,
} from "../../../../../domain/interfaces/i.modelLifecycle";
import LifecycleSidebar from "../LifecycleSidebar";
import LifecyclePhaseContent from "../LifecyclePhaseContent";
import { EmptyStateMessage } from "../../../../components/EmptyStateMessage";

interface LifecycleStepperLayoutProps {
  phases: LifecyclePhase[];
  progress: LifecycleProgress | null;
  modelId: number;
  loading: boolean;
  onValueChanged: () => void;
}

function LifecycleStepperLayout({
  phases,
  progress,
  modelId,
  loading,
  onValueChanged,
}: LifecycleStepperLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null);

  // Auto-select first phase on mount or when phases change
  useEffect(() => {
    if (phases.length > 0 && activePhaseId === null) {
      setActivePhaseId(phases[0].id);
    }
  }, [phases, activePhaseId]);

  const activePhase = useMemo(
    () => phases.find((p) => p.id === activePhaseId) ?? null,
    [phases, activePhaseId]
  );

  const handlePhaseSelect = useCallback((phaseId: number) => {
    setActivePhaseId(phaseId);
  }, []);

  if (loading && phases.length === 0) {
    return (
      <Stack alignItems="center" sx={{ py: 4 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (phases.length === 0) {
    return (
      <EmptyStateMessage message="No lifecycle phases configured. Contact an administrator to set up the model lifecycle." />
    );
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        backgroundColor: theme.palette.background.main,
        overflow: "hidden",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: 400,
      }}
    >
      <Box
        sx={{
          ...(isMobile
            ? { maxHeight: 200, overflowY: "auto", borderBottom: `1px solid ${theme.palette.border.light}` }
            : {}),
        }}
      >
        <LifecycleSidebar
          phases={phases}
          progress={progress}
          activePhaseId={activePhaseId}
          onPhaseSelect={handlePhaseSelect}
        />
      </Box>

      <Box sx={{ flex: 1, display: "flex", minWidth: 0 }}>
        {activePhase ? (
          <LifecyclePhaseContent
            phase={activePhase}
            modelId={modelId}
            onValueChanged={onValueChanged}
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, p: "24px" }}
          >
            <EmptyStateMessage message="Select a phase from the sidebar" />
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default LifecycleStepperLayout;
