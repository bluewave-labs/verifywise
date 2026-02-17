/**
 * ModelDetailPage - Detail page for a single model with lifecycle phases.
 * Route: /model-inventory/models/:id
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  CircularProgress,
  Box,
  useTheme,
  Alert as MuiAlert,
} from "@mui/material";
import { ArrowLeft, Info } from "lucide-react";
import { IModelInventory } from "../../../../domain/interfaces/i.modelInventory";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { usePluginRegistry } from "../../../../application/contexts/PluginRegistry.context";
import { PluginSlot } from "../../../components/PluginSlot";
import { PLUGIN_SLOTS } from "../../../../domain/constants/pluginSlots";
import Chip from "../../../components/Chip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { PageBreadcrumbs } from "../../../components/breadcrumbs/PageBreadcrumbs";
import { EmptyStateMessage } from "../../../components/EmptyStateMessage";

function ModelDetailPage() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const modelId = id ? parseInt(id) : null;

  const [model, setModel] = useState<IModelInventory | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  const { isPluginInstalled } = usePluginRegistry();
  const lifecycleInstalled = isPluginInstalled("model-lifecycle");

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

  if (modelLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: "64px" }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!model) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: "64px", gap: "16px" }}>
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
          p: "20px",
          background: theme.palette.background.main,
        }}
      >
        <Stack sx={{ gap: "16px" }}>
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
            sx={{ gap: "16px" }}
          >
            <Stack sx={{ gap: "6px" }}>
              <Stack direction="row" alignItems="center" sx={{ gap: "12px" }}>
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
              <Stack direction="row" sx={{ gap: "16px" }}>
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

      {lifecycleInstalled ? (
        <PluginSlot
          id={PLUGIN_SLOTS.MODEL_DETAIL_LIFECYCLE}
          slotProps={{ modelId: modelId! }}
        />
      ) : (
        <MuiAlert
          severity="info"
          icon={<Info size={20} />}
          sx={{
            borderRadius: "4px",
            border: `1px solid ${theme.palette.border.light}`,
          }}
        >
          Install the Model Lifecycle plugin from the Plugins page to enable lifecycle tracking.
        </MuiAlert>
      )}
    </Stack>
  );
}

export default ModelDetailPage;
