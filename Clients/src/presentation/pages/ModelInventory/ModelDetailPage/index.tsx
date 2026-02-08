/**
 * ModelDetailPage - Detail page for a single model with lifecycle phases.
 * Route: /model-inventory/models/:id
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  Button,
  Chip,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return { bg: theme.palette.status.success.bg, text: theme.palette.status.success.text };
      case "Blocked":
        return { bg: theme.palette.status.error.bg, text: theme.palette.status.error.text };
      case "Restricted":
        return { bg: theme.palette.status.warning.bg, text: theme.palette.status.warning.text };
      default:
        return { bg: theme.palette.background.fill, text: theme.palette.text.secondary };
    }
  };

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
        <Typography variant="h6" color="text.secondary">
          Model not found
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/model-inventory")}
        >
          Back to Model Inventory
        </Button>
      </Stack>
    );
  }

  const statusColors = getStatusColor(model.status);

  return (
    <Stack spacing={3} sx={{ p: 0 }}>
      {/* Header */}
      <Stack spacing={2}>
        <Button
          variant="text"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/model-inventory")}
          sx={{
            alignSelf: "flex-start",
            color: theme.palette.text.secondary,
            textTransform: "none",
            "&:hover": { backgroundColor: theme.palette.background.accent },
          }}
        >
          Back to Model Inventory
        </Button>

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
                variant="h5"
                sx={{ fontWeight: 600, color: theme.palette.text.primary }}
              >
                {model.model || model.provider_model}
              </Typography>
              <Chip
                label={model.status}
                size="small"
                sx={{
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                  fontWeight: 600,
                  fontSize: "12px",
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              {model.provider && (
                <Typography variant="body2" color="text.secondary">
                  Provider: <strong>{model.provider}</strong>
                </Typography>
              )}
              {model.version && (
                <Typography variant="body2" color="text.secondary">
                  Version: <strong>{model.version}</strong>
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {/* Progress bar */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
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
                defaultExpanded={index === 0}
                onValueChanged={handleValueChanged}
              />
            </Box>
          ))}
          {phases.length === 0 && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No lifecycle phases configured. Contact an administrator to set up the model lifecycle.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default ModelDetailPage;
