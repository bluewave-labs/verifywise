/**
 * Arena Results Page
 *
 * Displays detailed results of an LLM Arena battle.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Trophy,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Scale,
  BarChart3,
  MessageSquare,
  Zap,
} from "lucide-react";
import { getArenaComparisonResults } from "../../../application/repository/deepEval.repository";
import CustomizableButton from "../../components/Button/CustomizableButton";

interface ArenaResultsPageProps {
  comparisonId: string;
  onBack: () => void;
}

interface DetailedResult {
  testCaseIndex: number;
  input: string;
  winner: string | null;
  reason: string;
  contestants: {
    name: string;
    output: string;
  }[];
}

interface ArenaResults {
  id: string;
  name: string;
  description?: string;
  status: string;
  metric?: {
    name?: string;
    criteria?: string;
  };
  judgeModel?: string;
  results: {
    winner: string | null;
    winCounts: Record<string, number>;
    detailedResults: DetailedResult[];
  };
  contestants: string[];
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

// Contestant colors
const COLORS = [
  { main: "#3b82f6", light: "#eff6ff", text: "#1e40af" },
  { main: "#ef4444", light: "#fef2f2", text: "#991b1b" },
  { main: "#10b981", light: "#ecfdf5", text: "#065f46" },
  { main: "#f59e0b", light: "#fffbeb", text: "#92400e" },
  { main: "#8b5cf6", light: "#f5f3ff", text: "#5b21b6" },
  { main: "#ec4899", light: "#fdf2f8", text: "#9d174d" },
];

const ArenaResultsPage: React.FC<ArenaResultsPageProps> = ({
  comparisonId,
  onBack,
}) => {
  const [results, setResults] = useState<ArenaResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const data = await getArenaComparisonResults(comparisonId);
        setResults(data);
      } catch (err) {
        console.error("Failed to load arena results:", err);
        setError("Failed to load arena results");
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [comparisonId]);

  const toggleRound = (idx: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const getColor = (idx: number) => COLORS[idx % COLORS.length];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <CircularProgress size={32} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error || !results) {
    return (
      <Box sx={{ textAlign: "center", py: 12 }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
        <Typography sx={{ fontSize: 15, color: "#6b7280", mb: 3 }}>
          {error || "No results found"}
        </Typography>
        <CustomizableButton variant="outlined" text="Go Back" onClick={onBack} />
      </Box>
    );
  }

  const totalRounds = results.results?.detailedResults?.length || 0;
  const isCompleted = results.status === "completed";
  const isFailed = results.status === "failed";
  const winCounts = results.results?.winCounts || {};
  const contestants = results.contestants || [];
  const ties = results.results?.detailedResults?.filter((r) => !r.winner).length || 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            border: "1px solid #e5e7eb",
            "&:hover": { backgroundColor: "#f9fafb" },
          }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#111827" }}>
          {results.name}
        </Typography>
        <Chip
          label={results.status.charAt(0).toUpperCase() + results.status.slice(1)}
          size="small"
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isCompleted ? "#dcfce7" : isFailed ? "#fee2e2" : "#fef3c7",
            color: isCompleted ? "#166534" : isFailed ? "#991b1b" : "#92400e",
          }}
        />
      </Stack>

      {/* Error State */}
      {isFailed && results.errorMessage && (
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "8px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#991b1b", mb: 0.5 }}>
            Battle Failed
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#b91c1c" }}>
            {results.errorMessage}
          </Typography>
        </Box>
      )}

      {/* Summary Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 320px",
          gap: 3,
          mb: 4,
        }}
      >
        {/* Winner Card */}
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            background: isCompleted
              ? "linear-gradient(135deg, #fef9c3 0%, #fde047 100%)"
              : "#f9fafb",
            border: isCompleted ? "1px solid #facc15" : "1px solid #e5e7eb",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Trophy size={16} color={isCompleted ? "#a16207" : "#9ca3af"} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: isCompleted ? "#a16207" : "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Winner
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: isCompleted ? "#713f12" : "#6b7280", mb: 0.5 }}>
            {results.results?.winner || "—"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: isCompleted ? "#a16207" : "#9ca3af" }}>
            {isCompleted && results.results?.winner
              ? `${winCounts[results.results.winner] || 0} of ${totalRounds} rounds won`
              : "No winner determined"}
          </Typography>
        </Box>

        {/* Score Distribution */}
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <BarChart3 size={16} color="#6366f1" />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Score Distribution
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {contestants.map((name, idx) => {
              const wins = winCounts[name] || 0;
              const pct = totalRounds > 0 ? (wins / totalRounds) * 100 : 0;
              const color = getColor(idx);
              return (
                <Box key={name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                      {name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: color.text }}>
                      {wins} wins ({pct.toFixed(0)}%)
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: color.main,
                        borderRadius: 3,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
            {ties > 0 && (
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.5 }}>
                {ties} tie{ties > 1 ? "s" : ""}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Battle Info */}
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Scale size={16} color="#6b7280" />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Battle Info
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            <Box>
              <Typography sx={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>
                Judge Model
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                {results.judgeModel || "gpt-4o"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>
                Total Rounds
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                {totalRounds}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>
                Duration
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                {results.createdAt && results.completedAt
                  ? `${Math.round((new Date(results.completedAt).getTime() - new Date(results.createdAt).getTime()) / 1000)}s`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Contestant Scores Table */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 2 }}>
          Contestant Performance
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                  Model
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                  Wins
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                  Losses
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                  Ties
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: "#6b7280" }}>
                  Win Rate
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contestants.map((name, idx) => {
                const wins = winCounts[name] || 0;
                const contestantTies = results.results?.detailedResults?.filter(
                  (r) => !r.winner && r.contestants?.some((c) => c.name === name)
                ).length || 0;
                const losses = totalRounds - wins - contestantTies;
                const winRate = totalRounds > 0 ? ((wins / totalRounds) * 100).toFixed(1) : "0.0";
                const color = getColor(idx);
                const isWinner = name === results.results?.winner;

                return (
                  <TableRow key={name} sx={{ backgroundColor: isWinner ? "#fffbeb" : "transparent" }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "6px",
                            backgroundColor: color.main,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {name.charAt(0)}
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                          {name}
                        </Typography>
                        {isWinner && <Trophy size={14} color="#f59e0b" />}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>
                        {wins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#ef4444" }}>
                        {losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>
                        {contestantTies}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${winRate}%`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: isWinner ? "#fef3c7" : "#f3f4f6",
                          color: isWinner ? "#92400e" : "#374151",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Round Results */}
      {results.results?.detailedResults?.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Round Details
            </Typography>
            <CustomizableButton
              variant="text"
              text={expandedRounds.size === totalRounds ? "Collapse All" : "Expand All"}
              onClick={() => {
                if (expandedRounds.size === totalRounds) {
                  setExpandedRounds(new Set());
                } else {
                  setExpandedRounds(new Set(results.results.detailedResults.map((_, i) => i)));
                }
              }}
              sx={{ fontSize: 12, color: "#6366f1" }}
            />
          </Stack>

          <Stack spacing={1}>
            {results.results.detailedResults.map((round, idx) => {
              const isExpanded = expandedRounds.has(idx);
              const winnerColor = round.winner
                ? getColor(contestants.indexOf(round.winner))
                : null;

              return (
                <Box
                  key={idx}
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                  }}
                >
                  {/* Round Header */}
                  <Box
                    onClick={() => toggleRound(idx)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#f9fafb" : "transparent",
                      "&:hover": { backgroundColor: "#f9fafb" },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {isExpanded ? (
                        <ChevronDown size={16} color="#6b7280" />
                      ) : (
                        <ChevronRight size={16} color="#6b7280" />
                      )}
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                        Round {idx + 1}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#9ca3af",
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {round.input?.slice(0, 60)}...
                      </Typography>
                    </Stack>
                    {round.winner ? (
                      <Chip
                        icon={<Trophy size={12} />}
                        label={round.winner}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: winnerColor?.light || "#f3f4f6",
                          color: winnerColor?.text || "#374151",
                          "& .MuiChip-icon": { color: winnerColor?.main },
                        }}
                      />
                    ) : (
                      <Chip
                        label="Tie"
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280",
                        }}
                      />
                    )}
                  </Box>

                  {/* Round Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6" }}>
                      {/* Prompt */}
                      <Box sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <MessageSquare size={12} color="#6b7280" />
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>
                            Prompt
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "#f9fafb",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <Typography sx={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>
                            {round.input}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Responses Grid */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Zap size={12} color="#6b7280" />
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>
                            Responses
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${round.contestants?.length || 2}, 1fr)`,
                            gap: 2,
                          }}
                        >
                          {round.contestants?.map((c, cIdx) => {
                            const color = getColor(contestants.indexOf(c.name));
                            const isRoundWinner = c.name === round.winner;
                            return (
                              <Box
                                key={cIdx}
                                sx={{
                                  p: 2,
                                  borderRadius: "8px",
                                  border: isRoundWinner ? `2px solid ${color.main}` : "1px solid #e5e7eb",
                                  backgroundColor: isRoundWinner ? color.light : "#fff",
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "4px",
                                      backgroundColor: color.main,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#fff",
                                      fontWeight: 600,
                                      fontSize: 10,
                                    }}
                                  >
                                    {c.name.charAt(0)}
                                  </Box>
                                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                                    {c.name}
                                  </Typography>
                                  {isRoundWinner && <Trophy size={12} color="#f59e0b" />}
                                </Stack>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                    maxHeight: 200,
                                    overflowY: "auto",
                                  }}
                                >
                                  {c.output || "No output"}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>

                      {/* Judge Reasoning */}
                      {round.reason && !round.reason.toLowerCase().includes("judge selected") && (
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "#fffbeb",
                            borderRadius: "6px",
                            border: "1px solid #fef3c7",
                          }}
                        >
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#92400e", textTransform: "uppercase", mb: 0.5 }}>
                            Judge's Reasoning
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#78350f", fontStyle: "italic" }}>
                            {round.reason}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Empty State */}
      {(!results.results?.detailedResults || results.results.detailedResults.length === 0) && isCompleted && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <AlertCircle size={32} color="#9ca3af" style={{ marginBottom: 12 }} />
          <Typography sx={{ fontSize: 14, color: "#6b7280" }}>
            No detailed results available for this battle.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ArenaResultsPage;
