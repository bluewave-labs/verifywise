import { PieChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";
import { StatusDonutChartProps } from "../../types/interfaces/i.chart";

export function StatusDonutChart({
  data,
  total,
  size = 100,
}: StatusDonutChartProps) {
  // Filter out zero values for cleaner visualization
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0 || total === 0) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #E5E7EB",
          borderRadius: "50%",
          backgroundColor: "#F9FAFB",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#9CA3AF",
            fontSize: "10px",
            textAlign: "center",
          }}
        >
          No Data
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background shadow ring */}
      <Box
        sx={{
          position: "absolute",
          width: size * 0.96,
          height: size * 0.96,
          borderRadius: "50%",
          backgroundColor: "#F3F4F6",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        }}
      />
      <PieChart
        series={[
          {
            data: filteredData.map((item, index) => ({
              id: index,
              value: item.value,
              label: item.label,
              color: item.color,
            })),
            innerRadius: size * 0.28,
            outerRadius: size * 0.48,
            paddingAngle: 1,
            cornerRadius: 3,
          },
        ]}
        width={size}
        height={size}
        slotProps={{
          tooltip: {
            sx: {
              "& .MuiChartsTooltip-root": {
                fontSize: "13px !important",
              },
              "& .MuiChartsTooltip-table": {
                fontSize: "13px !important",
              },
              "& .MuiChartsTooltip-cell": {
                fontSize: "13px !important",
              },
              "& .MuiChartsTooltip-labelCell": {
                fontSize: "13px !important",
              },
              "& .MuiChartsTooltip-valueCell": {
                fontSize: "13px !important",
              },
            },
          },
        }}
        sx={{
          "& .MuiChartsLegend-root": {
            display: "none !important",
          },
          position: "relative",
          zIndex: 1,
        }}
      />
      {/* Center circle with total */}
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
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            width: size * 0.52,
            height: size * 0.52,
            borderRadius: "50%",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#1F2937",
            }}
          >
            {total}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
