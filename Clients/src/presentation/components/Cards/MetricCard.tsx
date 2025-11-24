import React, { useState } from "react";
import { Box, Card, CardContent, Typography, Chip, Button, Tooltip } from "@mui/material";
import { ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cardStyles } from "../../themes";
import StatusDonutChart from "../Charts/StatusDonutChart";
import { getDefaultStatusDistribution } from "../../utils/statusColors";
import {
  getDistributionSummary,
  getQuickStats,
  hasCriticalItems,
  getPriorityLevel,
} from "../../utils/cardEnhancements";
import { MetricCardProps } from "../../../domain/interfaces/iDashboard";

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  tooltipText,
  onClick,
  navigable = false,
  statusData,
  entityType,
  compact = false,
  backgroundIcon: BackgroundIcon,
  metricType = "neutral",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Function to get color based on metric type and value
  const getValueColor = (val: number | string, type: "lower-is-better" | "higher-is-better" | "neutral"): string => {
    if (type === "neutral" || val === "N/A") {
      return "#1F2937"; // Default dark color
    }

    // Extract numeric value from percentage string
    const numericValue = typeof val === "string"
      ? parseFloat(val.replace("%", "").trim())
      : val;

    if (isNaN(numericValue)) {
      return "#1F2937";
    }

    // Convert to 0-100 scale if it's a decimal
    const percentage = numericValue > 1 ? numericValue : numericValue * 100;

    if (type === "higher-is-better") {
      // Green for high values, red for low values
      if (percentage >= 80) return "#059669"; // Green-600
      if (percentage >= 60) return "#10B981"; // Green-500
      if (percentage >= 40) return "#F59E0B"; // Amber-500
      if (percentage >= 20) return "#F97316"; // Orange-500
      return "#DC2626"; // Red-600
    } else {
      // lower-is-better: Green for low values, red for high values
      if (percentage <= 20) return "#059669"; // Green-600
      if (percentage <= 40) return "#10B981"; // Green-500
      if (percentage <= 60) return "#F59E0B"; // Amber-500
      if (percentage <= 80) return "#F97316"; // Orange-500
      return "#DC2626"; // Red-600
    }
  };

  // Get status breakdown data
  const chartData =
    statusData ||
    (entityType
      ? getDefaultStatusDistribution(
          entityType,
          typeof value === "number" ? value : parseInt(String(value)) || 0
        )
      : []);
  const showChart =
    chartData.length > 0 && typeof value === "number" && value > 0;

  // Get enhancements
  const distributionSummary = getDistributionSummary(chartData);
  const quickStats = getQuickStats(
    entityType,
    typeof value === "number" ? value : parseInt(String(value)) || 0,
    chartData
  );
  const criticalInfo = hasCriticalItems(entityType, chartData);
  const priorityLevel = getPriorityLevel(
    entityType,
    typeof value === "number" ? value : parseInt(String(value)) || 0,
    chartData
  );

  // Priority visual cues
  const getPriorityStyles = () => {
    switch (priorityLevel) {
      case "high":
        return {
          background: "linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)",
          borderLeft: "4px solid #EF4444",
        };
      case "medium":
        return {
          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)",
          borderLeft: "4px solid #F59E0B",
        };
      default:
        return {
          background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        };
    }
  };

  return (
    <Card
      elevation={0}
      onClick={navigable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={(theme) => ({
        ...(cardStyles.base(theme) as any),
        ...getPriorityStyles(),
        border: "none", // Remove border from MetricCard
        margin: 0, // Remove any default margin
        height: "100%",
        minHeight: compact ? "90px" : "auto",
        cursor: navigable ? "pointer" : "default",
        position: "relative",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: 0, // Remove border radius to fill the wrapper completely
        "&:hover": navigable
          ? {
              background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
              borderColor: "transparent",
            }
          : {},
      })}
    >
      <CardContent
        sx={{
          p: compact ? 1.5 : 2,
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          "&:last-child": {
            paddingBottom: compact ? 1.5 : 2,
          },
        }}
      >
        {/* Background Icon */}
        {BackgroundIcon && (
          <Box
            sx={{
              position: "absolute",
              bottom: "-48px",
              right: "-48px",
              opacity: isHovered ? 0.04 : 0.015,
              transform: isHovered ? "translateY(-10px)" : "translateY(0px)",
              zIndex: 0,
              pointerEvents: "none",
              transition: "opacity 0.2s ease, transform 0.3s ease",
            }}
          >
            <BackgroundIcon size={120} />
          </Box>
        )}
        {/* Header section with title and arrow icon */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: compact ? 1 : 2,
            mt: compact ? 1.5 : 2,
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {typeof title === "string" ? (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: theme.palette.text.tertiary,
                  fontSize: compact ? "12px" : theme.typography.fontSize,
                  fontWeight: 400,
                })}
              >
                {title}
              </Typography>
            ) : (
              <Box
                sx={(theme) => ({
                  color: theme.palette.text.tertiary,
                  fontSize: compact ? "12px" : theme.typography.fontSize,
                  fontWeight: 400,
                  display: "flex",
                  alignItems: "center",
                })}
              >
                {title}
              </Box>
            )}
            {tooltipText && (
              <Tooltip
                title={tooltipText}
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      fontSize: "12px",
                      maxWidth: 320,
                      backgroundColor: "#1F2937",
                      padding: "8px 12px",
                      lineHeight: 1.5,
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", cursor: "help" }}>
                  <Info size={14} strokeWidth={2} style={{ opacity: 0.6 }} />
                </Box>
              </Tooltip>
            )}
          </Box>

          {navigable && (
            <Box
              sx={{
                opacity: isHovered ? 1 : 0.3,
                transition: "opacity 0.2s ease",
              }}
            >
              <ChevronRight size={20} />
            </Box>
          )}
        </Box>

        {/* Content section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: compact ? "center" : "flex-start",
            position: "relative",
            zIndex: 1,
          }}
        >
          {showChart ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                <StatusDonutChart
                  data={chartData}
                  total={
                    typeof value === "number"
                      ? value
                      : parseInt(String(value)) || 0
                  }
                  size={60}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: getValueColor(value, metricType),
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      color: theme.palette.text.tertiary,
                      fontSize: "11px",
                      display: "block",
                      mt: 0.5,
                    })}
                  >
                    Total
                  </Typography>
                </Box>
              </Box>

              {/* Distribution Summary */}
              {distributionSummary && (
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: "12px",
                    display: "block",
                    textAlign: "center",
                    mb: 1,
                  })}
                >
                  {distributionSummary}
                </Typography>
              )}

              {/* Quick Stats */}
              {quickStats && (
                <Box
                  sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}
                >
                  <Chip
                    label={quickStats}
                    size="small"
                    sx={{
                      fontSize: "11px",
                      height: "22px",
                      background:
                        "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  />
                </Box>
              )}

              {/* Quick Action Button - Bottom Right */}
              {criticalInfo.hasCritical && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(criticalInfo.actionRoute);
                    }}
                    sx={{
                      fontSize: "9px",
                      textTransform: "none",
                      padding: "2px 6px",
                      minWidth: "auto",
                      height: "20px",
                      borderColor:
                        priorityLevel === "high" ? "#EF4444" : "#F59E0B",
                      color: priorityLevel === "high" ? "#EF4444" : "#F59E0B",
                      "&:hover": {
                        borderColor:
                          priorityLevel === "high" ? "#DC2626" : "#D97706",
                        background:
                          priorityLevel === "high"
                            ? "linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)"
                            : "linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)",
                      },
                    }}
                  >
                    {criticalInfo.actionLabel}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: getValueColor(value, metricType),
                  fontSize: compact ? "1rem" : "1.25rem",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: "10px",
                    display: "block",
                    mt: 0.5,
                  })}
                >
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
