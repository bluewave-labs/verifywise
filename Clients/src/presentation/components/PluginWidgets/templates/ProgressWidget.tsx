/**
 * Generic Progress/Gauge Widget Template
 *
 * A reusable widget template that displays progress indicators and gauges.
 * Plugins can use this template by specifying "progress" as the template type.
 *
 * Supported styles: circular, linear, gauge, multi
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     style: "circular" | "linear" | "gauge" | "multi",
 *     // For single progress:
 *     value: 75,
 *     max?: 100,
 *     label?: "Completion",
 *     subtitle?: "75 of 100 tasks completed",
 *     color?: "#13715B",
 *     // For multi progress (style: "multi"):
 *     items?: [
 *       { label: "High Risk", value: 3, max: 10, color: "#dc2626" },
 *       { label: "Medium Risk", value: 5, max: 10, color: "#d97706" },
 *       { label: "Low Risk", value: 8, max: 10, color: "#16a34a" }
 *     ]
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Stack, LinearProgress } from "@mui/material";
import { RefreshCw } from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface ProgressItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
  subtitle?: string;
}

interface ProgressData {
  style: "circular" | "linear" | "gauge" | "multi";
  value?: number;
  max?: number;
  label?: string;
  subtitle?: string;
  color?: string;
  items?: ProgressItem[];
}

interface ProgressWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    refreshInterval?: number;
    size?: "small" | "medium" | "large";
    showPercentage?: boolean;
    showValue?: boolean;
    emptyMessage?: string;
  };
}

// Size configurations
const sizeConfig = {
  small: { circular: 80, stroke: 6, fontSize: 16 },
  medium: { circular: 120, stroke: 8, fontSize: 24 },
  large: { circular: 160, stroke: 10, fontSize: 32 },
};

// Default color
const defaultColor = "#13715B";

// Circular progress component with custom styling
const CircularProgressIndicator: React.FC<{
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  fontSize: number;
  showPercentage: boolean;
}> = ({ value, max, size, strokeWidth, color, fontSize, showPercentage }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showPercentage && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize,
              fontWeight: 600,
              color: "#000",
            }}
          >
            {Math.round(percentage)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Gauge component (semicircular)
const GaugeIndicator: React.FC<{
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  fontSize: number;
  showPercentage: boolean;
  label?: string;
}> = ({ value, max, size, strokeWidth, color, fontSize, showPercentage, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size / 2 + 10}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showPercentage && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize,
              fontWeight: 600,
              color: "#000",
            }}
          >
            {Math.round(percentage)}%
          </Typography>
          {label && (
            <Typography sx={{ fontSize: 11, color: "#666", mt: -0.5 }}>
              {label}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// Linear progress with label
const LinearProgressIndicator: React.FC<{
  value: number;
  max: number;
  color: string;
  label?: string;
  showPercentage: boolean;
  showValue: boolean;
}> = ({ value, max, color, label, showPercentage, showValue }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        {label && (
          <Typography sx={{ fontSize: 12, color: "#000", fontWeight: 500 }}>
            {label}
          </Typography>
        )}
        <Typography sx={{ fontSize: 11, color: "#666" }}>
          {showPercentage && `${Math.round(percentage)}%`}
          {showPercentage && showValue && " · "}
          {showValue && `${value}/${max}`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "#e5e7eb",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
};

const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Progress",
  config = {},
}) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    refreshInterval,
    size = "medium",
    showPercentage = true,
    showValue = true,
    emptyMessage = "No data available",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(`/plugins/${pluginId}${endpoint}`);
      const data = response.data;

      if (data.success && data.data) {
        setProgressData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load progress data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress data");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint]);

  useEffect(() => {
    fetchData();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
          <Typography
            onClick={fetchData}
            sx={{
              fontSize: 12,
              color: "#13715B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <RefreshCw size={12} /> Retry
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!progressData) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#999" }}>{emptyMessage}</Typography>
        </Box>
      </Box>
    );
  }

  const { style, value = 0, max = 100, label, subtitle, color = defaultColor, items } = progressData;
  const sizeValues = sizeConfig[size];

  const renderProgress = () => {
    switch (style) {
      case "circular":
        return (
          <Stack alignItems="center" spacing={1}>
            <CircularProgressIndicator
              value={value}
              max={max}
              size={sizeValues.circular}
              strokeWidth={sizeValues.stroke}
              color={color}
              fontSize={sizeValues.fontSize}
              showPercentage={showPercentage}
            />
            {label && (
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#000" }}>
                {label}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ fontSize: 11, color: "#666", textAlign: "center" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        );

      case "gauge":
        return (
          <Stack alignItems="center" spacing={0}>
            <GaugeIndicator
              value={value}
              max={max}
              size={sizeValues.circular}
              strokeWidth={sizeValues.stroke}
              color={color}
              fontSize={sizeValues.fontSize}
              showPercentage={showPercentage}
              label={label}
            />
            {subtitle && (
              <Typography sx={{ fontSize: 11, color: "#666", textAlign: "center", mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        );

      case "linear":
        return (
          <Stack spacing={2} sx={{ width: "100%" }}>
            <LinearProgressIndicator
              value={value}
              max={max}
              color={color}
              label={label}
              showPercentage={showPercentage}
              showValue={showValue}
            />
            {subtitle && (
              <Typography sx={{ fontSize: 11, color: "#666" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        );

      case "multi":
        if (!items || items.length === 0) {
          return (
            <Typography sx={{ fontSize: 13, color: "#999", textAlign: "center", py: 4 }}>
              No items to display
            </Typography>
          );
        }
        return (
          <Stack spacing={2} sx={{ width: "100%" }}>
            {items.map((item, index) => (
              <LinearProgressIndicator
                key={index}
                value={item.value}
                max={item.max || 100}
                color={item.color || defaultColor}
                label={item.label}
                showPercentage={showPercentage}
                showValue={showValue}
              />
            ))}
          </Stack>
        );

      default:
        return (
          <Typography sx={{ fontSize: 13, color: "#999", textAlign: "center", py: 4 }}>
            Unknown style: {style}
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
        <Typography
          onClick={fetchData}
          sx={{
            fontSize: 11,
            color: "#999",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            "&:hover": { color: "#13715B" },
          }}
        >
          <RefreshCw size={11} />
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: style === "multi" || style === "linear" ? "auto" : sizeValues.circular + 40,
        }}
      >
        {renderProgress()}
      </Box>
    </Box>
  );
};

export default ProgressWidget;
