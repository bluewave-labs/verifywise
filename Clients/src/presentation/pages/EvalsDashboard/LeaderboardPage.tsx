/**
 * LLM Leaderboard Page
 * 
 * Displays model rankings based on VerifyWise Application Score.
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
  Button,
} from "@mui/material";
import { Search, BarChart3, Trophy, Swords, Info } from "lucide-react";
import LeaderboardTable, { ModelActionInfo } from "../../components/Table/LeaderboardTable";
import { LeaderboardEntry, METRIC_CONFIG, BENCHMARK_CONFIG } from "../../components/Table/LeaderboardTable/leaderboardConfig";
import ModelActionMenu, { ModelInfo } from "../../components/ModelActionMenu";
import leaderboardData from "../../../data/verifywise_leaderboard.json";

// Benchmark display names
const BENCHMARK_NAMES: Record<string, string> = {
  mmlu: "MMLU",
  gpqa: "GPQA",
  gsm8k: "GSM8K",
};

// Suite display names
const SUITE_NAMES: Record<string, string> = {
  instruction_following: "Instruction Following",
  rag_grounded_qa: "RAG Grounded QA",
  coding_tasks: "Coding Tasks",
  agent_workflows: "Agent Workflows",
  safety_policy: "Safety & Policy",
};

// Map leaderboard display names to API model names
const MODEL_NAME_MAP: Record<string, string> = {
  "GPT-5.1": "gpt-5.1",
  "GPT-5.2": "gpt-5.2-chat-latest",
  "GPT-4.1": "gpt-4.1",
  "GPT-4o": "gpt-4o",
  "GPT-4.5": "gpt-4.5-preview",
  "o3-pro": "o3-pro",
  "o3-mini": "o3-mini",
  "o1": "o1",
  "o1-mini": "o1-mini",
  "Claude Sonnet 4": "claude-sonnet-4-20250514",
  "Claude Sonnet 4.5": "claude-sonnet-4-5-20250514",
  "Claude Opus 4": "claude-opus-4-20250514",
  "Claude Opus 4.1": "claude-opus-4-1-20250514",
  "Claude 3.5 Sonnet": "claude-3-5-sonnet-20241022",
  "Claude 3.5 Haiku": "claude-3-5-haiku-20241022",
  "Gemini 2.5 Pro": "gemini-2.5-pro-preview-05-06",
  "Gemini 2.5 Flash": "gemini-2.5-flash-preview-05-20",
  "Gemini 2.0 Flash": "gemini-2.0-flash",
  "Grok-4": "grok-4",
  "Grok-3": "grok-3",
  "Mistral Large": "mistral-large-latest",
  "Codestral": "codestral-latest",
  "DeepSeek-V3": "deepseek-chat",
  "DeepSeek-R1": "deepseek-reasoner",
  "Llama 4 Maverick": "meta-llama/llama-4-maverick-17b-128e-instruct",
  "Llama 4 Scout": "meta-llama/llama-4-scout-17b-16e-instruct",
};

// Map provider display names to internal IDs
const PROVIDER_MAP: Record<string, string> = {
  "OpenAI": "openai",
  "Anthropic": "anthropic",
  "Google": "google",
  "Mistral": "mistral",
  "xAI": "xai",
  "DeepSeek": "openrouter",
  "Meta": "openrouter",
  "HuggingFace": "huggingface",
};

// Helper to convert leaderboard model to API format
function toApiModel(model: ModelInfo): { model: string; provider: string } {
  return {
    model: MODEL_NAME_MAP[model.model] || model.model.toLowerCase().replace(/\s+/g, "-"),
    provider: PROVIDER_MAP[model.provider] || model.provider.toLowerCase(),
  };
}

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
    const apiModel = toApiModel(model);
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#playground?model=${encodeURIComponent(apiModel.model)}&provider=${encodeURIComponent(apiModel.provider)}`);
  };

  // Navigate to arena with selected model
  const handleCompare = (model: ModelInfo) => {
    const apiModel = toApiModel(model);
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#arena`, { 
      state: { prefillModel: apiModel } 
    });
  };

  // Navigate to experiments with selected model
  const handleEvaluate = (model: ModelInfo) => {
    const apiModel = toApiModel(model);
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#experiments`, { 
      state: { prefillModel: apiModel } 
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
      benchmarks: model.benchmarks,
      experimentCount: model.tasks_evaluated,
      lastEvaluated: leaderboardData.generated_at,
    }));

    setEntries(transformedEntries);
    setLoading(false);
  }, []);

  // Display the 3 benchmark columns (MMLU, GPQA, GSM8K)
  const displayMetrics = useMemo(() => {
    return ["mmlu", "gpqa", "gsm8k"];
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
            maxWidth: 800,
            mx: "auto",
            mb: 3,
            lineHeight: 1.7,
          }}
        >
          Rankings based on the <strong>VerifyWise Application Score</strong> — our proprietary evaluation 
          measuring how well LLMs perform on <strong>real-world enterprise tasks</strong>. Unlike traditional 
          academic benchmarks, we test practical capabilities: following complex instructions, grounded Q&A, 
          code generation, agentic workflows, and safety compliance.
        </Typography>

        {/* GitHub link for methodology */}
        <Typography
          component="a"
          href="https://github.com/verifywise/verifywise"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "#13715B",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            mb: 3,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Learn more about our evaluation methodology →
        </Typography>

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
            sx={{ minWidth: 200, bgcolor: "#fff" }}
            startAdornment={<BarChart3 size={14} color="#13715B" style={{ marginRight: 8 }} />}
          >
            <MenuItem value="overall">Application Score</MenuItem>
            {displayMetrics.map((m) => (
              <MenuItem key={m} value={m}>
                {BENCHMARK_NAMES[m] || BENCHMARK_CONFIG[m]?.name || SUITE_NAMES[m] || METRIC_CONFIG[m]?.name || m}
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
          Evaluated on {new Date(leaderboardData.generated_at).toLocaleDateString()} using the VerifyWise Evaluation Pipeline.
          Hover over column headers for details.
        </Typography>
      </Stack>
    </Box>
  );
}
