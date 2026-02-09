/**
 * ModelDetailPage - Detail page for a single model with lifecycle phases.
 * Route: /model-inventory/models/:id
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  CircularProgress,
  Box,
  useTheme,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { IModelInventory } from "../../../../domain/interfaces/i.modelInventory";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { useModelLifecycle } from "../../../../application/hooks/useModelLifecycle";
import { useLifecycleProgress } from "../../../../application/hooks/useModelLifecycle";
import LifecyclePhasePanel from "../components/LifecyclePhasePanel";
import LifecycleProgressBar from "../components/LifecycleProgressBar";
import Chip from "../../../components/Chip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { PageBreadcrumbs } from "../../../components/breadcrumbs/PageBreadcrumbs";
import EmptyStateMessage from "../../../components/EmptyStateMessage";

const ModelDetailPage = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const modelId = id ? parseInt(id) : null;

  const [model, setModel] = useState<IModelInventory | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  const { phases, loading: lifecycleLoading, refresh: refreshLifecycle } =
    useModelLifecycle(modelId);
  const { progress, refresh: refreshProgress } = useLifecycleProgress(modelId);

  const phaseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

  // Auto-expand first phase on initial load
  useEffect(() => {
    if (phases.length > 0 && expandedPhases.size === 0) {
      setExpandedPhases(new Set([phases[0].id]));
    }
  }, [phases]);

  const togglePhase = useCallback((phaseId: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Fetch model data
  useEffect(() => {
    if (!modelId) return;
    let cancelled = false;

    const fetchModel = async () => {
      setModelLoading(true);
      try {
        const data = await getEntityById({
          routeUrl: `/modelInventory/${modelId}`,
        });
        if (!cancelled) {
          setModel(data?.data ?? data);
        }
      } catch {
        // model not found
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    };

    fetchModel();
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const handleValueChanged = useCallback(() => {
    refreshLifecycle();
    refreshProgress();
  }, [refreshLifecycle, refreshProgress]);

  const handlePhaseClick = useCallback((phaseId: number) => {
    const el = phaseRefs.current[phaseId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (modelLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!model) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
        <EmptyStateMessage message="Model not found" />
        <CustomizableButton
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/model-inventory")}
          ariaLabel="Back to Model Inventory"
        >
          Back to Model Inventory
        </CustomizableButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={0} sx={{ gap: "16px", maxWidth: "1400px", width: "100%" }}>
      {/* Breadcrumbs */}
      <PageBreadcrumbs />

      {/* Header card */}
      <Box
        sx={{
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: "4px",
          p: "16px",
          background: theme.palette.background.main,
        }}
      >
        <Stack spacing={2}>
          <CustomizableButton
            variant="text"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate("/model-inventory")}
            ariaLabel="Back to Model Inventory"
            sx={{
              alignSelf: "flex-start",
              color: theme.palette.text.secondary,
              textTransform: "none",
            }}
          >
            Back to Model Inventory
          </CustomizableButton>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            spacing={2}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: theme.palette.text.primary,
                  }}
                >
                  {model.model || model.provider_model}
                </Typography>
                <Chip label={model.status} />
              </Stack>
              <Stack direction="row" spacing={2}>
                {model.provider && (
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.tertiary,
                    }}
                  >
                    Provider: <strong>{model.provider}</strong>
                  </Typography>
                )}
                {model.version && (
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.tertiary,
                    }}
                  >
                    Version: <strong>{model.version}</strong>
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* Progress bar */}
      <Box
        sx={{
          p: "16px",
          borderRadius: "4px",
          border: `1px solid ${theme.palette.border.light}`,
          backgroundColor: theme.palette.background.main,
        }}
      >
        <LifecycleProgressBar
          progress={progress}
          onPhaseClick={handlePhaseClick}
        />
      </Box>

      {/* Lifecycle phases */}
      {lifecycleLoading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : (
        <Stack spacing={0}>
          {phases.map((phase, index) => (
            <Box
              key={phase.id}
              ref={(el: HTMLDivElement | null) => {
                phaseRefs.current[phase.id] = el;
              }}
            >
              <LifecyclePhasePanel
                phase={phase}
                modelId={modelId!}
                expanded={expandedPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
                onValueChanged={handleValueChanged}
              />
            </Box>
          ))}
          {phases.length === 0 && (
            <EmptyStateMessage message="No lifecycle phases configured. Contact an administrator to set up the model lifecycle." />
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default ModelDetailPage;
