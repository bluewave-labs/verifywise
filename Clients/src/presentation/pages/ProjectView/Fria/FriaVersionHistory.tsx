import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Collapse,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
  snapshot_data: Record<string, unknown> | null;
}

interface FriaVersionHistoryProps {
  friaId: number;
  currentVersion: number;
}

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load version history");
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
          padding: "14px 16px",
          cursor: "pointer",
          userSelect: "none",
          backgroundColor: theme.palette.background.paper,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>
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
        <CardContent sx={{ padding: 0, "&:last-child": { paddingBottom: 0 } }}>
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Box sx={{ padding: "16px" }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.error.main }}>
                {error}
              </Typography>
            </Box>
          )}

          {!isLoading && !error && versions.length === 0 && (
            <Box sx={{ padding: "24px 16px" }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                No version history available.
              </Typography>
            </Box>
          )}

          {!isLoading && !error && versions.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f9fafb",
                    borderTop: "1px solid #d0d5dd",
                  }}
                >
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: "uppercase", padding: "8px 16px" }}>
                    Version
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: "uppercase", padding: "8px 16px" }}>
                    Reason
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: "uppercase", padding: "8px 16px" }}>
                    Created by
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: "uppercase", padding: "8px 16px" }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ width: 36, padding: "8px" }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((v) => {
                  const isCurrent = v.version === currentVersion;
                  const isRowExpanded = expandedRow === v.id;

                  return (
                    <React.Fragment key={v.id}>
                      <TableRow
                        onClick={() => v.snapshot_data && handleRowToggle(v.id)}
                        hover={!!v.snapshot_data}
                        sx={{
                          cursor: v.snapshot_data ? "pointer" : "default",
                        }}
                      >
                        <TableCell sx={{ padding: "10px 16px" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: theme.palette.text.primary, padding: "10px 16px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.snapshot_reason || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: theme.palette.text.secondary, padding: "10px 16px" }}>
                          {v.created_by_name || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: theme.palette.text.secondary, padding: "10px 16px" }}>
                          {v.created_at ? formatDate(v.created_at) : "—"}
                        </TableCell>
                        <TableCell sx={{ width: 36, padding: "10px 8px", textAlign: "center" }}>
                          {v.snapshot_data && (
                            <Box
                              sx={{
                                color: theme.palette.text.secondary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.15s ease",
                                transform: isRowExpanded ? "rotate(90deg)" : "rotate(0deg)",
                              }}
                            >
                              <ChevronRight size={14} strokeWidth={1.5} />
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded snapshot data */}
                      {isRowExpanded && v.snapshot_data && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ padding: 0 }}>
                            <Box
                              sx={{
                                backgroundColor: "#f9fafb",
                                padding: "16px",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: theme.palette.text.secondary,
                                  marginBottom: "8px",
                                }}
                              >
                                Snapshot data
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  margin: 0,
                                  padding: "12px",
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
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FriaVersionHistory;
