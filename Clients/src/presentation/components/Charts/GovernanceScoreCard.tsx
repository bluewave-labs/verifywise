import React from "react";
import { Box, Stack, Typography, LinearProgress } from "@mui/material";
import { DASHBOARD_COLORS, TEXT_STYLES } from "../../styles/colors";

const C = DASHBOARD_COLORS;

interface ModuleScore {
  name: string;
  score: number;
  weight: number;
}

interface GovernanceScoreProps {
  score: number;
  modules: ModuleScore[];
}

// Get color based on score value
const getScoreColor = (score: number): string => {
  if (score >= 80) return C.completed; // Green
  if (score >= 60) return C.inProgress; // Amber
  return C.high; // Red
};

// Circular progress component for the main score
const ScoreGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 100 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const scoreColor = getScoreColor(score);

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={C.progressBackground}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {/* Center text */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 700,
            color: scoreColor,
          }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  );
};

// Module progress bar component
const ModuleProgressBar: React.FC<{ module: ModuleScore }> = ({ module }) => {
  const scoreColor = getScoreColor(module.score);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography sx={{ fontSize: 12, color: C.textSecondary }}>
          {module.name}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>
            {module.score}%
          </Typography>
          <Typography sx={{ fontSize: 10, color: C.textSecondary }}>
            ({Math.round(module.weight * 100)}%)
          </Typography>
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={module.score}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: C.progressBackground,
          "& .MuiLinearProgress-bar": {
            backgroundColor: scoreColor,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

export const GovernanceScoreCard: React.FC<GovernanceScoreProps> = ({ score, modules }) => {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={3}>
      {/* Left side: Score gauge */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 1 }}>
        <ScoreGauge score={score} size={100} />
        <Typography sx={{ ...TEXT_STYLES.label, mt: 1, textAlign: "center" }}>
          Overall score
        </Typography>
      </Box>

      {/* Right side: Module breakdown */}
      <Stack gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
        {modules.map((module) => (
          <ModuleProgressBar key={module.name} module={module} />
        ))}
      </Stack>
    </Stack>
  );
};

export default GovernanceScoreCard;
