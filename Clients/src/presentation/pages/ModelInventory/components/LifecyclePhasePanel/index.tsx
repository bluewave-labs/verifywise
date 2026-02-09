/**
 * LifecyclePhasePanel - Accordion section for one lifecycle phase.
 * Shows phase name, description, completion indicator, and item fields.
 */

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import { LifecyclePhase } from "../../../../../domain/interfaces/i.modelLifecycle";
import LifecycleItemField from "../LifecycleItemField";
import Chip from "../../../../components/Chip";
import EmptyStateMessage from "../../../../components/EmptyStateMessage";

interface LifecyclePhasePanelProps {
  phase: LifecyclePhase;
  modelId: number;
  expanded: boolean;
  onToggle: () => void;
  onValueChanged?: () => void;
}

const LifecyclePhasePanel = ({
  phase,
  modelId,
  expanded,
  onToggle,
  onValueChanged,
}: LifecyclePhasePanelProps) => {
  const theme = useTheme();

  const items = phase.items ?? [];
  const totalItems = items.length;
  const filledItems = items.filter((item) => {
    const val = item.value;
    if (!val) return false;
    if (val.value_text) return true;
    if (val.value_json) return true;
    if (val.files && val.files.length > 0) return true;
    return false;
  }).length;

  const isComplete = totalItems > 0 && filledItems === totalItems;
  const chipVariant = isComplete ? "success" : filledItems > 0 ? "info" : "default";

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px !important",
        "&:before": { display: "none" },
        boxShadow: "none",
        mb: "12px",
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={
          <ChevronRight
            size={16}
            style={{
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              color: theme.palette.text.secondary,
            }}
          />
        }
        sx={{
          backgroundColor: expanded
            ? theme.palette.background.accent
            : theme.palette.background.main,
          "&:hover": { backgroundColor: theme.palette.background.accent },
          px: "16px",
          py: "10px",
          "& .MuiAccordionSummary-expandIconWrapper": {
            transform: "none !important",
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ width: "100%", gap: "12px" }}
        >
          <Stack sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "14px",
              }}
            >
              {phase.name}
            </Typography>
            {phase.description && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.tertiary,
                  fontSize: "12px",
                  mt: "4px",
                }}
              >
                {phase.description}
              </Typography>
            )}
          </Stack>
          <Chip
            label={`${filledItems} / ${totalItems}`}
            variant={chipVariant}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Stack spacing={0} divider={<Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }} />}>
          {items.map((item) => (
            <Stack
              key={item.id}
              sx={{ px: "16px", py: "16px" }}
            >
              <Stack direction="row" alignItems="center" sx={{ mb: "8px", gap: "8px" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: "13px",
                  }}
                >
                  {item.name}
                </Typography>
                {item.is_required && (
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.status.error.text, fontSize: "11px" }}
                  >
                    Required
                  </Typography>
                )}
              </Stack>
              {item.description && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.tertiary,
                    mb: "8px",
                    display: "block",
                    fontSize: "12px",
                  }}
                >
                  {item.description}
                </Typography>
              )}
              <LifecycleItemField
                modelId={modelId}
                item={item}
                onValueChanged={onValueChanged}
              />
            </Stack>
          ))}
          {items.length === 0 && (
            <EmptyStateMessage message="No items configured for this phase" />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default LifecyclePhasePanel;
