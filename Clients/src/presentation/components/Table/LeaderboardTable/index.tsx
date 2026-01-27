/**
 * LeaderboardTable Component
 * 
 * A reusable grid-style table for displaying LLM leaderboard rankings.
 */

import { useState, useMemo, useEffect } from "react";
import { Box, Typography, CircularProgress, SxProps, Theme, Stack, TablePagination } from "@mui/material";
import { ChevronUp, ChevronDown, BarChart3, Crown } from "lucide-react";
import { METRIC_CONFIG, LeaderboardEntry } from "./leaderboardConfig";
import TablePaginationActions from "../../TablePagination";
import { PROVIDER_ICONS } from "../../ProviderIcons";

// Map provider names to icon keys
const PROVIDER_ICON_MAP: Record<string, keyof typeof PROVIDER_ICONS> = {
  "OpenAI": "OpenAI",
  "Anthropic": "Anthropic",
  "Google": "Google",
  "Meta": "Meta",
  "Mistral": "Mistral",
  "Cohere": "Cohere",
  "DeepSeek": "DeepSeek",
  "Microsoft": "Microsoft",
  "Nvidia": "Nvidia",
  "NVIDIA": "Nvidia",
  "AI21": "Ai21",
  "Databricks": "HuggingFace", // Fallback
  "xAI": "OpenAI", // Fallback - no xAI icon in PROVIDER_ICONS
  "Snowflake": "Aws", // Fallback
  "IBM": "Microsoft", // Fallback
  "TII": "HuggingFace", // Fallback - Falcon
  "01.AI": "HuggingFace", // Fallback
  "Alibaba": "HuggingFace", // Fallback - Qwen
  "Groq": "Groq",
  "Together": "Together",
  "Replicate": "Replicate",
  "HuggingFace": "HuggingFace",
  "Perplexity": "Perplexity",
  "Fireworks": "Fireworks",
  "Ollama": "Ollama",
};

// Re-export for convenience
export { METRIC_CONFIG, type LeaderboardEntry } from "./leaderboardConfig";

const DEFAULT_ROWS_PER_PAGE = 10;
const LEADERBOARD_ROWS_PER_PAGE_KEY = "verifywise_leaderboard_rows_per_page";

export interface ModelActionInfo {
  model: string;
  provider: string;
  anchorEl: HTMLElement;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  searchQuery?: string;
  displayMetrics?: string[];
  onSort?: (sortBy: string, direction: "asc" | "desc") => void;
  onModelAction?: (info: ModelActionInfo) => void;
}

