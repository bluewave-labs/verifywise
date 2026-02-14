/**
 * LifecyclePhaseContent - Renders the content area for a selected lifecycle phase.
 * Shows phase name, description, and item fields without accordion wrapping.
 */

import { Stack, Typography, Box, useTheme } from "@mui/material";
import { LifecyclePhase } from "../../../../../domain/interfaces/i.modelLifecycle";
import LifecycleItemField from "../LifecycleItemField";
import { EmptyStateMessage } from "../../../../components/EmptyStateMessage";

interface LifecyclePhaseContentProps {
  phase: LifecyclePhase;
  modelId: number;
  onValueChanged?: () => void;
}

function LifecyclePhaseContent({
  phase,
  modelId,
  onValueChanged,
}: LifecyclePhaseContentProps) {
  const theme = useTheme();
  const items = phase.items ?? [];

  return (
    <Stack sx={{ flex: 1, overflowY: "auto", p: "24px", gap: "16px" }}>
      {/* Phase header */}
      <Stack sx={{ gap: "4px" }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "16px",
            color: theme.palette.text.primary,
          }}
        >
          {phase.name}
        </Typography>
        {phase.description && (
          <Typography
            sx={{
              fontSize: "13px",
              color: theme.palette.text.tertiary,
            }}
          >
            {phase.description}
          </Typography>
        )}
      </Stack>

      <Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }} />

      {/* Item list */}
      {items.length > 0 ? (
        <Stack
          spacing={0}
          divider={
            <Box
              sx={{ borderTop: `1px solid ${theme.palette.border.light}` }}
            />
          }
        >
          {items.map((item) => (
            <Stack key={item.id} sx={{ py: "16px", gap: "10px" }}>
              <Stack direction="row" alignItems="center" sx={{ gap: "8px" }}>
                <Typography
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
                    sx={{
                      color: theme.palette.status.error.text,
                      fontSize: "11px",
                    }}
                  >
                    Required
                  </Typography>
                )}
              </Stack>
              {item.description && (
                <Typography
                  sx={{
                    color: theme.palette.text.tertiary,
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
        </Stack>
      ) : (
        <EmptyStateMessage message="No items configured for this phase" />
      )}
    </Stack>
  );
}

export default LifecyclePhaseContent;
