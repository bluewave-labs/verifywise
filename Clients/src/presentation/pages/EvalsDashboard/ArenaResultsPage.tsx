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
  useTheme,
} from "@mui/material";
import {
  Trophy,
  AlertCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { getArenaComparisonResults } from "../../../application/repository/deepEval.repository";
import { CustomizableButton } from "../../components/button/customizable-button";
import StandardModal from "../../components/Modals/StandardModal";

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

// Preprocess LaTeX delimiters to work with remark-math
const preprocessLatex = (text: string): string => {
  // Convert \[ \] to $$ $$ (display math)
  let processed = text.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  // Convert \( \) to $ $ (inline math)
  processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  return processed;
};

// Markdown renderer with LaTeX support
const MarkdownRenderer = ({ content, theme }: { content: string; theme: ReturnType<typeof useTheme> }) => {
  if (!content) return null;
  
  const processedContent = preprocessLatex(content);
  
  return (
    <Box
      sx={{
        fontSize: 13,
        color: theme.palette.text.dark,
        lineHeight: 1.7,
        "& p": { mb: 1, mt: 0 },
        "& h1": { fontSize: 15, fontWeight: 700, color: theme.palette.text.primary, mt: 2, mb: 1 },
        "& h2": { fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, mt: 2, mb: 1 },
        "& h3": { fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, mt: 2, mb: 1 },
        "& h4": { fontSize: 13, fontWeight: 700, color: theme.palette.text.primary, mt: 1.5, mb: 0.5 },
        "& ul, & ol": { pl: 2.5, mb: 1 },
        "& li": { mb: 0.5 },
        "& code": {
          backgroundColor: theme.palette.background.fill,
          px: 0.75,
          py: 0.25,
          borderRadius: "4px",
          fontFamily: "'Fira Code', monospace",
          fontSize: 12,
          color: theme.palette.status.success.text,
        },
        "& pre": {
          backgroundColor: "#1e293b",
          borderRadius: "6px",
          p: 2,
          my: 1.5,
          overflow: "auto",
          "& code": {
            backgroundColor: "transparent",
            color: "#e2e8f0",
            p: 0,
          },
        },
        "& strong": { fontWeight: 600 },
        "& em": { fontStyle: "italic" },
        "& hr": { border: "none", borderTop: `1px solid ${theme.palette.border.light}`, my: 2 },
        "& blockquote": {
          borderLeft: `3px solid ${theme.palette.border.light}`,
          pl: 2,
          ml: 0,
          color: theme.palette.text.accent,
          fontStyle: "italic",
        },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          my: 1,
          fontSize: 12,
        },
        "& th, & td": {
          border: `1px solid ${theme.palette.border.light}`,
          px: 1,
          py: 0.5,
          textAlign: "left",
        },
        "& th": {
          backgroundColor: theme.palette.background.accent,
          fontWeight: 600,
        },
        // KaTeX math styling
        "& .katex": {
          fontSize: "1em",
        },
        "& .katex-display": {
          my: 1,
          overflow: "auto",
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  );
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
  const theme = useTheme();
  const [results, setResults] = useState<ArenaResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const getColor = (idx: number) => COLORS[idx % COLORS.length];

  const handleOpenRound = (idx: number) => {
    setSelectedRound(idx);
  };

  const handleCloseRound = () => {
    setSelectedRound(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error || !results) {
    return (
      <Box sx={{ textAlign: "center", py: 12 }}>
        <AlertCircle size={40} color={theme.palette.chart.red} style={{ marginBottom: 12 }} />
        <Typography sx={{ fontSize: 15, color: theme.palette.text.accent, mb: 3 }}>
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
    <Box>
      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <Typography
          component="span"
          onClick={onBack}
          sx={{
            fontSize: "13px",
            color: theme.palette.primary.main,
            cursor: "pointer",
            textDecoration: "underline",
            textDecorationStyle: "dashed",
            textUnderlineOffset: "3px",
            "&:hover": {
              color: theme.palette.primary.dark,
            },
          }}
        >
          ← Back to arena
        </Typography>
      </Box>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.text.primary }}>
          {results.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <CustomizableButton
            variant="outlined"
            onClick={() => {
              try {
                const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `arena_${comparisonId}_results.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Failed to download:", err);
              }
            }}
            startIcon={<Download size={14} />}
            sx={{
              borderColor: theme.palette.border.dark,
              color: theme.palette.text.dark,
              "&:hover": {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.status.success.bg,
              },
            }}
          >
            Download
          </CustomizableButton>
          <CustomizableButton
            variant="outlined"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
              } catch (err) {
                console.error("Failed to copy:", err);
              }
            }}
            startIcon={<Copy size={14} />}
            sx={{
              borderColor: theme.palette.border.dark,
              color: theme.palette.text.dark,
              "&:hover": {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.status.success.bg,
              },
            }}
          >
            Copy
          </CustomizableButton>
        </Stack>
      </Box>

      {/* Error State */}
      {isFailed && results.errorMessage && (
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "8px",
            backgroundColor: theme.palette.status.error.bg,
            border: `1px solid ${theme.palette.status.error.border}`,
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

      {/* Summary Section - Winner and Battle Info Combined */}
      <Box
        sx={{
          p: "12px",
          borderRadius: "4px",
          background: isCompleted
            ? "linear-gradient(135deg, #fef9c3 0%, #fde047 100%)"
            : theme.palette.background.alt,
          border: isCompleted ? "1px solid #facc15" : `1px solid ${theme.palette.border.light}`,
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Winner Section */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: isCompleted ? "#a16207" : theme.palette.text.tertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Winner
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: isCompleted ? "#713f12" : theme.palette.text.accent }}>
                {results.results?.winner || "—"}
              </Typography>
              <Typography sx={{ fontSize: 11, color: isCompleted ? "#a16207" : theme.palette.text.tertiary }}>
                {isCompleted && results.results?.winner
                  ? `${winCounts[results.results.winner] || 0} of ${totalRounds} rounds won`
                  : "No winner determined"}
              </Typography>
            </Box>
          </Stack>

          {/* Battle Info Section */}
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: 9, color: isCompleted ? "#a16207" : theme.palette.text.tertiary, textTransform: "uppercase" }}>
                Judge
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: isCompleted ? "#713f12" : theme.palette.text.dark }}>
                {results.judgeModel || "gpt-4o"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: 9, color: isCompleted ? "#a16207" : theme.palette.text.tertiary, textTransform: "uppercase" }}>
                Rounds
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: isCompleted ? "#713f12" : theme.palette.text.dark }}>
                {totalRounds}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: 9, color: isCompleted ? "#a16207" : theme.palette.text.tertiary, textTransform: "uppercase" }}>
                Duration
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: isCompleted ? "#713f12" : theme.palette.text.dark }}>
                {results.createdAt && results.completedAt
                  ? `${Math.round((new Date(results.completedAt).getTime() - new Date(results.createdAt).getTime()) / 1000 / 1000)} seconds`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* Contestant Performance Table */}
      <Box sx={{ mt: "16px", mb: "16px" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
          Contestant performance
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.border.light}`, borderRadius: "4px", overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.background.accent }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, color: theme.palette.chart.slate, textTransform: "uppercase", py: 1, pl: 2, pr: 1 }}>
                  Contestant
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: theme.palette.chart.slate, textTransform: "uppercase", py: 1, px: 1 }}>
                  Wins
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: theme.palette.chart.slate, textTransform: "uppercase", py: 1, px: 1 }}>
                  Losses
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: theme.palette.chart.slate, textTransform: "uppercase", py: 1, px: 1 }}>
                  Ties
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: theme.palette.chart.slate, textTransform: "uppercase", py: 1, px: 1 }}>
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
                            backgroundColor: theme.palette.background.accent,
                            border: `1px solid ${theme.palette.border.light}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {ProviderIcon ? (
                            <ProviderIcon style={{ width: 14, height: 14 }} />
                          ) : (
                            <Bot size={14} color={theme.palette.chart.slate} />
                          )}
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>
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
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.chart.emerald }}>
                        {wins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.chart.red }}>
                        {losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.text.accent }}>
                        {contestantTies}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.dark }}>
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
          <Box sx={{ mt: "16px", mb: "16px" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
              Average scores by criteria
            </Typography>
            
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(criteriaList.length, 4)}, 1fr)`,
                gap: "16px",
              }}
            >
              {criteriaList.map((criterion) => (
                <Box
                  key={criterion}
                  sx={{
                    p: "8px",
                    borderRadius: "4px",
                    backgroundColor: theme.palette.background.accent,
                    border: `1px solid ${theme.palette.border.light}`,
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.primary.main, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {criterion}
                  </Typography>
                  <Stack spacing="8px">
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
                            <Typography sx={{ fontSize: 11, fontWeight: 500, color: theme.palette.text.tertiary }}>
                              {name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: 12, 
                                fontWeight: 700, 
                                color: theme.palette.text.primary,
                              }}
                            >
                              {avgScore}
                            </Typography>
                          </Stack>
                          <Box sx={{ height: 4, backgroundColor: theme.palette.border.light, borderRadius: 2, overflow: "hidden" }}>
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

      {/* Round Results - Clickable Cards */}
      {results.results?.detailedResults?.length > 0 && (
        <Box sx={{ mt: "16px" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
            Round details ({totalRounds} rounds)
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            {results.results.detailedResults.map((round, idx) => (
                <Box
                  key={idx}
                  onClick={() => handleOpenRound(idx)}
                  sx={{
                    p: "12px",
                    border: `1px solid ${theme.palette.border.light}`,
                    borderRadius: "4px",
                    backgroundColor: theme.palette.background.main,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: theme.palette.background.accent,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.primary }}>
                      Round {idx + 1}
                    </Typography>
                    {round.winner ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Trophy size={12} color="#f59e0b" />
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: theme.palette.text.dark,
                          }}
                        >
                          {round.winner}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.chart.slate }}>
                        Tie
                      </Typography>
                    )}
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: theme.palette.chart.slate,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {round.input?.slice(0, 60)}...
                  </Typography>
                </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Round Details Modal */}
      {selectedRound !== null && results.results?.detailedResults?.[selectedRound] && (() => {
        const round = results.results.detailedResults[selectedRound];
        const totalDetailedRounds = results.results.detailedResults.length;
        const isFirstRound = selectedRound === 0;
        const isLastRound = selectedRound === totalDetailedRounds - 1;

        const handlePrevious = () => {
          if (!isFirstRound) {
            setSelectedRound(selectedRound - 1);
          }
        };

        const handleNext = () => {
          if (!isLastRound) {
            setSelectedRound(selectedRound + 1);
          }
        };

        return (
          <StandardModal
            isOpen={selectedRound !== null}
            onClose={handleCloseRound}
            title={`Round ${selectedRound + 1}`}
            description={round.winner ? `Winner: ${round.winner}` : "Result: Tie"}
            maxWidth="1100px"
            fitContent
            customFooter={
              <Stack direction="row" spacing="8px" sx={{ width: "100%", justifyContent: "flex-end" }}>
                <CustomizableButton
                  variant="outlined"
                  text="Previous"
                  onClick={handlePrevious}
                  isDisabled={isFirstRound}
                  icon={<ChevronLeft size={16} />}
                  sx={{
                    minWidth: "100px",
                    height: "34px",
                    border: `1px solid ${theme.palette.border.dark}`,
                    color: isFirstRound ? theme.palette.text.tertiary : theme.palette.text.secondary,
                    "&:hover:not(.Mui-disabled)": {
                      backgroundColor: theme.palette.background.alt,
                      border: `1px solid ${theme.palette.border.dark}`,
                    },
                  }}
                />
                <CustomizableButton
                  variant="outlined"
                  text="Next"
                  onClick={handleNext}
                  isDisabled={isLastRound}
                  icon={<ChevronRight size={16} />}
                  sx={{
                    minWidth: "100px",
                    height: "34px",
                    border: `1px solid ${theme.palette.border.dark}`,
                    color: isLastRound ? theme.palette.text.tertiary : theme.palette.text.secondary,
                    "&:hover:not(.Mui-disabled)": {
                      backgroundColor: theme.palette.background.alt,
                      border: `1px solid ${theme.palette.border.dark}`,
                    },
                    flexDirection: "row-reverse",
                    "& .MuiButton-startIcon": {
                      marginLeft: "8px",
                      marginRight: "-4px",
                    },
                  }}
                />
              </Stack>
            }
          >
            {/* Prompt */}
            <Box sx={{ mb: "16px" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.tertiary, textTransform: "uppercase", letterSpacing: "0.05em", mb: "8px" }}>
                Prompt
              </Typography>
              <Box
                sx={{
                  p: "12px",
                  backgroundColor: theme.palette.background.accent,
                  borderRadius: "4px",
                  border: `1px solid ${theme.palette.border.light}`,
                }}
              >
                <Typography sx={{ fontSize: 13, color: theme.palette.text.primary, lineHeight: 1.6 }}>
                  {round.input}
                </Typography>
              </Box>
            </Box>

            {/* Responses Grid */}
            <Box sx={{ mb: "16px" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.tertiary, textTransform: "uppercase", letterSpacing: "0.05em", mb: "8px" }}>
                Responses
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(round.contestants?.length || 2, 2)}, 1fr)`,
                  gap: "12px",
                }}
              >
                {round.contestants?.map((c, cIdx) => {
                  const isRoundWinner = c.name === round.winner;
                  const contestantInfo = results.contestantInfo?.find((ci) => ci.name === c.name);
                  const providerKey = (c as { provider?: string }).provider || contestantInfo?.provider || "";
                  const RoundProviderIcon = PROVIDER_ICONS[providerKey.toLowerCase()];
                  return (
                    <Box
                      key={cIdx}
                      sx={{
                        p: "12px",
                        borderRadius: "4px",
                        border: isRoundWinner ? `2px solid #f59e0b` : `1px solid ${theme.palette.border.light}`,
                        backgroundColor: theme.palette.background.main,
                        minWidth: 0,
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: "8px" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              backgroundColor: theme.palette.background.accent,
                              border: `1px solid ${theme.palette.border.light}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {RoundProviderIcon ? (
                              <RoundProviderIcon style={{ width: 12, height: 12 }} />
                            ) : (
                              <Bot size={12} color={theme.palette.chart.slate} />
                            )}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.primary }}>
                              {c.name}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: theme.palette.chart.slate }}>
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
                              flexShrink: 0,
                            }}
                          >
                            <Trophy size={10} color="#fff" />
                            <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>WINNER</Typography>
                          </Box>
                        )}
                      </Stack>

                      {/* Scores per criterion */}
                      {c.scores && Object.keys(c.scores).length > 0 && (
                        <Box sx={{ mb: "8px" }}>
                          <Stack direction="row" flexWrap="wrap" gap="8px">
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
                                <Typography sx={{ fontSize: 9, color: theme.palette.text.accent, fontWeight: 500 }}>
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

                      {/* Separator line */}
                      <Box sx={{ borderTop: `1px solid ${theme.palette.border.light}`, mt: "8px", mb: "8px" }} />

                      <Box
                        sx={{
                          overflowX: "hidden",
                          wordBreak: "break-word",
                        }}
                      >
                        <MarkdownRenderer content={c.output || "No output"} />
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
                  p: "12px",
                  backgroundColor: theme.palette.background.accent,
                  borderRadius: "4px",
                  border: `1px solid ${theme.palette.border.light}`,
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.tertiary, textTransform: "uppercase", letterSpacing: "0.05em", mb: "8px" }}>
                  Judge's reasoning
                </Typography>
                <Box sx={{ fontSize: 12, color: theme.palette.text.primary, lineHeight: 1.6 }}>
                  <MarkdownRenderer content={round.reason} />
                </Box>
              </Box>
            )}
          </StandardModal>
        );
      })()}

      {/* Empty State */}
      {(!results.results?.detailedResults || results.results.detailedResults.length === 0) && isCompleted && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: theme.palette.background.alt,
            borderRadius: "12px",
            border: `1px solid ${theme.palette.border.light}`,
          }}
        >
          <AlertCircle size={32} color=theme.palette.text.tertiary style={{ marginBottom: 12 }} />
          <Typography sx={{ fontSize: 14, color: theme.palette.text.accent }}>
            No detailed results available for this battle.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ArenaResultsPage;
