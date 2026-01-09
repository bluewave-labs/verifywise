import React from "react";
import { Box, Stack, Typography, LinearProgress } from "@mui/material";
import StatusDonutChart from "./StatusDonutChart";

// Training Completion Card - Progress bar style
interface TrainingCompletionProps {
  total: number;
  distribution: {
    planned: number;
    inProgress: number;
    completed: number;
  };
  completionPercentage: number;
  totalPeople: number;
}

export const TrainingCompletionCard: React.FC<TrainingCompletionProps> = ({
  distribution,
}) => {
  const max = Math.max(distribution.completed, distribution.inProgress, distribution.planned, 1);
  const barHeight = 80;

  const items = [
    { label: "Planned", value: distribution.planned, color: "#6B7280" },
    { label: "In progress", value: distribution.inProgress, color: "#F59E0B" },
    { label: "Completed", value: distribution.completed, color: "#10B981" },
  ];

  return (
    <Stack direction="row" justifyContent="space-around" alignItems="flex-end" sx={{ height: barHeight + 40 }}>
      {items.map((item) => (
        <Stack key={item.label} alignItems="center" gap={0.5}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
            {item.value}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: (item.value / max) * barHeight || 4,
              backgroundColor: item.color,
              borderRadius: "4px 4px 0 0",
              minHeight: 4,
            }}
          />
          <Typography sx={{ fontSize: 11, color: "#667085", textAlign: "center" }}>
            {item.label}
          </Typography>
        </Stack>
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

export const PolicyStatusCard: React.FC<PolicyStatusProps> = ({ total, distribution }) => {
  const data = [
    { label: "Published", value: distribution.published, color: "#10B981" },
    { label: "Approved", value: distribution.approved, color: "#22C55E" },
    { label: "Under review", value: distribution.underReview, color: "#F59E0B" },
    { label: "Draft", value: distribution.draft, color: "#6B7280" },
    { label: "Archived", value: distribution.archived, color: "#9CA3AF" },
  ].filter((item) => item.value > 0);

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-around">
      <Box sx={{ pt: "8px" }}>
        <StatusDonutChart data={data} total={total} size={100} />
      </Box>
      <Stack gap={0.5} sx={{ pt: "8px" }}>
        {data.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" gap="8px">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              {item.label}: {item.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

// Incident Status Card - Vertical bars
interface IncidentStatusProps {
  total: number;
  distribution: {
    open: number;
    investigating: number;
    mitigated: number;
    closed: number;
  };
}

export const IncidentStatusCard: React.FC<IncidentStatusProps> = ({ distribution }) => {
  const max = Math.max(distribution.open, distribution.investigating, distribution.mitigated, distribution.closed, 1);
  const barHeight = 80;

  const items = [
    { label: "Open", value: distribution.open, color: "#EF4444" },
    { label: "Investigating", value: distribution.investigating, color: "#F59E0B" },
    { label: "Mitigated", value: distribution.mitigated, color: "#3B82F6" },
    { label: "Closed", value: distribution.closed, color: "#10B981" },
  ];

  return (
    <Stack direction="row" justifyContent="space-around" alignItems="flex-end" sx={{ height: barHeight + 40 }}>
      {items.map((item) => (
        <Stack key={item.label} alignItems="center" gap={0.5}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
            {item.value}
          </Typography>
          <Box
            sx={{
              width: 32,
              height: (item.value / max) * barHeight || 4,
              backgroundColor: item.color,
              borderRadius: "4px 4px 0 0",
              minHeight: 4,
            }}
          />
          <Typography sx={{ fontSize: 10, color: "#667085", textAlign: "center" }}>
            {item.label}
          </Typography>
        </Stack>
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

export const EvidenceCoverageCard: React.FC<EvidenceCoverageProps> = ({
  total,
  totalFiles,
  modelsWithEvidence,
  totalModels,
  coveragePercentage,
}) => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#667085" }}>
          {coveragePercentage}%
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#667085" }}>
          model coverage
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={coveragePercentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "#E5E7EB",
          mb: "32px",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#13715B",
            borderRadius: 4,
          },
        }}
      />
      <Stack direction="row" justifyContent="space-between">
        <Stack alignItems="center">
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
            {total}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#667085" }}>Evidence items</Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
            {totalFiles}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#667085" }}>Files uploaded</Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#13715B" }}>
            {modelsWithEvidence}/{totalModels}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#667085" }}>Models covered</Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

// Model Lifecycle Card - Donut with legend
interface ModelLifecycleProps {
  total: number;
  distribution: {
    pending: number;
    approved: number;
    restricted: number;
    blocked: number;
  };
}

export const ModelLifecycleCard: React.FC<ModelLifecycleProps> = ({ total, distribution }) => {
  const data = [
    { label: "Approved", value: distribution.approved, color: "#10B981" },
    { label: "Pending", value: distribution.pending, color: "#F59E0B" },
    { label: "Restricted", value: distribution.restricted, color: "#F97316" },
    { label: "Blocked", value: distribution.blocked, color: "#EF4444" },
  ].filter((item) => item.value > 0);

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-around">
      <Box sx={{ pt: "8px" }}>
        <StatusDonutChart data={data} total={total} size={100} />
      </Box>
      <Stack gap={0.5} sx={{ pt: "8px" }}>
        {data.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" gap="8px">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              {item.label}: {item.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
