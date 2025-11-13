import React, { useState, useEffect } from "react";
import { Typography, Stack, Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { getModelInventoryTimeseries } from "../../../application/repository/modelInventoryHistory.repository";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";
import ButtonToggle from "../ButtonToggle";
import CustomizableSkeleton from "../Skeletons";
import EmptyState from "../EmptyState";

interface ModelInventoryHistoryChartProps {
  parameter?: string;
  title?: string;
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  [ModelInventoryStatus.APPROVED]: "#10B981", // Emerald green
  [ModelInventoryStatus.PENDING]: "#F59E0B", // Amber
  [ModelInventoryStatus.RESTRICTED]: "#EF4444", // Red
  [ModelInventoryStatus.BLOCKED]: "#DC2626", // Dark red
};

const TIMEFRAME_OPTIONS = [
  { value: "7days", label: "7 Days" },
  { value: "15days", label: "15 Days" },
  { value: "1month", label: "1 Month" },
  { value: "3months", label: "3 Months" },
  { value: "6months", label: "6 Months" },
  { value: "1year", label: "1 Year" },
];

const ModelInventoryHistoryChart: React.FC<ModelInventoryHistoryChartProps> = ({
  parameter = "status",
  title = "Model Inventory Status History",
  height = 400,
}) => {
  const [timeframe, setTimeframe] = useState<string>("1month");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);

  useEffect(() => {
    fetchTimeseriesData();
  }, [timeframe, parameter]);

  const fetchTimeseriesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getModelInventoryTimeseries(parameter, timeframe);
      if (response?.data?.data) {
        setTimeseriesData(response.data.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching timeseries data:", err);
      setError(err?.response?.data?.message || "Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!timeseriesData || timeseriesData.length === 0) {
      return { timestamps: [], series: [], maxValue: 0 };
    }

    const timestamps = timeseriesData.map((point) => new Date(point.timestamp));

    // Get all unique status values
    const statusValues = Object.values(ModelInventoryStatus);
    const series = statusValues.map((status) => ({
      label: status,
      data: timeseriesData.map((point) => point.data[status] || 0),
      color: STATUS_COLORS[status] || "#9CA3AF",
      curve: "monotoneX" as const,
      showMark: false,
    }));

    // Calculate max value across all series for proper y-axis scaling
    const maxValue = Math.max(
      ...series.flatMap((s) => s.data),
      0
    );

    return { timestamps, series, maxValue };
  };

  const { timestamps, series, maxValue } = prepareChartData();

  if (loading) {
    return (
      <Stack
        sx={{
          p: 3,
          border: "1px solid #EAECF0",
          borderRadius: 2,
          height: height + 120,
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <CustomizableSkeleton variant="circular" width={40} height={40} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack
        sx={{
          p: 3,
          border: "1px solid #EAECF0",
          borderRadius: 2,
          height: height + 120,
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <Typography sx={{ color: "#F04438", fontSize: 14, fontWeight: 500 }}>
          {error}
        </Typography>
      </Stack>
    );
  }

  if (!timeseriesData || timeseriesData.length === 0) {
    return (
      <EmptyState
        message="There is no historical data here"
        showBorder={true}
      />
    );
  }

  return (
    <Stack
      sx={{
        p: 3,
        border: "1px solid #EAECF0",
        borderRadius: 2,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <ButtonToggle
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={handleTimeframeChange}
            height={32}
          />
        </Stack>

        <Stack sx={{ width: "100%", mt: 2 }}>
          <Box sx={{ position: "relative" }}>
            <LineChart
              xAxis={[
                {
                  data: timestamps,
                  scaleType: "time",
                  valueFormatter: (date) => {
                    return new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(date);
                  },
                  tickLabelStyle: {
                    fontSize: 12,
                    fill: "#475467",
                  },
                },
              ]}
              yAxis={[
                {
                  label: "Count",
                  min: 0,
                  max: maxValue > 0 ? Math.ceil(maxValue * 1.15) : 10,
                  tickMinStep: 1,
                  valueFormatter: (value: number) => value.toString(),
                  labelStyle: {
                    fontSize: 13,
                    fill: "#344054",
                  },
                  tickLabelStyle: {
                    fontSize: 12,
                    fill: "#475467",
                  },
                },
              ]}
              series={series}
              height={height}
              margin={{ top: 10, right: 30, bottom: 30, left: 70 }}
              slotProps={{
                legend: {
                  hidden: false,
                  direction: "row" as any,
                  position: { vertical: "bottom", horizontal: "center" },
                  padding: { top: 35 },
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 5,
                  itemGap: 12,
                  labelStyle: {
                    fontSize: 11,
                    fontWeight: 400,
                    fill: "#475467",
                  },
                },
              }}
              grid={{
                vertical: true,
                horizontal: true,
              }}
              sx={{
                "& .MuiLineElement-root": {
                  strokeWidth: 3,
                },
                "& .MuiChartsGrid-line": {
                  stroke: "#EAECF0",
                  strokeWidth: 1,
                },
                "& .MuiChartsAxis-line": {
                  stroke: "#D0D5DD",
                  strokeWidth: 1.5,
                },
                "& .MuiChartsAxis-tick": {
                  stroke: "#D0D5DD",
                },
              }}
            />

          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ModelInventoryHistoryChart;
