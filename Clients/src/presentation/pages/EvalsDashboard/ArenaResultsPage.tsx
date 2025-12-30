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
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  Trophy,
  Swords,
  Crown,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
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

const ArenaResultsPage: React.FC<ArenaResultsPageProps> = ({
  comparisonId,
  onBack,
}) => {
  const [results, setResults] = useState<ArenaResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Contestant colors for visual distinction
  const contestantColors = [
    { bg: "#3b82f6", light: "#dbeafe" },
    { bg: "#ef4444", light: "#fee2e2" },
    { bg: "#10b981", light: "#dcfce7" },
    { bg: "#f59e0b", light: "#fef3c7" },
    { bg: "#8b5cf6", light: "#f3e8ff" },
    { bg: "#ec4899", light: "#fce7f3" },
  ];

  const getContestantColor = (name: string) => {
    const idx = results?.contestants?.indexOf(name) ?? 0;
    return contestantColors[idx % contestantColors.length];
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={40} sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  if (error || !results) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Typography sx={{ fontSize: 16, color: "#ef4444", mb: 2 }}>
          {error || "No results found"}
        </Typography>
        <CustomizableButton
          variant="outlined"
          text="Go Back"
          onClick={onBack}
        />
      </Box>
    );
  }

  const totalRounds = results.results?.detailedResults?.length || 0;
  const isCompleted = results.status === "completed";
  const isFailed = results.status === "failed";

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton
          onClick={onBack}
          sx={{
            backgroundColor: "#f3f4f6",
            "&:hover": { backgroundColor: "#e5e7eb" },
          }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
              {results.name}
            </Typography>
            <Chip
              label={results.status.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: isCompleted ? "#dcfce7" : isFailed ? "#fee2e2" : "#fef3c7",
                color: isCompleted ? "#166534" : isFailed ? "#991b1b" : "#92400e",
                fontWeight: 700,
                fontSize: 11,
              }}
            />
          </Stack>
          {results.description && (
            <Typography sx={{ fontSize: 14, color: "#6b7280", mt: 0.5 }}>
              {results.description}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Error Message (if failed) */}
      {isFailed && results.errorMessage && (
        <Card sx={{ mb: 4, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }}>
          <CardContent>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <XCircle size={24} color="#dc2626" />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#991b1b", mb: 0.5 }}>
                  Battle Failed
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#b91c1c" }}>
                  {results.errorMessage}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Winner Card (if completed) */}
      {isCompleted && results.results?.winner && (
        <Card
          sx={{
            mb: 4,
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: "2px solid #fbbf24",
            borderRadius: "16px",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(251, 191, 36, 0.4)",
                }}
              >
                <Trophy size={40} color="#78350f" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#92400e", textTransform: "uppercase", mb: 0.5 }}>
                  Champion
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#78350f" }}>
                    {results.results.winner}
                  </Typography>
                  <Crown size={28} color="#b45309" />
                </Stack>
                <Typography sx={{ fontSize: 14, color: "#92400e", mt: 1 }}>
                  Won {results.results.winCounts?.[results.results.winner] || 0} of {totalRounds} rounds
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Battle Stats */}
      <Stack direction="row" spacing={3} mb={4}>
        {/* Contestants Scoreboard */}
        <Card sx={{ flex: 1, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Swords size={18} color="#6366f1" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                Scoreboard
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {results.contestants?.map((contestant) => {
                const wins = results.results?.winCounts?.[contestant] || 0;
                const isWinner = contestant === results.results?.winner;
                const color = getContestantColor(contestant);
                
                return (
                  <Stack key={contestant} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          backgroundColor: color.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {contestant.charAt(0)}
                      </Box>
                      <Typography sx={{ fontWeight: 500, color: "#374151" }}>
                        {contestant}
                      </Typography>
                      {isWinner && <Crown size={16} color="#f59e0b" />}
                    </Stack>
                    <Chip
                      label={`${wins} wins`}
                      size="small"
                      sx={{
                        backgroundColor: isWinner ? "#fef3c7" : "#f3f4f6",
                        color: isWinner ? "#92400e" : "#6b7280",
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Battle Info */}
        <Card sx={{ width: 300, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Target size={18} color="#6366f1" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                Battle Info
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                  Judge Model
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                  {results.judgeModel || "gpt-4o"}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                  Total Rounds
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                  {totalRounds}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                  Created
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                  {results.createdAt ? new Date(results.createdAt).toLocaleString() : "-"}
                </Typography>
              </Box>
              {results.completedAt && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                    Completed
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                    {new Date(results.completedAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Evaluation Criteria */}
      {results.metric?.criteria && (
        <Card sx={{ mb: 4, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 1 }}>
              Evaluation Criteria
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {results.metric.criteria}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.results?.detailedResults?.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#374151", mb: 2 }}>
            Round-by-Round Results
          </Typography>
          <Stack spacing={2}>
            {results.results.detailedResults.map((round, idx) => (
              <Card key={idx} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Chip
                        label={`Round ${idx + 1}`}
                        size="small"
                        sx={{
                          backgroundColor: "#f3f4f6",
                          fontWeight: 600,
                        }}
                      />
                      {round.winner ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
                            Winner: {round.winner}
                          </Typography>
                        </Stack>
                      ) : (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Clock size={16} color="#6b7280" />
                          <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
                            No winner determined
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>

                  {/* Input */}
                  {round.input && (
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                        Input
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <Typography sx={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>
                          {round.input}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Contestant Outputs */}
                  {round.contestants?.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", mb: 1 }}>
                        Responses
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        {round.contestants.map((c, cIdx) => {
                          const color = getContestantColor(c.name);
                          const isRoundWinner = c.name === round.winner;
                          
                          return (
                            <Box
                              key={cIdx}
                              sx={{
                                flex: 1,
                                p: 2,
                                borderRadius: "8px",
                                border: isRoundWinner ? `2px solid ${color.bg}` : "1px solid #e5e7eb",
                                backgroundColor: isRoundWinner ? color.light : "#fff",
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "6px",
                                    backgroundColor: color.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 11,
                                  }}
                                >
                                  {c.name.charAt(0)}
                                </Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                                  {c.name}
                                </Typography>
                                {isRoundWinner && <Trophy size={14} color="#f59e0b" />}
                              </Stack>
                              <Typography sx={{ fontSize: 12, color: "#6b7280", whiteSpace: "pre-wrap" }}>
                                {c.output || "No output"}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Reason */}
                  {round.reason && round.reason !== "Comparison completed" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", mb: 0.5 }}>
                        Judge's Reasoning
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                        {round.reason}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* No Results Message */}
      {(!results.results?.detailedResults || results.results.detailedResults.length === 0) && isCompleted && (
        <Box sx={{ textAlign: "center", py: 6, backgroundColor: "#f9fafb", borderRadius: "12px" }}>
          <AlertCircle size={32} color="#9ca3af" style={{ marginBottom: 8 }} />
          <Typography sx={{ fontSize: 14, color: "#6b7280" }}>
            No detailed results available for this battle.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ArenaResultsPage;

