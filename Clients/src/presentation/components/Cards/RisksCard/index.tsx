import { Stack, Typography, Tooltip, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
  trendIndicator,
  trendIconUp,
  trendIconDown,
  trendIconStable,
} from "./style";
import { risksSummary, EnhancedRiskSummary, RiskTrend } from "../../../../domain/interfaces/iRiskSummary";

interface RisksCardProps {
  risksSummary: risksSummary | EnhancedRiskSummary;
  onRiskLevelClick?: (level: string) => void;
}

const RisksCard = ({ risksSummary, onRiskLevelClick }: RisksCardProps) => {
  const getValidRiskValue = (value: number) => (isNaN(value) ? 0 : value);

  const renderTrendIndicator = (trend?: RiskTrend) => {
    if (!trend || trend.direction === 'stable') {
      return (
        <Typography sx={trendIndicator}>
          <TrendingFlatIcon sx={trendIconStable} />
          <span style={{ color: "#6B7280" }}>
            {trend?.change === 0 ? "0" : "—"}
          </span>
        </Typography>
      );
    }

    if (trend.direction === 'up') {
      return (
        <Typography sx={trendIndicator}>
          <TrendingUpIcon sx={trendIconUp} />
          <span style={{ color: "#EF4444" }}>
            +{trend.change}
          </span>
        </Typography>
      );
    }

    return (
      <Typography sx={trendIndicator}>
        <TrendingDownIcon sx={trendIconDown} />
        <span style={{ color: "#10B981" }}>
          -{Math.abs(trend.change)}
        </span>
      </Typography>
    );
  };

  const getTrendTooltip = (trend?: RiskTrend, level: string) => {
    if (!trend) return "";
    const direction = trend.direction === 'up' ? 'increased' : 
                     trend.direction === 'down' ? 'decreased' : 'remained stable';
    return `${level} risks have ${direction} by ${Math.abs(trend.change)} this ${trend.period}`;
  };

  const enhancedSummary = risksSummary as EnhancedRiskSummary;

  const riskLevels = [
    {
      key: "veryHigh",
      label: "Very High",
      value: risksSummary.veryHighRisks,
      color: "#C63622",
      trend: enhancedSummary.trends?.veryHighTrend,
    },
    {
      key: "high",
      label: "High", 
      value: risksSummary.highRisks,
      color: "#D68B61",
      trend: enhancedSummary.trends?.highTrend,
    },
    {
      key: "medium",
      label: "Medium",
      value: risksSummary.mediumRisks,
      color: "#D6B971",
      trend: enhancedSummary.trends?.mediumTrend,
    },
    {
      key: "low",
      label: "Low",
      value: risksSummary.lowRisks,
      color: "#52AB43",
      trend: enhancedSummary.trends?.lowTrend,
    },
    {
      key: "veryLow",
      label: "Very Low",
      value: risksSummary.veryLowRisks,
      color: "#B8D39C",
      trend: enhancedSummary.trends?.veryLowTrend,
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 2,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <AssessmentIcon sx={{ fontSize: 18, color: "#13715B" }} />
        Risk Summary
      </Typography>

      <Stack className="vw-project-risks" sx={{ ...projectRisksCard, flex: 1 }}>
        {riskLevels.map((level) => (
          <Tooltip
            key={level.key}
            title={getTrendTooltip(level.trend, level.label)}
            arrow
            placement="top"
          >
            <Stack
              className="vw-project-risks-tile"
              sx={{ 
                ...projectRisksTileCard, 
                color: level.color,
                border: `1px solid #E5E7EB`,
                cursor: 'default',
              }}
            >
              <Typography sx={projectRisksTileCardKey}>{level.label}</Typography>
              <Typography sx={projectRisksTileCardvalue}>
                {getValidRiskValue(level.value)}
              </Typography>
              {level.trend && renderTrendIndicator(level.trend)}
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default RisksCard;
