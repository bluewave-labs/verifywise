import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { DASHBOARD_COLORS } from "../../styles/colors";
import type { IPortfolioSnapshot } from "../../../domain/interfaces/i.quantitativeRisk";

const C = DASHBOARD_COLORS;

interface PortfolioTrendChartProps {
  snapshots: IPortfolioSnapshot[];
  height?: number;
}

export function PortfolioTrendChart({ snapshots, height = 200 }: PortfolioTrendChartProps) {
  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()),
    [snapshots]
  );

  const xLabels = useMemo(() => sorted.map((s) => {
    const d = new Date(s.snapshot_date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }), [sorted]);

  const aleData = useMemo(() => sorted.map((s) => s.total_ale), [sorted]);
  const residualData = useMemo(() => sorted.map((s) => s.total_residual_ale), [sorted]);

  if (snapshots.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height, opacity: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: C.textSecondary }}>
          No trend data available yet
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <LineChart
        xAxis={[{ data: xLabels, scaleType: "point" }]}
        series={[
          {
            data: aleData,
            label: "Total ALE",
            color: C.critical,
            showMark: false,
          },
          {
            data: residualData,
            label: "Residual ALE",
            color: C.medium,
            showMark: false,
          },
        ]}
        height={height}
        margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
        slotProps={{
          legend: {
            direction: "row",
            position: { vertical: "top", horizontal: "right" },
            itemMarkWidth: 10,
            itemMarkHeight: 10,
            labelStyle: { fontSize: 11 },
          },
        }}
      />
    </Box>
  );
}