export default function LeaderboardTable({
  entries,
  loading = false,
  searchQuery = "",
  displayMetrics = [],
  onSort,
  onModelAction,
}: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem(LEADERBOARD_ROWS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_ROWS_PER_PAGE;
  });

  // Save rowsPerPage to localStorage
  useEffect(() => {
    localStorage.setItem(LEADERBOARD_ROWS_PER_PAGE_KEY, rowsPerPage.toString());
  }, [rowsPerPage]);


  // Filter and sort entries
  const sortedEntries = useMemo(() => {
    const filtered = entries.filter(entry =>
      entry.model.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      if (sortBy === "score") {
        aValue = a.score;
        bValue = b.score;
      } else if (sortBy === "experimentCount") {
        aValue = a.experimentCount;
        bValue = b.experimentCount;
      } else {
        aValue = a.metricScores[sortBy] ?? -1;
        bValue = b.metricScores[sortBy] ?? -1;
      }
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });

    return filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [entries, searchQuery, sortBy, sortDirection]);

  // Paginated entries - auto-adjust if page is out of bounds
  const paginatedEntries = useMemo(() => {
    const maxPage = Math.max(0, Math.ceil(sortedEntries.length / rowsPerPage) - 1);
    const effectivePage = Math.min(page, maxPage);
    const start = effectivePage * rowsPerPage;
    return sortedEntries.slice(start, start + rowsPerPage);
  }, [sortedEntries, page, rowsPerPage]);

  // Reset to first page when search/sort changes entries
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(sortedEntries.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEntries.length]);

  // Handle column sort
  const handleSort = (column: string) => {
    let newDirection: "asc" | "desc" = "desc";
    if (sortBy === column) {
      newDirection = sortDirection === "desc" ? "asc" : "desc";
    }
    setSortBy(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format score as percentage (data is already in 0-100 range)
  const formatScore = (score: number): string => score.toFixed(1) + "%";

  // Calculate best score for each metric (for crown indicator)
  const bestScores = useMemo(() => {
    const best: Record<string, { value: number; model: string }> = {};

    displayMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      let bestValue = config && !config.higherIsBetter ? Infinity : -Infinity;
      let bestModel = "";

      sortedEntries.forEach(entry => {
        const score = entry.metricScores[metric];
        if (score === undefined) return;

        if (config && !config.higherIsBetter) {
          if (score < bestValue) {
            bestValue = score;
            bestModel = entry.model;
          }
        } else {
          if (score > bestValue) {
            bestValue = score;
            bestModel = entry.model;
          }
        }
      });

      if (bestModel) {
        best[metric] = { value: bestValue, model: bestModel };
      }
    });

    return best;
  }, [sortedEntries, displayMetrics]);

  // Check if this is the best score for a metric
  const isBestInMetric = (model: string, metric: string): boolean => {
    return bestScores[metric]?.model === model;
  };


  // Grid columns: Rank, Model, Score, then metrics
  const gridColumns = `80px minmax(200px, 1fr) 100px ${displayMetrics.map(() => "minmax(110px, 130px)").join(" ")}`;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={36} sx={{ color: "#f59e0b" }} />
      </Box>
    );
  }

  // Empty state
  if (sortedEntries.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 10, border: "2px dashed #e5e7eb", borderRadius: 2 }}>
        <BarChart3 size={48} color="#d1d5db" />
        <Typography variant="h6" color="text.secondary" mt={2}>
          No data yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Run experiments to populate the leaderboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid #f0f0f0",
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Scrollable Table Container */}
      <Box sx={{ overflowX: "auto" }}>
        {/* Table Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            bgcolor: "#fff",
            borderBottom: "2px solid #13715B",
            minWidth: "fit-content",
          }}
        >
          <HeaderCell onClick={() => handleSort("score")} active={sortBy === "score"} direction={sortDirection}>
            Rank
          </HeaderCell>
          <HeaderCell onClick={() => handleSort("model")} active={sortBy === "model"} direction={sortDirection}>
            Model
          </HeaderCell>
          <HeaderCell onClick={() => handleSort("score")} active={sortBy === "score"} direction={sortDirection}>
            Score
          </HeaderCell>
          {displayMetrics.map((metric) => (
            <HeaderCell
              key={metric}
              onClick={() => handleSort(metric)}
              active={sortBy === metric}
              direction={sortDirection}
            >
              {METRIC_CONFIG[metric]?.shortName || metric.charAt(0).toUpperCase() + metric.slice(1)}
            </HeaderCell>
          ))}
        </Box>

        {/* Table Rows */}
        {paginatedEntries.map((entry, idx) => (
          <Box
            key={entry.model}
            onClick={(e) => {
              if (onModelAction) {
                onModelAction({
                  model: entry.model,
                  provider: entry.provider || "",
                  anchorEl: e.currentTarget as HTMLElement,
                });
              }
            }}
            sx={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              borderBottom: idx < paginatedEntries.length - 1 ? "1px solid #f5f5f5" : "none",
              minWidth: "fit-content",
              bgcolor: idx % 2 === 1 ? "#fafafa" : "#fff",
              "&:hover": { bgcolor: "#f0fdf4" },
              transition: "background 0.15s",
              cursor: onModelAction ? "pointer" : "default",
            }}
          >
            {/* Rank */}
            <Cell>
              <RankBadge rank={entry.rank} />
            </Cell>

            {/* Model with Provider Icon */}
            <Cell>
              <Stack direction="row" alignItems="center" gap={1} justifyContent="center">
                {entry.provider && PROVIDER_ICON_MAP[entry.provider] && (
                  (() => {
                    const IconComponent = PROVIDER_ICONS[PROVIDER_ICON_MAP[entry.provider]];
                    return IconComponent ? (
                      <Box sx={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconComponent width={18} height={18} />
                      </Box>
                    ) : null;
                  })()
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'SF Mono', 'Roboto Mono', monospace",
                    color: "#111827",
                    fontWeight: 500,
                    fontSize: "13px",
                  }}
                >
                  {entry.model}
                </Typography>
              </Stack>
            </Cell>

            {/* Score */}
            <Cell>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: "#1f2937",
                  fontSize: "13px"
                }}
              >
                {formatScore(entry.score)}
              </Typography>
            </Cell>

            {/* Metrics */}
            {displayMetrics.map((metric) => {
              const score = entry.metricScores[metric];
              const hasScore = score !== undefined;
              const isBest = hasScore && isBestInMetric(entry.model, metric);

              // Check if score is excellent (>=90% for higher-is-better, <=5% for lower-is-better)
              // Data is already in 0-100 percentage range
              const config = METRIC_CONFIG[metric];
              const isExcellent = hasScore && (
                config && !config.higherIsBetter
                  ? score <= 5    // For bias/toxicity/hallucination, lower is better (<=5%)
                  : score >= 90   // For most metrics, higher is better (>=90%)
              );

              // Best gets yellow highlight (priority), excellent (not best) gets green
              const showExcellentHighlight = isExcellent && !isBest;

              return (
                <Cell key={metric}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: (isBest || isExcellent) ? 1 : 0,
                      py: (isBest || isExcellent) ? 0.25 : 0,
                      borderRadius: "4px",
                      bgcolor: isBest ? "#fde047" : showExcellentHighlight ? "#ecfdf5" : "transparent",
                    }}
                  >
                    {isBest && (
                      <Crown size={11} color="#f59e0b" style={{ flexShrink: 0 }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: (isBest || isExcellent) ? 600 : 400,
                        fontSize: "12.5px",
                        color: hasScore
                          ? (showExcellentHighlight ? "#059669" : "#4b5563")
                          : "#d1d5db",
                      }}
                    >
                      {hasScore ? formatScore(score) : "—"}
                    </Typography>
                  </Box>
                </Cell>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Pagination - Inside table container */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          borderTop: "1px solid #f5f5f5",
          bgcolor: "#fff"
        }}
      >
        <Typography variant="body2" sx={{ fontSize: 12, color: "#a8a29e" }}>
          Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, sortedEntries.length)} of {sortedEntries.length} models
        </Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          <TablePagination
            component="div"
            count={sortedEntries.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={TablePaginationActions}
            labelRowsPerPage="Rows per page"
            sx={{
              "& .MuiTablePagination-toolbar": { minHeight: 36, p: 0 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: 12,
                color: "#a8a29e",
              },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface HeaderCellProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  direction?: "asc" | "desc";
}

function HeaderCell({ children, onClick, active, direction }: HeaderCellProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.75,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
        minHeight: 44,
        "&:hover": onClick ? { bgcolor: "#ecfdf5" } : {},
        transition: "background 0.15s",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: active ? "#13715B" : "#78716c",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          lineHeight: 1.2,
        }}
      >
        {children}
      </Typography>
      {active && (direction === "desc" ? <ChevronDown size={14} color="#13715B" /> : <ChevronUp size={14} color="#13715B" />)}
    </Box>
  );
}

interface CellProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

function Cell({ children, sx = {} }: CellProps) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        ...(sx as object),
      }}
    >
      {children}
    </Box>
  );
}

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  const getBadgeStyle = () => {
    switch (rank) {
      case 1:
        return { bgcolor: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }; // Gold
      case 2:
        return { bgcolor: "#f5f5f4", color: "#57534e", border: "1px solid #d6d3d1" }; // Silver (warm)
      case 3:
        return { bgcolor: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }; // Bronze
      default:
        return { bgcolor: "transparent", color: "#a8a29e", border: "none" };
    }
  };

  const style = getBadgeStyle();

  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        ...style,
      }}
    >
      {rank}
    </Box>
  );
}

// Export sub-components for potential reuse
export { HeaderCell, Cell, RankBadge };
