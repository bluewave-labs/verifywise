import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Collapse,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { History, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import Chip from "../../../components/Chip";
import { friaRepository } from "../../../../application/repository/fria.repository";

interface FriaVersionSnapshot {
  id: number;
  fria_id: number;
  version: number;
  snapshot_reason: string | null;
  created_by_name: string | null;
  created_at: string;
  snapshot_data: Record<string, any> | null;
}

interface FriaVersionHistoryProps {
  friaId: number;
  currentVersion: number;
}

/**
 * Formats an ISO date string to a human-readable format.
 * e.g. "2026-03-06T14:22:00.000Z" → "6 Mar 2026, 14:22"
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

const FriaVersionHistory = ({ friaId, currentVersion }: FriaVersionHistoryProps) => {
  const theme = useTheme();

  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [versions, setVersions] = useState<FriaVersionSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!panelOpen || versions.length > 0) return;

    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await friaRepository.getVersions(friaId);
        setVersions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load version history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [panelOpen, friaId, versions.length]);

  const handleRowToggle = (id: number) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "#d0d5dd",
        borderRadius: "4px",
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setPanelOpen((prev) => !prev)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.75,
          cursor: "pointer",
          userSelect: "none",
          backgroundColor: theme.palette.background.paper,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <History size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
          <Typography variant="body2" fontWeight={600} color="text.primary">
            Version history
          </Typography>
        </Box>
        {panelOpen ? (
          <ChevronUp size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
        ) : (
          <ChevronDown size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
        )}
      </Box>

      <Collapse in={panelOpen} timeout="auto" unmountOnExit>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}

          {!isLoading && !error && versions.length === 0 && (
            <Box sx={{ px: 2.5, py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No version history available.
              </Typography>
            </Box>
          )}

          {!isLoading && !error && versions.length > 0 && (
            <Stack divider={<Box sx={{ borderTop: "1px solid #d0d5dd" }} />}>
              {/* Table header */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 160px 160px 36px",
                  px: 2.5,
                  py: 1,
                  backgroundColor: "#f9fafb",
                  borderTop: "1px solid #d0d5dd",
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Version
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Reason
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Created by
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Date
                </Typography>
                <Box />
              </Box>

              {versions.map((v) => {
                const isCurrent = v.version === currentVersion;
                const isRowExpanded = expandedRow === v.id;

                return (
                  <Box key={v.id}>
                    {/* Version row */}
                    <Box
                      onClick={() => v.snapshot_data && handleRowToggle(v.id)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "80px 1fr 160px 160px 36px",
                        alignItems: "center",
                        px: 2.5,
                        py: 1.25,
                        cursor: v.snapshot_data ? "pointer" : "default",
                        "&:hover": v.snapshot_data
                          ? { backgroundColor: theme.palette.action.hover }
                          : {},
                      }}
                    >
                      {/* Version badge */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={`v${v.version}`}
                          variant="info"
                          size="small"
                          uppercase={false}
                        />
                        {isCurrent && (
                          <Chip
                            label="Current"
                            variant="success"
                            size="small"
                            uppercase={false}
                          />
                        )}
                      </Box>

                      {/* Reason */}
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          pr: 1,
                        }}
                      >
                        {v.snapshot_reason || "—"}
                      </Typography>

                      {/* Created by */}
                      <Typography variant="body2" color="text.secondary">
                        {v.created_by_name || "—"}
                      </Typography>

                      {/* Date */}
                      <Typography variant="body2" color="text.secondary">
                        {v.created_at ? formatDate(v.created_at) : "—"}
                      </Typography>

                      {/* Expand chevron */}
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        {v.snapshot_data && (
                          <Box
                            sx={{
                              color: theme.palette.text.secondary,
                              display: "flex",
                              alignItems: "center",
                              transition: "transform 0.15s ease",
                              transform: isRowExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >
                            <ChevronRight size={14} strokeWidth={1.5} />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Expanded snapshot data */}
                    <Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          borderTop: "1px solid #d0d5dd",
                          backgroundColor: "#f9fafb",
                          px: 2.5,
                          py: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                          sx={{ display: "block", mb: 1 }}
                        >
                          Snapshot data
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1.5,
                            backgroundColor: "#fff",
                            border: "1px solid #d0d5dd",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontFamily: "monospace",
                            overflowX: "auto",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            color: theme.palette.text.primary,
                            maxHeight: 320,
                            overflowY: "auto",
                          }}
                        >
                          {JSON.stringify(v.snapshot_data, null, 2)}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FriaVersionHistory;
