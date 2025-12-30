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
  Cpu,
} from "lucide-react";
import { getArenaComparisonResults } from "../../../application/repository/deepEval.repository";
import CustomizableButton from "../../components/Button/CustomizableButton";

// Simple markdown renderer for LLM outputs
const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockContent = [];
        continue;
      } else {
        // End of code block
        elements.push(
          <Box
            key={key++}
            sx={{
              backgroundColor: "#1e293b",
              borderRadius: "6px",
              p: 2,
              my: 1.5,
              overflow: "auto",
            }}
          >
            {codeBlockLang && (
              <Typography sx={{ fontSize: 10, color: "#94a3b8", mb: 1, fontWeight: 600 }}>
                {codeBlockLang}
              </Typography>
            )}
            <Typography
              component="pre"
              sx={{
                fontFamily: "'Fira Code', 'Monaco', monospace",
                fontSize: 12,
                color: "#e2e8f0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                m: 0,
              }}
            >
              {codeBlockContent.join('\n')}
            </Typography>
          </Box>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = "";
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headers
    if (line.startsWith('### ')) {
      elements.push(
        <Typography key={key++} sx={{ fontSize: 14, fontWeight: 700, color: "#1e293b", mt: 2, mb: 1 }}>
          {line.slice(4)}
        </Typography>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Typography key={key++} sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b", mt: 2, mb: 1 }}>
          {line.slice(3)}
        </Typography>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <Typography key={key++} sx={{ fontSize: 16, fontWeight: 700, color: "#1e293b", mt: 2, mb: 1 }}>
          {line.slice(2)}
        </Typography>
      );
      continue;
    }

    // Handle horizontal rules
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(<Box key={key++} sx={{ borderBottom: "1px solid #e2e8f0", my: 2 }} />);
      continue;
    }

    // Handle list items
    if (line.match(/^[-*•]\s/)) {
      const content = line.slice(2);
      elements.push(
        <Typography key={key++} sx={{ fontSize: 13, color: "#374151", pl: 2, mb: 0.5, display: "flex" }}>
          <Box component="span" sx={{ mr: 1, color: "#6b7280" }}>•</Box>
          {renderInlineMarkdown(content)}
        </Typography>
      );
      continue;
    }

    // Handle numbered list items
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <Typography key={key++} sx={{ fontSize: 13, color: "#374151", pl: 2, mb: 0.5, display: "flex" }}>
          <Box component="span" sx={{ mr: 1, color: "#6b7280", minWidth: 16 }}>{numberedMatch[1]}.</Box>
          {renderInlineMarkdown(numberedMatch[2])}
        </Typography>
      );
      continue;
    }

    // Regular paragraphs
    if (line.trim()) {
      elements.push(
        <Typography key={key++} sx={{ fontSize: 13, color: "#374151", lineHeight: 1.7, mb: 1 }}>
          {renderInlineMarkdown(line)}
        </Typography>
      );
    } else {
      // Empty line - add spacing
      elements.push(<Box key={key++} sx={{ height: 8 }} />);
    }
  }

  return <>{elements}</>;
};

