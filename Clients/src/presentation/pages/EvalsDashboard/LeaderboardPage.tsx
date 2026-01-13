/**
 * LLM Leaderboard Page
 * 
 * Displays model rankings based on actual evaluation metric results.
 * Unlike vote-based leaderboards, this uses real performance data from experiments.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Trophy,
  Medal,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  TrendingUp,
  Filter,
  BarChart3,
} from "lucide-react";
import { getAllExperiments } from "../../../application/repository/deepEval.repository";

// Metric display configuration
const METRIC_CONFIG: Record<string, { name: string; description: string; higherIsBetter: boolean }> = {
  completeness: { name: "Completeness", description: "How complete is the response?", higherIsBetter: true },
  correctness: { name: "Correctness", description: "Is the information accurate?", higherIsBetter: true },
  relevance: { name: "Relevance", description: "How relevant is the response?", higherIsBetter: true },
  coherence: { name: "Coherence", description: "Is the response well-structured?", higherIsBetter: true },
  faithfulness: { name: "Faithfulness", description: "Does it stay true to the source?", higherIsBetter: true },
  hallucination: { name: "Hallucination", description: "Does it make things up?", higherIsBetter: false },
  bias: { name: "Bias", description: "Is the response unbiased?", higherIsBetter: false },
  toxicity: { name: "Toxicity", description: "Is the response safe?", higherIsBetter: false },
  answerRelevancy: { name: "Answer Relevancy", description: "How relevant is the answer?", higherIsBetter: true },
  contextualRelevancy: { name: "Contextual Relevancy", description: "Uses context appropriately?", higherIsBetter: true },
  knowledgeRetention: { name: "Knowledge Retention", description: "Retains context across turns?", higherIsBetter: true },
  taskCompletion: { name: "Task Completion", description: "Completes the given task?", higherIsBetter: true },
  instructionFollowing: { name: "Instruction Following", description: "Follows instructions?", higherIsBetter: true },
  conversationSafety: { name: "Conversation Safety", description: "Maintains safe conversation?", higherIsBetter: true },
  turnRelevancy: { name: "Turn Relevancy", description: "Each turn is relevant?", higherIsBetter: true },
  conversationCoherence: { name: "Conversation Coherence", description: "Coherent across turns?", higherIsBetter: true },
  conversationHelpfulness: { name: "Conversation Helpfulness", description: "Helpful throughout?", higherIsBetter: true },
};

// Get display-friendly metric name
const getMetricDisplayName = (key: string): string => {
  return METRIC_CONFIG[key]?.name || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
};

interface LeaderboardEntry {
  rank: number;
  model: string;
  provider?: string;
  avgScore: number;
  metricScores: Record<string, number>;
  experimentCount: number;
  lastEvaluated: string;
  trend?: "up" | "down" | "stable";
}

interface LeaderboardPageProps {
  orgId?: string | null;
}

export default function LeaderboardPage({ orgId }: LeaderboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMetric, setSortMetric] = useState<string>("avgScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);

  // Load and aggregate experiment data
  const loadLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all experiments (we'll aggregate across all projects)
      const data = await getAllExperiments();
      const experiments = data.experiments || [];
      
      // Aggregate by model
      const modelAggregates: Record<string, {
        scores: Record<string, number[]>;
        experimentCount: number;
        lastEvaluated: string;
        provider?: string;
      }> = {};
      
      const allMetrics = new Set<string>();
      
      experiments.forEach((exp: any) => {
        if (exp.status !== "completed") return;
        
        const modelName = exp.model || exp.results?.model || "Unknown Model";
        const provider = exp.provider;
        const avgScores = exp.results?.avg_scores || exp.avgScores || {};
        
        if (!modelAggregates[modelName]) {
          modelAggregates[modelName] = {
            scores: {},
            experimentCount: 0,
            lastEvaluated: exp.createdAt || exp.timestamp || new Date().toISOString(),
            provider,
          };
        }
        
        modelAggregates[modelName].experimentCount++;
        
        // Update last evaluated date
        const expDate = new Date(exp.createdAt || exp.timestamp || 0);
        const currentDate = new Date(modelAggregates[modelName].lastEvaluated);
        if (expDate > currentDate) {
          modelAggregates[modelName].lastEvaluated = exp.createdAt || exp.timestamp;
        }
        
        // Collect all metric scores
        Object.entries(avgScores).forEach(([metric, score]) => {
          if (typeof score === "number" && !isNaN(score)) {
            allMetrics.add(metric);
            if (!modelAggregates[modelName].scores[metric]) {
              modelAggregates[modelName].scores[metric] = [];
            }
            modelAggregates[modelName].scores[metric].push(score);
          }
        });
      });
      
      // Calculate averages and create entries
      const leaderboardEntries: LeaderboardEntry[] = Object.entries(modelAggregates)
        .filter(([_, data]) => Object.keys(data.scores).length > 0)
        .map(([model, data]) => {
          const metricScores: Record<string, number> = {};
          let totalScore = 0;
          let metricCount = 0;
          
          Object.entries(data.scores).forEach(([metric, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            metricScores[metric] = avg;
            
            // For average, invert "lower is better" metrics
            const config = METRIC_CONFIG[metric];
            const normalizedScore = config && !config.higherIsBetter ? (1 - avg) : avg;
            totalScore += normalizedScore;
            metricCount++;
          });
          
          return {
            rank: 0,
            model,
            provider: data.provider,
            avgScore: metricCount > 0 ? totalScore / metricCount : 0,
            metricScores,
            experimentCount: data.experimentCount,
            lastEvaluated: data.lastEvaluated,
          };
        });
      
      setAvailableMetrics(Array.from(allMetrics).sort());
      setEntries(leaderboardEntries);
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // Sort and filter entries
  const sortedEntries = useMemo(() => {
    let filtered = entries.filter(entry => 
      entry.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort by selected metric
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      if (sortMetric === "avgScore") {
        aValue = a.avgScore;
        bValue = b.avgScore;
      } else if (sortMetric === "experimentCount") {
        aValue = a.experimentCount;
        bValue = b.experimentCount;
      } else {
        aValue = a.metricScores[sortMetric] ?? 0;
        bValue = b.metricScores[sortMetric] ?? 0;
      }
      
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
    
    // Assign ranks
    return filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [entries, searchQuery, sortMetric, sortDirection]);

  // Get visible metrics (top 6 most common)
  const visibleMetrics = useMemo(() => {
    const metricCounts: Record<string, number> = {};
    entries.forEach(entry => {
      Object.keys(entry.metricScores).forEach(metric => {
        metricCounts[metric] = (metricCounts[metric] || 0) + 1;
      });
    });
    return Object.entries(metricCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([metric]) => metric);
  }, [entries]);

  const toggleSort = (metric: string) => {
    if (sortMetric === metric) {
      setSortDirection(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortMetric(metric);
      setSortDirection("desc");
    }
  };

  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + "%";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Box sx={{ bgcolor: "#fbbf24", color: "#78350f", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>1</Box>;
    if (rank === 2) return <Box sx={{ bgcolor: "#d1d5db", color: "#374151", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>2</Box>;
    if (rank === 3) return <Box sx={{ bgcolor: "#fcd6a4", color: "#92400e", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>3</Box>;
    return <Box sx={{ color: "#6b7280", fontWeight: 500, fontSize: 14, width: 28, textAlign: "center" }}>{rank}</Box>;
  };

  const getScoreColor = (score: number, metric: string): string => {
    const config = METRIC_CONFIG[metric];
    const isHigherBetter = config?.higherIsBetter ?? true;
    const effectiveScore = isHigherBetter ? score : (1 - score);
    
    if (effectiveScore >= 0.8) return "#22c55e";
    if (effectiveScore >= 0.6) return "#84cc16";
    if (effectiveScore >= 0.4) return "#eab308";
    if (effectiveScore >= 0.2) return "#f97316";
    return "#ef4444";
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack spacing={2} mb={4}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: "12px", 
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Trophy size={24} color="#78350f" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#111827">
              LLM Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Model rankings based on actual evaluation metrics, not votes
            </Typography>
          </Box>
        </Stack>

        {/* Stats */}
        <Stack direction="row" gap={3}>
          <Box sx={{ px: 2, py: 1, bgcolor: "#f3f4f6", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary">Total Models</Typography>
            <Typography variant="h6" fontWeight={600}>{entries.length}</Typography>
          </Box>
          <Box sx={{ px: 2, py: 1, bgcolor: "#f3f4f6", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary">Metrics Tracked</Typography>
            <Typography variant="h6" fontWeight={600}>{availableMetrics.length}</Typography>
          </Box>
          <Box sx={{ px: 2, py: 1, bgcolor: "#f3f4f6", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary">Total Evaluations</Typography>
            <Typography variant="h6" fontWeight={600}>
              {entries.reduce((sum, e) => sum + e.experimentCount, 0)}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Controls */}
      <Stack direction="row" gap={2} mb={3} alignItems="center">
        <TextField
          placeholder="Search by model name..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#9ca3af" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortMetric}
            label="Sort by"
            onChange={(e) => setSortMetric(e.target.value)}
          >
            <MenuItem value="avgScore">Average Score</MenuItem>
            <MenuItem value="experimentCount">Experiment Count</MenuItem>
            {availableMetrics.map(metric => (
              <MenuItem key={metric} value={metric}>
                {getMetricDisplayName(metric)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton 
          size="small" 
          onClick={() => setSortDirection(d => d === "desc" ? "asc" : "desc")}
          sx={{ border: "1px solid #e5e7eb" }}
        >
          {sortDirection === "desc" ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
        </IconButton>
      </Stack>

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} sx={{ color: "#f59e0b" }} />
        </Box>
      ) : sortedEntries.length === 0 ? (
        /* Empty state */
        <Box sx={{ 
          textAlign: "center", 
          py: 8, 
          px: 4,
          border: "2px dashed #e5e7eb",
          borderRadius: "12px"
        }}>
          <BarChart3 size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No leaderboard data yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run some experiments to see model rankings based on actual metrics.
          </Typography>
        </Box>
      ) : (
        /* Leaderboard table */
        <Box sx={{ 
          border: "1px solid #e5e7eb", 
          borderRadius: "12px", 
          overflow: "hidden",
          bgcolor: "#fff"
        }}>
          {/* Table header */}
          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: `60px 1fr 100px ${visibleMetrics.map(() => "100px").join(" ")} 120px`,
            gap: 2,
            px: 3,
            py: 2,
            bgcolor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            alignItems: "center"
          }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Rank</Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Model</Typography>
            <Box 
              sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
              onClick={() => toggleSort("avgScore")}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">Average</Typography>
              {sortMetric === "avgScore" && (
                sortDirection === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />
              )}
            </Box>
            {visibleMetrics.map(metric => (
              <Tooltip key={metric} title={METRIC_CONFIG[metric]?.description || metric}>
                <Box 
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                  onClick={() => toggleSort(metric)}
                >
                  <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
                    {getMetricDisplayName(metric).split(" ")[0]}
                  </Typography>
                  {sortMetric === metric && (
                    sortDirection === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                  )}
                </Box>
              </Tooltip>
            ))}
            <Typography variant="caption" fontWeight={600} color="text.secondary">Experiments</Typography>
          </Box>

          {/* Table rows */}
          {sortedEntries.map((entry, index) => (
            <Box 
              key={entry.model}
              sx={{ 
                display: "grid", 
                gridTemplateColumns: `60px 1fr 100px ${visibleMetrics.map(() => "100px").join(" ")} 120px`,
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: index < sortedEntries.length - 1 ? "1px solid #f3f4f6" : "none",
                alignItems: "center",
                "&:hover": { bgcolor: "#fafafa" },
                transition: "background-color 0.15s"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                {getRankBadge(entry.rank)}
              </Box>
              
              <Box>
                <Typography variant="body2" fontWeight={600} color="#111827">
                  {entry.model}
                </Typography>
                {entry.provider && (
                  <Typography variant="caption" color="text.secondary">
                    {entry.provider}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: "50%", 
                    bgcolor: getScoreColor(entry.avgScore, "avgScore") 
                  }} 
                />
                <Typography variant="body2" fontWeight={600}>
                  {formatScore(entry.avgScore)}
                </Typography>
              </Box>
              
              {visibleMetrics.map(metric => (
                <Typography 
                  key={metric} 
                  variant="body2"
                  sx={{ 
                    color: entry.metricScores[metric] !== undefined 
                      ? getScoreColor(entry.metricScores[metric], metric)
                      : "#d1d5db"
                  }}
                >
                  {entry.metricScores[metric] !== undefined 
                    ? formatScore(entry.metricScores[metric])
                    : "—"
                  }
                </Typography>
              ))}
              
              <Chip 
                label={`${entry.experimentCount} runs`}
                size="small"
                sx={{ 
                  bgcolor: "#f3f4f6", 
                  color: "#6b7280",
                  fontSize: "12px",
                  height: "24px"
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Info footer */}
      <Stack direction="row" alignItems="center" gap={1} mt={3}>
        <Info size={14} color="#9ca3af" />
        <Typography variant="caption" color="text.secondary">
          Rankings are based on actual evaluation metrics from your experiments, not crowd-sourced votes.
          Scores are normalized—higher is always better in the ranking.
        </Typography>
      </Stack>
    </Box>
  );
}
