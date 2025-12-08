/**
 * Generic Table Widget Template
 *
 * A reusable widget template that displays tabular data.
 * Plugins can use this template by specifying "table" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     columns: [
 *       { key: "name", label: "Name" },
 *       { key: "status", label: "Status" },
 *       { key: "date", label: "Date" }
 *     ],
 *     rows: [
 *       { id: "1", name: "Item 1", status: "Active", date: "2024-01-01" },
 *       ...
 *     ],
 *     total: 10
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Chip } from "@mui/material";
import { RefreshCw } from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

interface TableRow {
  id: string;
  [key: string]: unknown;
}

interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  total: number;
}

interface TableWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    maxRows?: number;
    refreshInterval?: number;
    compact?: boolean;
    emptyMessage?: string;
  };
}

// Status chip colors
const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: "#dcfce7", color: "#16a34a" },
  inactive: { bg: "#f3f4f6", color: "#6b7280" },
  pending: { bg: "#fef3c7", color: "#d97706" },
  error: { bg: "#fee2e2", color: "#dc2626" },
  success: { bg: "#dcfce7", color: "#16a34a" },
  warning: { bg: "#fef3c7", color: "#d97706" },
};

// Helper to render cell value
function renderCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    if (statusColors[lowerValue]) {
      return (
        <Chip
          label={value}
          size="small"
          sx={{
            height: 20,
            fontSize: 11,
            backgroundColor: statusColors[lowerValue].bg,
            color: statusColors[lowerValue].color,
            fontWeight: 500,
          }}
        />
      );
    }
    return value;
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return String(value);
}

const TableWidget: React.FC<TableWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Data",
  config = {},
}) => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    maxRows = 10,
    refreshInterval,
    compact = false,
    emptyMessage = "No data available",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?limit=${maxRows}`
      );

      const data = response.data;

      if (data.success && data.data) {
        setTableData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint, maxRows]);

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

  if (!tableData) return null;

  return (
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
      </Box>

      {tableData.rows.length === 0 ? (
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
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: compact ? 11 : 12,
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {tableData.columns.map((col) => (
                  <Box
                    component="th"
                    key={col.key}
                    sx={{
                      textAlign: "left",
                      py: compact ? 0.5 : 1,
                      px: 1,
                      borderBottom: "1px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {tableData.rows.map((row) => (
                <Box
                  component="tr"
                  key={row.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f9fafb" },
                  }}
                >
                  {tableData.columns.map((col) => (
                    <Box
                      component="td"
                      key={`${row.id}-${col.key}`}
                      sx={{
                        py: compact ? 0.5 : 1,
                        px: 1,
                        borderBottom: "1px solid #f3f4f6",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 200,
                      }}
                    >
                      {renderCellValue(row[col.key])}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TableWidget;