// Render inline markdown (bold, italic, code, links)
const renderInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Pattern for bold, italic, code, and links
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/, render: (match: string) => <strong key={key++}>{match}</strong> },
    { regex: /\*([^*]+)\*/, render: (match: string) => <em key={key++}>{match}</em> },
    { regex: /`([^`]+)`/, render: (match: string) => (
      <Box
        component="code"
        key={key++}
        sx={{
          backgroundColor: "#f1f5f9",
          px: 0.75,
          py: 0.25,
          borderRadius: "4px",
          fontFamily: "'Fira Code', monospace",
          fontSize: 12,
          color: "#0f766e",
        }}
      >
        {match}
      </Box>
    )},
  ];

  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; rendered: React.ReactNode } | null = null;

    for (const { regex, render } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            rendered: render(match[1]),
          };
        }
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        parts.push(remaining.slice(0, earliestMatch.index));
      }
      parts.push(earliestMatch.rendered);
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
};

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
    model?: string;
  }[];
}

interface ContestantInfo {
  name: string;
  model?: string;
  provider?: string;
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
  contestantInfo?: ContestantInfo[];
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
            background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
            background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
            border: "1px solid #cbd5e1",
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
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 size={18} color="#fff" />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Contestant Performance
          </Typography>
        </Stack>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Contestant
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Wins
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Losses
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ties
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                // Get model info for this contestant
                const contestantInfo = results.contestantInfo?.find((c) => c.name === name);
                const modelDisplay = contestantInfo?.model || "Unknown model";

                return (
                  <TableRow key={name} sx={{ backgroundColor: isWinner ? "#fffbeb" : "transparent" }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            backgroundColor: color.main,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {name.charAt(0)}
                        </Box>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              {name}
                            </Typography>
                            {isWinner && <Trophy size={14} color="#f59e0b" />}
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Cpu size={10} color="#9ca3af" />
                            <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                              {modelDisplay}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                        {wins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>
                        {losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>
                        {contestantTies}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${winRate}%`}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: isWinner ? "#fef3c7" : "#f1f5f9",
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={18} color="#fff" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                  Round Details
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                  {totalRounds} rounds evaluated
                </Typography>
              </Box>
            </Stack>
            <CustomizableButton
              variant="outlined"
              text={expandedRounds.size === totalRounds ? "Collapse All" : "Expand All"}
              onClick={() => {
                if (expandedRounds.size === totalRounds) {
                  setExpandedRounds(new Set());
                } else {
                  setExpandedRounds(new Set(results.results.detailedResults.map((_, i) => i)));
                }
              }}
              sx={{
                fontSize: 12,
                color: "#6366f1",
                borderColor: "#e0e7ff",
                "&:hover": {
                  backgroundColor: "#eef2ff",
                  borderColor: "#6366f1",
                },
              }}
            />
          </Stack>

          <Stack spacing={2}>
            {results.results.detailedResults.map((round, idx) => {
              const isExpanded = expandedRounds.has(idx);
              const winnerColor = round.winner
                ? getColor(contestants.indexOf(round.winner))
                : null;

              return (
                <Box
                  key={idx}
                  sx={{
                    border: isExpanded ? "2px solid #c7d2fe" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    boxShadow: isExpanded ? "0 4px 12px rgba(99,102,241,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Round Header */}
                  <Box
                    onClick={() => toggleRound(idx)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 2,
                      cursor: "pointer",
                      background: isExpanded
                        ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
                        : "transparent",
                      "&:hover": { backgroundColor: "#f8fafc" },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          backgroundColor: isExpanded ? "#6366f1" : "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} color="#fff" />
                        ) : (
                          <ChevronRight size={16} color="#64748b" />
                        )}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                          Round {idx + 1}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#64748b",
                            maxWidth: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {round.input?.slice(0, 80)}...
                        </Typography>
                      </Box>
                    </Stack>
                    {round.winner ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Trophy size={16} color="#f59e0b" />
                        <Chip
                          label={round.winner}
                          size="small"
                          sx={{
                            height: 28,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: winnerColor?.light || "#f3f4f6",
                            color: winnerColor?.text || "#374151",
                            border: `1px solid ${winnerColor?.main || "#e2e8f0"}`,
                          }}
                        />
                      </Stack>
                    ) : (
                      <Chip
                        label="Tie"
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: "#f1f5f9",
                          color: "#64748b",
                        }}
                      />
                    )}
                  </Box>

                  {/* Round Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ px: 4, py: 3, backgroundColor: "#fafbfc" }}>
                      {/* Prompt */}
                      <Box sx={{ mb: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "6px",
                              backgroundColor: "#e0e7ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MessageSquare size={12} color="#6366f1" />
                          </Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Prompt
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            p: 3,
                            backgroundColor: "#fff",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Typography sx={{ fontSize: 14, color: "#1e293b", lineHeight: 1.7 }}>
                            {round.input}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Responses Grid */}
                      <Box sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "6px",
                              backgroundColor: "#dcfce7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Zap size={12} color="#16a34a" />
                          </Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Responses
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(round.contestants?.length || 2, 2)}, 1fr)`,
                            gap: 3,
                          }}
                        >
                          {round.contestants?.map((c, cIdx) => {
                            const color = getColor(contestants.indexOf(c.name));
                            const isRoundWinner = c.name === round.winner;
                            const contestantInfo = results.contestantInfo?.find((ci) => ci.name === c.name);
                            return (
                              <Box
                                key={cIdx}
                                sx={{
                                  p: 3,
                                  borderRadius: "12px",
                                  border: isRoundWinner ? `2px solid ${color.main}` : "1px solid #e2e8f0",
                                  backgroundColor: isRoundWinner ? color.light : "#fff",
                                  boxShadow: isRoundWinner ? `0 4px 12px ${color.main}20` : "0 1px 3px rgba(0,0,0,0.04)",
                                }}
                              >
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "8px",
                                        backgroundColor: color.main,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      {c.name.charAt(0)}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                                        {c.name}
                                      </Typography>
                                      {contestantInfo?.model && (
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                          <Cpu size={10} color="#64748b" />
                                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                            {contestantInfo.model}
                                          </Typography>
                                        </Stack>
                                      )}
                                    </Box>
                                  </Stack>
                                  {isRoundWinner && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: "16px",
                                        backgroundColor: "#fef3c7",
                                      }}
                                    >
                                      <Trophy size={12} color="#f59e0b" />
                                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#92400e" }}>WINNER</Typography>
                                    </Box>
                                  )}
                                </Stack>
                                <Box
                                  sx={{
                                    maxHeight: 350,
                                    overflowY: "auto",
                                    pr: 1,
                                    "&::-webkit-scrollbar": { width: 6 },
                                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#e2e8f0", borderRadius: 3 },
                                  }}
                                >
                                  {renderMarkdown(c.output || "No output")}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>

                      {/* Judge Reasoning */}
                      {round.reason && !round.reason.toLowerCase().includes("judge selected") && (
                        <Box
                          sx={{
                            p: 3,
                            background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                            borderRadius: "12px",
                            border: "1px solid #fde047",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "6px",
                                backgroundColor: "#fbbf24",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Scale size={12} color="#78350f" />
                            </Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Judge's Reasoning
                            </Typography>
                          </Stack>
                          <Typography sx={{ fontSize: 13, color: "#78350f", lineHeight: 1.7 }}>
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
