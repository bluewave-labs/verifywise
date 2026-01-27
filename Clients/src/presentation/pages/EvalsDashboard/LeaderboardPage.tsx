/**
 * LLM Leaderboard Page
 * 
 * Displays model rankings based on VerifyWise Practical Evaluation results.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Button,
} from "@mui/material";
import { Search, Info, BarChart3, Trophy, Zap, Shield, Swords } from "lucide-react";
import LeaderboardTable, { ModelActionInfo } from "../../components/Table/LeaderboardTable";
import { LeaderboardEntry, METRIC_CONFIG } from "../../components/Table/LeaderboardTable/leaderboardConfig";
import ModelActionMenu, { ModelInfo } from "../../components/ModelActionMenu";
import leaderboardData from "../../../data/verifywise_leaderboard.json";

// Suite display names
const SUITE_NAMES: Record<string, string> = {
  instruction_following: "Instruction Following",
  rag_grounded_qa: "RAG Grounded QA",
  coding_tasks: "Coding Tasks",
  agent_workflows: "Agent Workflows",
  safety_policy: "Safety & Policy",
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("overall");
  
  // Model action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);

  // Handle model row click
  const handleModelAction = (info: ModelActionInfo) => {
    setSelectedModel({ model: info.model, provider: info.provider });
    setActionMenuAnchor(info.anchorEl);
  };

  // Close action menu
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedModel(null);
  };

  // Navigate to playground with selected model
  const handleChat = (model: ModelInfo) => {
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#playground?model=${encodeURIComponent(model.model)}&provider=${encodeURIComponent(model.provider)}`);
  };

  // Navigate to arena with selected model
  const handleCompare = (model: ModelInfo) => {
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#arena`, { 
      state: { prefillModel: model } 
    });
  };

  // Navigate to experiments with selected model
  const handleEvaluate = (model: ModelInfo) => {
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#experiments`, { 
      state: { prefillModel: model } 
    });
  };

  // Load leaderboard data from static JSON
  useEffect(() => {
    setLoading(true);

    // Transform JSON data to LeaderboardEntry format
    const transformedEntries: LeaderboardEntry[] = leaderboardData.models.map((model) => ({
      rank: model.rank,
      model: model.model,
      provider: model.provider,
      score: model.verifywise_score,
      metricScores: {
        instruction_following: model.suites.instruction_following,
        rag_grounded_qa: model.suites.rag_grounded_qa,
        coding_tasks: model.suites.coding_tasks,
        agent_workflows: model.suites.agent_workflows,
        safety_policy: model.suites.safety_policy,
      },
      experimentCount: model.tasks_evaluated,
      lastEvaluated: leaderboardData.generated_at,
    }));

    setEntries(transformedEntries);
    setLoading(false);
  }, []);

  // Display metrics (the 5 suites)
  const displayMetrics = useMemo(() => {
    return [
      "instruction_following",
      "rag_grounded_qa",
      "coding_tasks",
      "agent_workflows",
      "safety_policy",
    ];
  }, []);

  // Stats
  const totalTasks = entries.length > 0 ? entries[0].experimentCount : 44;
  const topModel = entries[0];

  return (
    <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
      {/* Hero Section - Centered */}
      <Box
        sx={{
          textAlign: "center",
          mb: 5,
          pt: 2,
        }}
      >
        {/* Favicon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <img src="/favicon64x64.svg" alt="VerifyWise" style={{ width: 64, height: 64 }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          fontWeight={700}
          color="#111827"
          sx={{ mb: 1.5 }}
        >
          VerifyWise LLM Leaderboard
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 700,
            mx: "auto",
            mb: 3,
            lineHeight: 1.7,
          }}
        >
          Practical evaluation of Large Language Models across <strong>real-world tasks</strong>.
          Models are tested on instruction following, RAG grounded QA, coding challenges,
          agentic workflows, and safety & policy compliance.
        </Typography>

        {/* Suite chips */}
        <Stack direction="row" justifyContent="center" gap={1} mb={3} flexWrap="wrap">
          <Chip
            icon={<Zap size={14} />}
            label="Instruction Following"
            size="small"
            sx={{ bgcolor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
          />
          <Chip
            icon={<Search size={14} />}
            label="RAG QA"
            size="small"
            sx={{ bgcolor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}
          />
          <Chip
            label="Coding"
            size="small"
            sx={{ bgcolor: "#faf5ff", color: "#6b21a8", border: "1px solid #e9d5ff" }}
          />
          <Chip
            label="Agentic"
            size="small"
            sx={{ bgcolor: "#fefce8", color: "#854d0e", border: "1px solid #fef08a" }}
          />
          <Chip
            icon={<Shield size={14} />}
            label="Safety"
            size="small"
            sx={{ bgcolor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
          />
        </Stack>

        {/* Stats Row - Compact */}
        <Stack
          direction="row"
          justifyContent="center"
          divider={<Box sx={{ width: "1px", bgcolor: "#e5e7eb", mx: 2 }} />}
          sx={{ display: "inline-flex" }}
        >
          <Box sx={{ textAlign: "center", px: 1 }}>
            <Typography component="span" fontWeight={700} color="#111827" sx={{ fontFamily: "monospace", fontSize: 15 }}>
              {entries.length}
            </Typography>
            <Typography component="span" color="text.secondary" sx={{ fontSize: 12, ml: 0.5 }}>
              models
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", px: 1 }}>
            <Typography component="span" fontWeight={700} color="#111827" sx={{ fontFamily: "monospace", fontSize: 15 }}>
              {totalTasks}
            </Typography>
            <Typography component="span" color="text.secondary" sx={{ fontSize: 12, ml: 0.5 }}>
              tasks
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", px: 1 }}>
            <Typography component="span" fontWeight={700} color="#111827" sx={{ fontFamily: "monospace", fontSize: 15 }}>
              5
            </Typography>
            <Typography component="span" color="text.secondary" sx={{ fontSize: 12, ml: 0.5 }}>
              suites
            </Typography>
          </Box>
          {topModel && (
            <Box sx={{ textAlign: "center", px: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <Trophy size={14} color="#eab308" />
              <Typography component="span" fontWeight={600} color="#111827" sx={{ fontSize: 13 }}>
                {topModel.model}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Arena CTA */}
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<Swords size={18} />}
            onClick={() => navigate(projectId ? `/evals/${projectId}#arena` : `/evals#arena`)}
            sx={{
              bgcolor: "#13715B",
              "&:hover": { bgcolor: "#0f5c4a" },
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              px: 4,
              py: 1.5,
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(19, 113, 91, 0.25)",
            }}
          >
            Compare Models in Arena
          </Button>
        </Box>
      </Box>

      {/* Controls */}
      <Stack direction="row" gap={2} mb={3} alignItems="center">
        <FormControl size="small">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ minWidth: 180, bgcolor: "#fff" }}
            startAdornment={<BarChart3 size={14} color="#13715B" style={{ marginRight: 8 }} />}
          >
            <MenuItem value="overall">Overall Score</MenuItem>
            {displayMetrics.map((m) => (
              <MenuItem key={m} value={m}>
                {SUITE_NAMES[m] || METRIC_CONFIG[m]?.name || m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          placeholder="Search models..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 280, bgcolor: "#fff" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9ca3af" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* Table */}
      <LeaderboardTable
        entries={entries}
        loading={loading}
        searchQuery={searchQuery}
        displayMetrics={displayMetrics}
        onModelAction={handleModelAction}
      />

      {/* Model Action Menu */}
      {selectedModel && (
        <ModelActionMenu
          model={selectedModel}
          anchorEl={actionMenuAnchor}
          onClose={handleCloseActionMenu}
          onChat={handleChat}
          onCompare={handleCompare}
          onEvaluate={handleEvaluate}
        />
      )}

      {/* Footer */}
      <Stack direction="row" alignItems="center" gap={1} mt={3}>
        <Info size={14} color="#9ca3af" />
        <Typography variant="caption" color="text.secondary">
          Evaluated on {new Date(leaderboardData.generated_at).toLocaleDateString()} using the VerifyWise Practical Evaluation Pipeline.
          Score = weighted average of 5 suites (IF: 25%, RAG: 25%, Coding: 20%, Agent: 15%, Safety: 15%).
        </Typography>
      </Stack>
    </Box>
  );
}
