import { Box, Stack, Typography, LinearProgress } from "@mui/material";
import { StatusDonutChart } from "./StatusDonutChart";
import { DASHBOARD_COLORS, TEXT_STYLES } from "../../styles/colors";

const C = DASHBOARD_COLORS;

// Shared legend item component
function LegendItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Stack direction="row" alignItems="center" gap="8px">
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <Typography sx={TEXT_STYLES.legendItem}>
        {label}: {value}
      </Typography>
    </Stack>
  );
}

// Shared vertical bar component
interface VerticalBarProps {
  label: string;
  value: number;
  color: string;
  max: number;
  barHeight: number;
  barWidth?: number;
  labelSize?: number;
}

function VerticalBar({ label, value, color, max, barHeight, barWidth = 40, labelSize = 11 }: VerticalBarProps) {
  return (
    <Stack alignItems="center" gap={0.5}>
      <Typography sx={TEXT_STYLES.value}>{value}</Typography>
      <Box
        sx={{
          width: barWidth,
          height: (value / max) * barHeight || 4,
          backgroundColor: color,
          borderRadius: "4px 4px 0 0",
          minHeight: 4,
        }}
      />
      <Typography sx={{ fontSize: labelSize, color: C.textSecondary, textAlign: "center" }}>
        {label}
      </Typography>
    </Stack>
  );
}

// Training Completion Card - Progress bar style
interface TrainingCompletionProps {
  total: number;
  distribution: { planned: number; inProgress: number; completed: number };
  completionPercentage: number;
  totalPeople: number;
}

export function TrainingCompletionCard({ distribution }: TrainingCompletionProps) {
  const max = Math.max(distribution.completed, distribution.inProgress, distribution.planned, 1);
  const barHeight = 80;

  const items = [
    { label: "Planned", value: distribution.planned, color: C.draft },
    { label: "In progress", value: distribution.inProgress, color: C.inProgress },
    { label: "Completed", value: distribution.completed, color: C.completed },
  ];

  return (
    <Stack direction="row" justifyContent="space-around" alignItems="flex-end" sx={{ height: barHeight + 40 }}>
      {items.map((item) => (
        <VerticalBar key={item.label} {...item} max={max} barHeight={barHeight} />
      ))}
    </Stack>
  );
};

// Policy Status Card - Donut with legend
interface PolicyStatusProps {
  total: number;
  distribution: {
    draft: number;
    underReview: number;
    approved: number;
    published: number;
    archived: number;
    deprecated: number;
  };
}

export function PolicyStatusCard({ total, distribution }: PolicyStatusProps) {
  const data = [
    { label: "Published", value: distribution.published, color: C.completed },
    { label: "Approved", value: distribution.approved, color: C.approved },
    { label: "Under review", value: distribution.underReview, color: C.inProgress },
    { label: "Draft", value: distribution.draft, color: C.draft },
    { label: "Archived", value: distribution.archived, color: C.archived },
  ].filter((item) => item.value > 0);

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-around">
      <Box sx={{ pt: "8px" }}>
        <StatusDonutChart data={data} total={total} size={100} />
      </Box>
      <Stack gap={0.5} sx={{ pt: "8px" }}>
        {data.map((item) => (
          <LegendItem key={item.label} {...item} />
        ))}
      </Stack>
    </Stack>
  );
};

// Incident Status Card - Vertical bars
interface IncidentStatusProps {
  total: number;
  distribution: { open: number; investigating: number; mitigated: number; closed: number };
}

export function IncidentStatusCard({ distribution }: IncidentStatusProps) {
  const max = Math.max(distribution.open, distribution.investigating, distribution.mitigated, distribution.closed, 1);
  const barHeight = 80;

  const items = [
    { label: "Open", value: distribution.open, color: C.open },
    { label: "Investigating", value: distribution.investigating, color: C.investigating },
    { label: "Mitigated", value: distribution.mitigated, color: C.mitigated },
    { label: "Closed", value: distribution.closed, color: C.closed },
  ];

  return (
    <Stack direction="row" justifyContent="space-around" alignItems="flex-end" sx={{ height: barHeight + 40 }}>
      {items.map((item) => (
        <VerticalBar key={item.label} {...item} max={max} barHeight={barHeight} barWidth={32} labelSize={10} />
      ))}
    </Stack>
  );
};

// Evidence Coverage Card - Progress with counts
interface EvidenceCoverageProps {
  total: number;
  totalFiles: number;
  modelsWithEvidence: number;
  totalModels: number;
  coveragePercentage: number;
}

export function EvidenceCoverageCard({
  total,
  totalFiles,
  modelsWithEvidence,
  totalModels,
  coveragePercentage,
}: EvidenceCoverageProps) {
  return (
  <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography sx={TEXT_STYLES.percentage}>{coveragePercentage}%</Typography>
      <Typography sx={{ fontSize: 12, color: C.textSecondary }}>model coverage</Typography>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={coveragePercentage}
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: C.progressBackground,
        mb: "32px",
        "& .MuiLinearProgress-bar": { backgroundColor: C.primary, borderRadius: 4 },
      }}
    />
    <Stack direction="row" justifyContent="space-between">
      <Stack alignItems="center">
        <Typography sx={TEXT_STYLES.valueSmall}>{total}</Typography>
        <Typography sx={TEXT_STYLES.label}>Evidence items</Typography>
      </Stack>
      <Stack alignItems="center">
        <Typography sx={TEXT_STYLES.valueSmall}>{totalFiles}</Typography>
        <Typography sx={TEXT_STYLES.label}>Files uploaded</Typography>
      </Stack>
      <Stack alignItems="center">
        <Typography sx={{ ...TEXT_STYLES.valueSmall, color: C.primary }}>
          {modelsWithEvidence}/{totalModels}
        </Typography>
        <Typography sx={TEXT_STYLES.label}>Models covered</Typography>
      </Stack>
    </Stack>
  </Box>
  );
}

// Model Lifecycle Card - Donut with legend
interface ModelLifecycleProps {
  total: number;
  distribution: { pending: number; approved: number; restricted: number; blocked: number };
}

export function ModelLifecycleCard({ total, distribution }: ModelLifecycleProps) {
  const data = [
    { label: "Approved", value: distribution.approved, color: C.completed },
    { label: "Pending", value: distribution.pending, color: C.inProgress },
    { label: "Restricted", value: distribution.restricted, color: C.restricted },
    { label: "Blocked", value: distribution.blocked, color: C.blocked },
  ].filter((item) => item.value > 0);

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-around">
      <Box sx={{ pt: "8px" }}>
        <StatusDonutChart data={data} total={total} size={100} />
      </Box>
      <Stack gap={0.5} sx={{ pt: "8px" }}>
        {data.map((item) => (
          <LegendItem key={item.label} {...item} />
        ))}
      </Stack>
    </Stack>
  );
};
