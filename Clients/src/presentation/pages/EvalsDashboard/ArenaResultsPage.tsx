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
  CircularProgress,
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
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Scale,
  MessageSquare,
  Zap,
  Bot,
} from "lucide-react";
import { getArenaComparisonResults } from "../../../application/repository/deepEval.repository";
import CustomizableButton from "../../components/Button/CustomizableButton";

// Provider icons
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as OpenRouterLogo } from "../../assets/icons/openrouter_logo.svg";

const PROVIDER_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  google: GeminiLogo,
  mistral: MistralLogo,
  xai: XAILogo,
  openrouter: OpenRouterLogo,
};

// Helper to get provider display name
const getProviderDisplayName = (provider: string): string => {
  const names: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    mistral: "Mistral",
    xai: "xAI",
    openrouter: "OpenRouter",
  };
  return names[provider?.toLowerCase()] || provider || "Custom";
};

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
    provider?: string;
    scores?: Record<string, number>;
  }[];
  criteria?: string[];
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
    const isCurrentlyExpanded = expandedRounds.has(idx);
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    
    // Auto-scroll to the round when expanding (with offset for better visibility)
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const element = document.getElementById(`round-${idx}`);
        if (element) {
          const yOffset = -80; // Offset to show content above
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 150);
    }
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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <Typography
          component="span"
          onClick={onBack}
          sx={{
            fontSize: "13px",
            color: "#13715B",
            cursor: "pointer",
            textDecoration: "underline",
            textDecorationStyle: "dashed",
            textUnderlineOffset: "3px",
            "&:hover": {
              color: "#0f5a47",
            },
          }}
        >
          ← Back to arena
        </Typography>
      </Box>

      {/* Header */}
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", mb: 4 }}>
        {results.name}
      </Typography>

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

      {/* Summary Section - Winner and Battle Info */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          mb: 2,
        }}
      >
        {/* Winner Card */}
        <Box
          sx={{
            p: 1,
            borderRadius: "4px",
            background: isCompleted
              ? "linear-gradient(135deg, #fef9c3 0%, #fde047 100%)"
              : "#f9fafb",
            border: isCompleted ? "1px solid #facc15" : "1px solid #e5e7eb",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: isCompleted ? "#a16207" : "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
            Winner
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: isCompleted ? "#713f12" : "#6b7280" }}>
            {results.results?.winner || "—"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: isCompleted ? "#a16207" : "#9ca3af" }}>
            {isCompleted && results.results?.winner
              ? `${winCounts[results.results.winner] || 0} of ${totalRounds} rounds won`
              : "No winner determined"}
          </Typography>
        </Box>

        {/* Battle Info */}
        <Box
          sx={{
            p: 1,
            borderRadius: "4px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
            Battle Info
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Box>
              <Typography sx={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase" }}>
                Judge
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {results.judgeModel || "gpt-4o"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase" }}>
                Rounds
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {totalRounds}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase" }}>
                Duration
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {results.createdAt && results.completedAt
                  ? `${Math.round((new Date(results.completedAt).getTime() - new Date(results.createdAt).getTime()) / 1000)}s`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
          {results.metric?.name && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1, justifyContent: "center" }}>
              {results.metric.name.split(", ").map((criterion, idx) => (
                <Box
                  key={idx}
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: "4px",
                    backgroundColor: "rgba(19, 113, 91, 0.08)",
                    border: "1px solid rgba(19, 113, 91, 0.3)",
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#13715B" }}>
                    {criterion}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Contestant Performance Table */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b", mb: 1 }}>
          Contestant Performance
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", py: 1, pl: 2, pr: 1 }}>
                  Contestant
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", py: 1, px: 1 }}>
                  Wins
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", py: 1, px: 1 }}>
                  Losses
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", py: 1, px: 1 }}>
                  Ties
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: "#64748b", textTransform: "uppercase", py: 1, px: 1 }}>
                  Win Rate
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...contestants]
                .sort((a, b) => {
                  const winsA = winCounts[a] || 0;
                  const winsB = winCounts[b] || 0;
                  const rateA = totalRounds > 0 ? (winsA / totalRounds) * 100 : 0;
                  const rateB = totalRounds > 0 ? (winsB / totalRounds) * 100 : 0;
                  return rateB - rateA; // Descending order
                })
                .map((name) => {
                const wins = winCounts[name] || 0;
                const contestantTies = results.results?.detailedResults?.filter(
                  (r) => !r.winner && r.contestants?.some((c) => c.name === name)
                ).length || 0;
                const losses = totalRounds - wins - contestantTies;
                const winRate = totalRounds > 0 ? ((wins / totalRounds) * 100).toFixed(1) : "0.0";
                const isWinner = name === results.results?.winner;
                // Get model info for this contestant
                const contestantInfo = results.contestantInfo?.find((c) => c.name === name);
                const providerName = contestantInfo?.provider?.toLowerCase() || "";
                const ProviderIcon = PROVIDER_ICONS[providerName];

                return (
                  <TableRow key={name} sx={{ backgroundColor: "transparent" }}>
                    <TableCell sx={{ py: 1, pl: 2, pr: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "4px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {ProviderIcon ? (
                            <ProviderIcon style={{ width: 14, height: 14 }} />
                          ) : (
                            <Bot size={14} color="#64748b" />
                          )}
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                            {name}
                          </Typography>
                          {isWinner && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.25,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: "4px",
                                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                              }}
                            >
                              <Trophy size={10} color="#fff" />
                              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>WINNER</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                        {wins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                        {losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>
                        {contestantTies}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                        {winRate}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Average Scores by Criterion */}
      {(() => {
        // Calculate average scores per contestant per criterion
        const detailedResults = results.results?.detailedResults || [];
        const allCriteria = new Set<string>();
        const scoresByContestant: Record<string, Record<string, number[]>> = {};
        
        detailedResults.forEach((round) => {
          round.criteria?.forEach((c) => allCriteria.add(c));
          round.contestants?.forEach((contestant) => {
            if (contestant.scores) {
              if (!scoresByContestant[contestant.name]) {
                scoresByContestant[contestant.name] = {};
              }
              Object.entries(contestant.scores).forEach(([criterion, score]) => {
                allCriteria.add(criterion);
                if (!scoresByContestant[contestant.name][criterion]) {
                  scoresByContestant[contestant.name][criterion] = [];
                }
                scoresByContestant[contestant.name][criterion].push(score);
              });
            }
          });
        });
        
        const criteriaList = Array.from(allCriteria);
        
        if (criteriaList.length === 0) return null;
        
        return (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b", mb: 1 }}>
              Average Scores by Criterion
            </Typography>
            
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(criteriaList.length, 4)}, 1fr)`,
                gap: 1,
              }}
            >
              {criteriaList.map((criterion) => (
                <Box
                  key={criterion}
                  sx={{
                    pl: 1,
                    pr: 2,
                    py: 1,
                    borderRadius: "4px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#13715B", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {criterion}
                  </Typography>
                  <Stack spacing={1}>
                    {contestants.map((name, idx) => {
                      const scores = scoresByContestant[name]?.[criterion] || [];
                      const avgScore = scores.length > 0 
                        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                        : "-";
                      const numericScore = parseFloat(avgScore) || 0;
                      const color = getColor(idx);
                      
                      return (
                        <Box key={name}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#475569" }}>
                              {name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: 12, 
                                fontWeight: 700, 
                                color: "#111827",
                              }}
                            >
                              {avgScore}
                            </Typography>
                          </Stack>
                          <Box sx={{ height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                            <Box
                              sx={{
                                height: "100%",
                                width: `${(numericScore / 10) * 100}%`,
                                backgroundColor: color.main,
                                borderRadius: 2,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })()}

      {/* Round Results */}
      {results.results?.detailedResults?.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Round Details ({totalRounds} rounds)
            </Typography>
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
                fontSize: 11,
                color: "#13715B",
                borderColor: "#13715B",
                "&:hover": {
                  backgroundColor: "transparent",
                  borderColor: "#13715B",
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
                  id={`round-${idx}`}
                  key={idx}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Round Header */}
                  <Box
                    onClick={() => toggleRound(idx)}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      pl: 1,
                      pr: 2,
                      py: 1,
                      cursor: "pointer",
                      background: isExpanded
                        ? "#f8fafc"
                        : "transparent",
                      "&:hover": { backgroundColor: "#f8fafc" },
                    }}
                  >
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "4px",
                            backgroundColor: isExpanded ? "#13715B" : "#e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} color="#fff" />
                          ) : (
                            <ChevronRight size={14} color="#64748b" />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          Round {idx + 1}
                        </Typography>
                      </Stack>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "#64748b",
                          maxWidth: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          mt: 0.5,
                          ml: 4,
                        }}
                      >
                        {round.input?.slice(0, 80)}...
                      </Typography>
                    </Box>
                    {round.winner ? (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                        <Trophy size={14} color="#f59e0b" />
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: winnerColor?.text || "#374151",
                          }}
                        >
                          {round.winner}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#64748b",
                          mt: 0.25,
                        }}
                      >
                        Tie
                      </Typography>
                    )}
                  </Box>

                  {/* Round Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 1, pr: 2, py: 1, backgroundColor: "#fafbfc" }}>
                      {/* Prompt */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "4px",
                              backgroundColor: "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MessageSquare size={10} color="#64748b" />
                          </Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Prompt
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            p: 1,
                            backgroundColor: "#fff",
                            borderRadius: "4px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <Typography sx={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>
                            {round.input}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Responses Grid */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "4px",
                              backgroundColor: "#dcfce7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Zap size={10} color="#16a34a" />
                          </Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Responses
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(round.contestants?.length || 2, 2)}, 1fr)`,
                            gap: 1,
                          }}
                        >
                          {round.contestants?.map((c, cIdx) => {
                            const isRoundWinner = c.name === round.winner;
                            const contestantInfo = results.contestantInfo?.find((ci) => ci.name === c.name);
                            // Get provider info - use from round data or fall back to contestantInfo
                            const providerKey = (c as { provider?: string }).provider || contestantInfo?.provider || "";
                            const RoundProviderIcon = PROVIDER_ICONS[providerKey.toLowerCase()];
                            return (
                              <Box
                                key={cIdx}
                                sx={{
                                  p: 1,
                                  borderRadius: "4px",
                                  border: isRoundWinner ? `2px solid #f59e0b` : "1px solid #e2e8f0",
                                  backgroundColor: "#fff",
                                }}
                              >
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "4px",
                                        backgroundColor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {RoundProviderIcon ? (
                                        <RoundProviderIcon style={{ width: 12, height: 12 }} />
                                      ) : (
                                        <Bot size={12} color="#64748b" />
                                      )}
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                                        {c.name}
                                      </Typography>
                                      <Typography sx={{ fontSize: 10, color: "#64748b" }}>
                                        {getProviderDisplayName(providerKey)}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  {isRoundWinner && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.25,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: "4px",
                                        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                                      }}
                                    >
                                      <Trophy size={10} color="#fff" />
                                      <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>WINNER</Typography>
                                    </Box>
                                  )}
                                </Stack>
                                
                                {/* Scores per criterion */}
                                {c.scores && Object.keys(c.scores).length > 0 && (
                                  <Box sx={{ mb: 1 }}>
                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                      {Object.entries(c.scores).map(([criterion, score]) => (
                                        <Box
                                          key={criterion}
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: "4px",
                                            backgroundColor: score >= 8 ? "#ecfdf5" : score >= 6 ? "#fefce8" : "#fef2f2",
                                            border: `1px solid ${score >= 8 ? "#a7f3d0" : score >= 6 ? "#fde68a" : "#fecaca"}`,
                                          }}
                                        >
                                          <Typography sx={{ fontSize: 9, color: "#6b7280", fontWeight: 500 }}>
                                            {criterion}
                                          </Typography>
                                          <Typography 
                                            sx={{ 
                                              fontSize: 10, 
                                              fontWeight: 700, 
                                              color: score >= 8 ? "#059669" : score >= 6 ? "#d97706" : "#dc2626",
                                            }}
                                          >
                                            {score}/10
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                )}
                                
                                <Box
                                  sx={{
                                    maxHeight: 250,
                                    overflowY: "auto",
                                    pr: 0.5,
                                    "&::-webkit-scrollbar": { width: 4 },
                                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#e2e8f0", borderRadius: 2 },
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
                            p: 1,
                            backgroundColor: "#dbeafe",
                            borderRadius: "4px",
                            border: "1px solid #93c5fd",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "4px",
                                backgroundColor: "#1e40af",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Scale size={10} color="#fff" />
                            </Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Judge's Reasoning
                            </Typography>
                          </Stack>
                          <Typography sx={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.6 }}>
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
