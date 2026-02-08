/**
 * LifecyclePhasePanel - Accordion section for one lifecycle phase.
 * Shows phase name, description, completion indicator, and item fields.
 */

import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Typography,
  Box,
  Chip,
  useTheme,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import { LifecyclePhase } from "../../../../../domain/interfaces/i.modelLifecycle";
import LifecycleItemField from "../LifecycleItemField";

interface LifecyclePhasePanelProps {
  phase: LifecyclePhase;
  modelId: number;
  defaultExpanded?: boolean;
  onValueChanged?: () => void;
}

const LifecyclePhasePanel = ({
  phase,
  modelId,
  defaultExpanded = false,
  onValueChanged,
}: LifecyclePhasePanelProps) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

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

  const getCompletionColor = () => {
    if (isComplete) return theme.palette.status.success.text;
    if (filledItems > 0) return theme.palette.status.info.text;
    return theme.palette.text.tertiary;
  };

  const getCompletionBg = () => {
    if (isComplete) return theme.palette.status.success.bg;
    if (filledItems > 0) return theme.palette.status.info.bg;
    return theme.palette.background.fill;
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      disableGutters
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "8px !important",
        "&:before": { display: "none" },
        boxShadow: "none",
        mb: 1.5,
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={
          <ChevronRight
            size={18}
            style={{
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: theme.palette.text.secondary,
            }}
          />
        }
        sx={{
          backgroundColor: expanded
            ? theme.palette.background.accent
            : theme.palette.background.main,
          "&:hover": { backgroundColor: theme.palette.background.accent },
          px: 2,
          py: 0.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%" }}
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
                  mt: 0.25,
                }}
              >
                {phase.description}
              </Typography>
            )}
          </Stack>
          <Chip
            label={`${filledItems} / ${totalItems}`}
            size="small"
            sx={{
              backgroundColor: getCompletionBg(),
              color: getCompletionColor(),
              fontWeight: 600,
              fontSize: "12px",
              minWidth: 48,
            }}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Stack spacing={0} divider={<Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }} />}>
          {items.map((item) => (
            <Stack
              key={item.id}
              sx={{ px: 2, py: 1.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
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
                    mb: 1,
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
            <Typography
              variant="body2"
              sx={{ p: 2, color: theme.palette.text.tertiary, textAlign: "center" }}
            >
              No items configured for this phase
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default LifecyclePhasePanel;
