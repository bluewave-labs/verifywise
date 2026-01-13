/**
 * LeaderboardTable Component
 * 
 * A reusable grid-style table for displaying LLM leaderboard rankings.
 */

import { useState, useMemo } from "react";
import { Box, Typography, CircularProgress, SxProps, Theme } from "@mui/material";
import { ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { METRIC_CONFIG, LeaderboardEntry } from "./leaderboardConfig";

// Re-export for convenience
export { METRIC_CONFIG, type LeaderboardEntry } from "./leaderboardConfig";

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  searchQuery?: string;
  displayMetrics?: string[];
  onSort?: (sortBy: string, direction: "asc" | "desc") => void;
}

export default function LeaderboardTable({
  entries,
  loading = false,
  searchQuery = "",
  displayMetrics = [],
  onSort,
}: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // Format score as percentage
  const formatScore = (score: number): string => (score * 100).toFixed(1) + "%";

  // Get color based on score
  const getScoreColor = (score: number, metric: string): string => {
    const config = METRIC_CONFIG[metric];
    const effective = config && !config.higherIsBetter ? (1 - score) : score;
    if (effective >= 0.8) return "#059669";
    if (effective >= 0.6) return "#65a30d";
    if (effective >= 0.4) return "#d97706";
    return "#dc2626";
  };

  // Grid columns definition
  const gridColumns = `80px 200px 100px ${displayMetrics.map(() => "100px").join(" ")} 80px 120px`;

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
    <Box sx={{ border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden", bgcolor: "#fff" }}>
      {/* Table Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridColumns,
          bgcolor: "#f8fafc",
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        <HeaderCell onClick={() => handleSort("score")} active={sortBy === "score"} direction={sortDirection}>
          Rank
        </HeaderCell>
        <HeaderCell>Model</HeaderCell>
        <HeaderCell onClick={() => handleSort("score")} active={sortBy === "score"} direction={sortDirection}>
          Score ↓
        </HeaderCell>
        {displayMetrics.map((metric) => (
          <HeaderCell
            key={metric}
            onClick={() => handleSort(metric)}
            active={sortBy === metric}
            direction={sortDirection}
          >
            {METRIC_CONFIG[metric]?.shortName || metric}
          </HeaderCell>
        ))}
        <HeaderCell
          onClick={() => handleSort("experimentCount")}
          active={sortBy === "experimentCount"}
          direction={sortDirection}
        >
          Evals
        </HeaderCell>
        <HeaderCell>Provider</HeaderCell>
      </Box>

      {/* Table Rows */}
      {sortedEntries.map((entry, idx) => (
        <Box
          key={entry.model}
          sx={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            borderBottom: idx < sortedEntries.length - 1 ? "1px solid #e5e7eb" : "none",
            "&:hover": { bgcolor: "#f8fafc" },
            transition: "background 0.15s",
          }}
        >
          {/* Rank */}
          <Cell>
            <RankBadge rank={entry.rank} />
          </Cell>

          {/* Model */}
          <Cell sx={{ justifyContent: "flex-start", pl: 2 }}>
            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace", color: "#1f2937" }}>
              {entry.model}
            </Typography>
          </Cell>

          {/* Score */}
          <Cell>
            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace", color: "#1f2937" }}>
              {formatScore(entry.score)}
            </Typography>
          </Cell>

          {/* Metrics */}
          {displayMetrics.map((metric) => (
            <Cell key={metric}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  color:
                    entry.metricScores[metric] !== undefined
                      ? getScoreColor(entry.metricScores[metric], metric)
                      : "#d1d5db",
                }}
              >
                {entry.metricScores[metric] !== undefined ? formatScore(entry.metricScores[metric]) : "—"}
              </Typography>
            </Cell>
          ))}

          {/* Evals */}
          <Cell>
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#6b7280" }}>
              {entry.experimentCount}
            </Typography>
          </Cell>

          {/* Provider */}
          <Cell sx={{ justifyContent: "flex-start", pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {entry.provider || "—"}
            </Typography>
          </Cell>
        </Box>
      ))}
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
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        borderRight: "1px solid #e2e8f0",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        "&:last-child": { borderRight: "none" },
        "&:hover": onClick ? { bgcolor: "#f1f5f9" } : {},
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: active ? "#1f2937" : "#64748b",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Typography>
      {active && (direction === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
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
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRight: "1px solid #f1f5f9",
        minHeight: 48,
        "&:last-child": { borderRight: "none" },
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
        return { bgcolor: "#fef3c7", color: "#b45309" };
      case 2:
        return { bgcolor: "#e5e7eb", color: "#374151" };
      case 3:
        return { bgcolor: "#fed7aa", color: "#c2410c" };
      default:
        return { bgcolor: "transparent", color: "#6b7280" };
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
