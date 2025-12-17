import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { TrendingUp, TrendingDown, Minus, X, Pencil, Check, Shield, Sparkles, RotateCcw } from "lucide-react";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../infrastructure/api/evaluationLogsService";

interface ExperimentDetailContentProps {
  experimentId: string;
  projectId: string;
  onBack: () => void;
}

export default function ExperimentDetailContent({ experimentId, projectId, onBack }: ExperimentDetailContentProps) {
  const [loading, setLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EvaluationLog | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [rerunLoading, setRerunLoading] = useState(false);

  // Helper to extract reason from metric data
  // Expected format: {"score": 0.85, "reason": "The answer is accurate..."}
  const parseMetricReason = (reason: string | undefined): string | undefined => {
    if (!reason) return undefined;
    
    // If it's already clean text (doesn't look like JSON), return as-is
    if (!reason.includes('"reason"') && !reason.includes('{')) {
      return reason;
    }
    
    // Try to parse as JSON directly
    try {
      const parsed = JSON.parse(reason.trim());
      if (parsed.reason) return parsed.reason;
    } catch {
      // Not valid JSON, try regex extraction
    }
    
    // Regex to extract reason value (handles escaped quotes)
    const reasonMatch = reason.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (reasonMatch && reasonMatch[1]) {
      return reasonMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
    
    // Return original if nothing worked
    return reason;
  };

  useEffect(() => {
    loadExperimentData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  const loadExperimentData = async () => {
    if (!experimentId) return;

    try {
      setLoading(true);
      const [expData, logsData] = await Promise.all([
        experimentsService.getExperiment(experimentId),
        evaluationLogsService.getLogs({ experiment_id: experimentId, limit: 1000 }),
      ]);

      setExperiment(expData.experiment);
      const loadedLogs = logsData.logs || [];
      setLogs(loadedLogs);
    } catch (err) {
      console.error("Failed to load experiment data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditName = () => {
    setEditedName(experiment?.name || "");
    setIsEditingName(true);
  };

  const handleStartEditDescription = () => {
    setEditedDescription(experiment?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveName = async () => {
    if (!experimentId || !editedName.trim()) return;

    try {
      setSaving(true);
      await experimentsService.updateExperiment(experimentId, {
        name: editedName.trim(),
      });

      setExperiment((prev) => prev ? { ...prev, name: editedName.trim() } : prev);
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update experiment name:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!experimentId) return;

    try {
      setSaving(true);
      await experimentsService.updateExperiment(experimentId, {
        description: editedDescription.trim(),
      });

      setExperiment((prev) => prev ? { ...prev, description: editedDescription.trim() } : prev);
      setIsEditingDescription(false);
    } catch (err) {
      console.error("Failed to update experiment description:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const [rerunSuccess, setRerunSuccess] = useState<string | null>(null);

  const handleRerunExperiment = async () => {
    if (!experiment || !projectId) return;
    if (rerunLoading) return;

    try {
      setRerunLoading(true);
      setRerunSuccess(null);
      const baseConfig = (experiment as unknown as { config?: Record<string, Record<string, unknown>> }).config || {};
      const nextName = `${experiment.name || "Eval"} (rerun ${new Date().toLocaleDateString()})`;

      const payload = {
        project_id: projectId,
        name: nextName,
        description: experiment.description || "",
        config: {
          ...baseConfig,
          project_id: projectId,
        },
      };

      const response = await experimentsService.createExperiment(payload);

      if (response?.experiment?.id) {
        // Don't navigate immediately - show success message and let user go back
        setRerunSuccess(`Rerun started: "${nextName}". View it in the experiments list.`);
        // Auto-clear after 5 seconds
        setTimeout(() => setRerunSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Failed to rerun experiment:", err);
      setRerunSuccess(null);
    } finally {
      setRerunLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!experiment) {
    return (
      <Box p={4}>
        <Typography>Experiment not found</Typography>
      </Box>
    );
  }

  // Lightweight Markdown -> HTML converter for common syntax
  const markdownToHtml = (md: string): string => {
    if (!md) return "";
    let html = md;
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre style="background:#0F172A;color:#E5E7EB;padding:12px;border-radius:6px;overflow:auto;font-size:12px"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
    // Inline code
    html = html.replace(/`([^`]+)`/g, (_m, code) => `<code style="background:#F3F4F6;padding:2px 4px;border-radius:4px;font-family:monospace;font-size:12px">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`);
    // Headings
    html = html.replace(/^######\s?(.*)$/gm, '<h6 style="margin:8px 0 4px;font-size:12px;font-weight:600">$1</h6>');
    html = html.replace(/^#####\s?(.*)$/gm, '<h5 style="margin:8px 0 4px;font-size:12px;font-weight:600">$1</h5>');
    html = html.replace(/^####\s?(.*)$/gm, '<h4 style="margin:10px 0 6px;font-size:12px;font-weight:600">$1</h4>');
    html = html.replace(/^###\s?(.*)$/gm, '<h3 style="margin:12px 0 6px;font-size:12px;font-weight:700">$1</h3>');
    html = html.replace(/^##\s?(.*)$/gm, '<h2 style="margin:14px 0 6px;font-size:13px;font-weight:700">$1</h2>');
    html = html.replace(/^#\s?(.*)$/gm, '<h1 style="margin:16px 0 8px;font-size:14px;font-weight:700">$1</h1>');
    // Bold / Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Unordered and ordered list items
    html = html.replace(/^(?:- |\* )(.*)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>');
    // Wrap consecutive li into ul (basic pass)
    html = html.replace(/(?:<li>.*<\/li>\n?)+/g, (m) => `<ul style="margin:6px 0 6px 18px">${m}</ul>`);
    // Paragraph breaks
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = `<p style="margin:0;line-height:1.6;font-size:12px">${html}</p>`;
    return html;
  };

  return (
    <Box>
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
          ← Back to experiments
        </Typography>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* Row 1: Experiment Name + Rerun button */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover .edit-icon": {
                opacity: 1,
              },
            }}
          >
            {isEditingName ? (
              <>
                <TextField
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEditName();
                  }}
                  variant="outlined"
                  size="small"
                  autoFocus
                  disabled={saving}
                  sx={{
                    minWidth: "400px",
                    "& .MuiOutlinedInput-root": {
                      fontSize: "18px",
                      fontWeight: 600,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSaveName}
                  disabled={saving || !editedName.trim()}
                  sx={{ color: "#13715B" }}
                >
                  <Check size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelEditName}
                  disabled={saving}
                  sx={{ color: "#6B7280" }}
                >
                  <X size={18} />
                </IconButton>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 600, fontSize: "18px" }}>
                  {experiment.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleStartEditName}
                  className="edit-icon"
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "#6B7280",
                    "&:hover": {
                      color: "#13715B",
                      backgroundColor: "rgba(19, 113, 91, 0.1)",
                    },
                  }}
                >
                  <Pencil size={14} />
                </IconButton>
              </>
            )}
          </Box>

          {/* Rerun button */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={handleRerunExperiment}
              disabled={rerunLoading || experiment.status === "running"}
              startIcon={<RotateCcw size={14} />}
              sx={{
                textTransform: "none",
                backgroundColor: "#13715B",
                color: "white",
                "&:hover": { 
                  backgroundColor: "#0F5A47",
                },
                "&:disabled": {
                  backgroundColor: "#D1D5DB",
                  color: "#9CA3AF",
                },
                fontSize: "13px",
                fontWeight: 500,
                minWidth: "100px",
                height: 38,
                pl: 2,
                pr: 2.5,
                borderRadius: "8px",
                "& .MuiButton-startIcon": {
                  marginLeft: 0,
                  marginRight: "8px",
                },
              }}
            >
              {rerunLoading ? "Starting…" : "Rerun"}
            </Button>
            {rerunSuccess && (
              <Chip
                label={rerunSuccess}
                size="small"
                onDelete={() => setRerunSuccess(null)}
                sx={{
                  backgroundColor: "#D1FAE5",
                  color: "#065F46",
                  fontSize: "12px",
                  borderRadius: "6px",
                  "& .MuiChip-deleteIcon": {
                    color: "#065F46",
                    "&:hover": { color: "#047857" },
                  },
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Row 2: Status, Description, Created date */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={experiment.status}
            size="small"
            sx={{
              backgroundColor:
                experiment.status === "completed"
                  ? "#c8e6c9"
                  : experiment.status === "failed"
                  ? "#ffebee"
                  : experiment.status === "running"
                  ? "#fff3e0"
                  : "#e0e0e0",
              color:
                experiment.status === "completed"
                  ? "#388e3c"
                  : experiment.status === "failed"
                  ? "#c62828"
                  : experiment.status === "running"
                  ? "#ef6c00"
                  : "#616161",
              fontWeight: 500,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderRadius: "4px",
              "& .MuiChip-label": {
                padding: "4px 8px",
              },
            }}
          />
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover .edit-icon": {
                opacity: 1,
              },
            }}
          >
            {isEditingDescription ? (
              <>
                <TextField
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveDescription();
                    if (e.key === "Escape") handleCancelEditDescription();
                  }}
                  variant="outlined"
                  size="small"
                  autoFocus
                  disabled={saving}
                  placeholder="Add a description..."
                  sx={{
                    minWidth: "300px",
                    "& .MuiOutlinedInput-root": {
                      fontSize: "13px",
                      color: "text.secondary",
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSaveDescription}
                  disabled={saving}
                  sx={{ color: "#13715B" }}
                >
                  <Check size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelEditDescription}
                  disabled={saving}
                  sx={{ color: "#6B7280" }}
                >
                  <X size={16} />
                </IconButton>
              </>
            ) : (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: "13px",
                    fontStyle: experiment.description ? "normal" : "italic",
                    color: experiment.description ? "text.secondary" : "#9CA3AF",
                  }}
                >
                  {experiment.description || "No description"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleStartEditDescription}
                  className="edit-icon"
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "#6B7280",
                    padding: "2px",
                    "&:hover": {
                      color: "#13715B",
                      backgroundColor: "rgba(19, 113, 91, 0.1)",
                    },
                  }}
                >
                  <Pencil size={12} />
                </IconButton>
              </>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
            •
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
            Created {new Date(experiment.created_at).toLocaleString()}
          </Typography>
        </Stack>
      </Box>

      {/* Overall Stats Header */}
      {logs.length > 0 && (() => {
        // Map display names to camelCase keys for backwards compatibility
        const displayNameToKey: Record<string, string> = {
          "Answer Relevancy": "answerRelevancy",
          "Faithfulness": "faithfulness",
          "Contextual Relevancy": "contextualRelevancy",
          "Contextual Recall": "contextualRecall",
          "Contextual Precision": "contextualPrecision",
          "Bias": "bias",
          "Toxicity": "toxicity",
          "Hallucination": "hallucination",
          "Knowledge Retention": "knowledgeRetention",
          "Conversation Completeness": "conversationCompleteness",
          "Conversation Relevancy": "conversationRelevancy",
          "Role Adherence": "roleAdherence",
          "Task Completion": "taskCompletion",
          "Tool Correctness": "toolCorrectness",
          "Answer Correctness": "answerCorrectness",
          "Coherence": "coherence",
          "Tonality": "tonality",
          "Safety": "safety",
        };

        // Calculate overall averages and per-sample scores for sparklines
        const metricsSum: Record<string, { sum: number; count: number; scores: number[] }> = {};
        logs.forEach((log) => {
          if (log.metadata?.metric_scores) {
            Object.entries(log.metadata.metric_scores).forEach(([rawKey, value]) => {
              // Normalize key: convert display names to camelCase, or keep if already camelCase
              const key = displayNameToKey[rawKey] || rawKey;
              const score = typeof value === "number" ? value : (value as { score?: number })?.score;
              if (typeof score === "number") {
                if (!metricsSum[key]) metricsSum[key] = { sum: 0, count: 0, scores: [] };
                metricsSum[key].sum += score;
                metricsSum[key].count += 1;
                metricsSum[key].scores.push(score);
              }
            });
          }
        });

        // Determine enabled metrics from experiment config and map to display names
        const enabled: Record<string, unknown> =
          (experiment as unknown as { config?: { metrics?: Record<string, unknown> } })?.config?.metrics || {};

        // Metric definitions with categories - expanded to include all possible metrics
        const metricDefinitions: Record<string, { label: string; category: "quality" | "safety" }> = {
          // Standard DeepEval metrics
          answerRelevancy: { label: "Answer Relevancy", category: "quality" },
          faithfulness: { label: "Faithfulness", category: "quality" },
          contextualRelevancy: { label: "Contextual Relevancy", category: "quality" },
          contextualRecall: { label: "Contextual Recall", category: "quality" },
          contextualPrecision: { label: "Contextual Precision", category: "quality" },
          bias: { label: "Bias", category: "safety" },
          toxicity: { label: "Toxicity", category: "safety" },
          hallucination: { label: "Hallucination", category: "safety" },
          // Chatbot-specific metrics
          knowledgeRetention: { label: "Knowledge Retention", category: "quality" },
          conversationCompleteness: { label: "Conversation Completeness", category: "quality" },
          conversationRelevancy: { label: "Conversation Relevancy", category: "quality" },
          roleAdherence: { label: "Role Adherence", category: "quality" },
          // Agent metrics
          taskCompletion: { label: "Task Completion", category: "quality" },
          toolCorrectness: { label: "Tool Correctness", category: "quality" },
          // G-Eval metrics
          answerCorrectness: { label: "Answer Correctness", category: "quality" },
          coherence: { label: "Coherence", category: "quality" },
          tonality: { label: "Tonality", category: "quality" },
          safety: { label: "Safety", category: "safety" },
        };

        // Get score color based on value thresholds
        const getScoreColor = (score: number | undefined) => {
          if (score === undefined) return { bg: "#F3F4F6", text: "#6B7280", icon: "#6B7280" };
          if (score >= 0.7) return { bg: "#D1FAE5", text: "#065F46", icon: "#10B981" };
          if (score >= 0.4) return { bg: "#FEF3C7", text: "#92400E", icon: "#F59E0B" };
          return { bg: "#FEE2E2", text: "#991B1B", icon: "#EF4444" };
        };

        // Get delta indicator (simulated - in real app would compare to previous experiment)
        const getDeltaIndicator = (scores: number[]) => {
          if (scores.length < 2) return null;
          const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
          const secondHalf = scores.slice(Math.floor(scores.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const delta = secondAvg - firstAvg;
          if (Math.abs(delta) < 0.02) return { type: "neutral" as const, value: 0 };
          return { type: delta > 0 ? "up" as const : "down" as const, value: Math.abs(delta * 100) };
        };

        // Simple SVG sparkline component
        const Sparkline = ({ scores, color }: { scores: number[]; color: string }) => {
          if (scores.length < 2) return null;
          const width = 60;
          const height = 20;
          const padding = 2;
          const maxScore = Math.max(...scores);
          const minScore = Math.min(...scores);
          const range = maxScore - minScore || 1;

          const points = scores.map((score, i) => {
            const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((score - minScore) / range) * (height - 2 * padding);
            return `${x},${y}`;
          }).join(" ");

          return (
            <svg width={width} height={height} style={{ marginLeft: "auto" }}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        };

        // Show metrics that are either enabled in config OR have actual data
        const orderedMetrics = Object.keys(metricDefinitions)
          .filter((k) => !!enabled?.[k] || !!metricsSum[k])
          .map((k) => ({ key: k, ...metricDefinitions[k] }));

        // Find custom scorer metrics (those not in metricDefinitions but have data)
        const customScorerMetrics = Object.keys(metricsSum)
          .filter((k) => !metricDefinitions[k] && !displayNameToKey[k])
          .map((k) => ({
            key: k,
            label: k.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
            category: "scorer" as const,
          }));

        if (Object.keys(metricsSum).length === 0 && customScorerMetrics.length === 0) return null;

        // Group metrics by category
        const qualityMetrics = orderedMetrics.filter((m) => m.category === "quality");
        const safetyMetrics = orderedMetrics.filter((m) => m.category === "safety");

        // Get icon for metric type (for background watermark)
        const getMetricIcon = (metricKey: string) => {
          switch (metricKey) {
            // Quality metrics
            case "answerRelevancy": return Sparkles;
            case "faithfulness": return Check;
            case "contextualRelevancy": return Sparkles;
            case "contextualRecall": return Sparkles;
            case "contextualPrecision": return Sparkles;
            case "answerCorrectness": return Sparkles;
            case "coherence": return Sparkles;
            case "tonality": return Sparkles;
            case "knowledgeRetention": return Sparkles;
            case "conversationCompleteness": return Sparkles;
            case "conversationRelevancy": return Sparkles;
            case "roleAdherence": return Sparkles;
            case "taskCompletion": return Check;
            case "toolCorrectness": return Check;
            // Safety metrics
            case "bias": return Shield;
            case "toxicity": return Shield;
            case "safety": return Shield;
            case "hallucination": return Shield;
            // Custom scorers use Sparkles as default
            default: return Sparkles;
          }
        };

        const renderMetricCard = (metric: { key: string; label: string; category: string }) => {
          const entry = metricsSum[metric.label] || metricsSum[`G-Eval (${metric.label})`] || metricsSum[metric.key];
          const avgValue = entry ? entry.sum / Math.max(1, entry.count) : undefined;
          const count = entry ? entry.count : 0;
          const scores = entry?.scores || [];
          const colors = getScoreColor(avgValue);
          const delta = getDeltaIndicator(scores);
          const BackgroundIcon = getMetricIcon(metric.key);

          return (
            <Card
              key={metric.key}
              elevation={0}
              sx={{
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
                border: "1px solid #d0d5dd",
                borderRadius: "4px",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
                  "& .background-icon": {
                    opacity: 0.04,
                    transform: "translateY(-10px)",
                  },
                },
              }}
            >
              {/* Background watermark icon */}
              <Box
                className="background-icon"
                sx={{
                  position: "absolute",
                  bottom: "-32px",
                  right: "-32px",
                  opacity: 0.015,
                  transform: "translateY(0px)",
                  zIndex: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.2s ease, transform 0.3s ease",
                }}
              >
                <BackgroundIcon size={96} color="#374151" />
              </Box>

              <CardContent sx={{ p: 2, position: "relative", zIndex: 1, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: 400, color: "#6B7280" }}>
                    {metric.label}
                  </Typography>
                  {delta && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: "4px",
                        backgroundColor: delta.type === "up" ? "#D1FAE5" : delta.type === "down" ? "#FEE2E2" : "#F3F4F6",
                      }}
                    >
                      {delta.type === "up" ? (
                        <TrendingUp size={10} color="#10B981" />
                      ) : delta.type === "down" ? (
                        <TrendingDown size={10} color="#EF4444" />
                      ) : (
                        <Minus size={10} color="#6B7280" />
                      )}
                      <Typography
                        sx={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: delta.type === "up" ? "#065F46" : delta.type === "down" ? "#991B1B" : "#6B7280",
                        }}
                      >
                        {delta.value.toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: colors.text,
                        lineHeight: 1.2,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                      }}
                    >
                      {avgValue === undefined ? "N/A" : `${(avgValue * 100).toFixed(1)}%`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", mt: 0.5, display: "block" }}>
                      {avgValue === undefined ? "No data yet" : `${count} samples`}
                    </Typography>
                  </Box>
                  {scores.length >= 2 && <Sparkline scores={scores} color={colors.icon} />}
                </Box>
              </CardContent>
            </Card>
          );
        };

        return (
          <Box>
            {/* Quality Metrics Section */}
            {qualityMetrics.length > 0 && (
              <Box sx={{ mb: "16px" }}>
                <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, mb: 2 }}>
                  Quality metrics
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                  {qualityMetrics.map(renderMetricCard)}
                </Box>
              </Box>
            )}

            {/* Safety Metrics Section */}
            {safetyMetrics.length > 0 && (
              <Box sx={{ mb: "16px" }}>
                <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, mb: 2 }}>
                  Safety metrics
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                  {safetyMetrics.map(renderMetricCard)}
                </Box>
              </Box>
            )}

            {/* Custom Scorers Section */}
            {customScorerMetrics.length > 0 && (
              <Box sx={{ mb: "16px" }}>
                <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, mb: 2 }}>
                  Custom scorers
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                  {customScorerMetrics.map(renderMetricCard)}
                </Box>
              </Box>
            )}
          </Box>
        );
      })()}

      {/* Split Panel Layout */}
      <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, mb: 2 }}>
        All samples
      </Typography>
      <Card sx={{ overflow: "hidden", border: "1px solid #d0d5dd", borderRadius: "4px" }} elevation={0}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: selectedLog ? "1fr 1fr" : "1fr",
            maxHeight: "calc(100vh - 360px)",
            minHeight: logs.length > 0 ? "auto" : "200px",
            transition: "grid-template-columns 0.2s ease",
          }}>
            {/* Left: Samples List */}
            <Box sx={{ display: "flex", flexDirection: "column", borderRight: selectedLog ? "1px solid #E5E7EB" : "none", overflow: "hidden" }}>
              <Box sx={{ overflowY: "auto", overflowX: "hidden", maxHeight: "calc(100vh - 360px)" }}>
                <TableContainer>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12px", width: "5%" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12px", width: "45%" }}>Input</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12px", width: "45%" }}>Output</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12px", width: "5%" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Box py={4}>
                          <Typography variant="body2" color="text.secondary">
                            No samples found
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => (
                      <TableRow
                        key={log.id}
                        hover
                        selected={selectedLog?.id === log.id}
                        onClick={() => setSelectedLog(log)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: selectedLog?.id === log.id ? "#F0F9F7" : "inherit",
                          "&:hover": {
                            backgroundColor: selectedLog?.id === log.id ? "#F0F9F7" : "#F9FAFB",
                          },
                        }}
                      >
                        <TableCell sx={{ fontSize: "12px", color: "#6B7280" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {log.input_text || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "12px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {log.output_text || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status || "success"}
                            size="small"
                            sx={{
                              backgroundColor: log.status === "success" || !log.status ? "#c8e6c9" : "#ffebee",
                              color: log.status === "success" || !log.status ? "#388e3c" : "#c62828",
                              fontWeight: 500,
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              borderRadius: "4px",
                              "& .MuiChip-label": {
                                padding: "4px 8px",
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
              </Box>
            </Box>

            {/* Right: Expanded View */}
            {selectedLog && (
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                maxHeight: "calc(100vh - 360px)",
                animation: "slideInRight 0.3s ease-out",
                "@keyframes slideInRight": {
                  from: {
                    opacity: 0,
                    transform: "translateX(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateX(0)",
                  },
                },
              }}>
                {/* Header with title and close button */}
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1.5,
                  pl: 3,
                  borderBottom: "1px solid #E5E7EB",
                  backgroundColor: "#F9FAFB",
                  flexShrink: 0
                }}>
                  <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600 }}>
                    Evaluation metrics
                  </Typography>
                  <Box
                    component="button"
                    onClick={() => setSelectedLog(null)}
                    sx={{
                      background: "none",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#667085",
                      transition: "color 0.2s",
                      "&:hover": {
                        color: "#101828",
                      },
                    }}
                  >
                    <X size={18} />
                  </Box>
                </Box>

                {/* Scrollable content */}
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 3 }}>
                {/* Metric Scores */}
                {selectedLog.metadata?.metric_scores && Object.keys(selectedLog.metadata.metric_scores).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Stack spacing={1.5}>
                       {Object.entries(selectedLog.metadata.metric_scores).map(([metricName, metricData]) => {
                        const score = typeof metricData === "number" ? metricData : (metricData as { score?: number })?.score;
                        const passed = typeof metricData === "object" && metricData !== null && (metricData as { passed?: boolean })?.passed !== undefined ? (metricData as { passed: boolean }).passed : typeof score === "number" && score >= 0.5;
                        const rawReason = typeof metricData === "object" && metricData !== null ? (metricData as { reason?: string }).reason : undefined;
                        const reason = parseMetricReason(rawReason);
                        const friendlyMetric = metricName.replace(/^G-Eval\\s*\\((.*)\\)$/i, "$1");

                         return (
                           <Box key={metricName} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                               <Typography variant="body2" sx={{ fontSize: "12px", textTransform: "capitalize" }}>
                                 {friendlyMetric.replace(/([A-Z])/g, " $1").trim()}
                               </Typography>
                               <Chip
                                 label={typeof score === "number" ? `${(score * 100).toFixed(0)}%` : "N/A"}
                                 size="small"
                                 sx={{
                                   backgroundColor: passed ? "#c8e6c9" : "#ffebee",
                                   color: passed ? "#388e3c" : "#c62828",
                                   fontWeight: 500,
                                   fontSize: "11px",
                                   letterSpacing: "0.5px",
                                   borderRadius: "4px",
                                   "& .MuiChip-label": {
                                     padding: "4px 8px",
                                   },
                                 }}
                               />
                             </Box>
                             {reason && (
                               <Typography variant="body2" sx={{ fontSize: "12px", color: "#6B7280" }}>
                                 {reason}
                               </Typography>
                             )}
                           </Box>
                         );
                      })}
                    </Stack>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Conversational Display (for multi-turn) */}
                {selectedLog.metadata?.is_conversational && selectedLog.metadata?.turns ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 1.5 }}>
                      Conversation ({selectedLog.metadata.turn_count || selectedLog.metadata.turns.length} turns)
                    </Typography>
                    {selectedLog.metadata.scenario && (
                      <Typography variant="body2" sx={{ fontSize: "12px", color: "#6B7280", mb: 2 }}>
                        Scenario: {selectedLog.metadata.scenario}
                      </Typography>
                    )}
                    <Box sx={{ 
                      backgroundColor: "#FAF5FF", 
                      border: "1px solid #DDD6FE", 
                      borderRadius: "12px", 
                      p: 2,
                    }}>
                      <Stack spacing={2}>
                        {(selectedLog.metadata.turns as Array<{role: string; content: string}>).map((turn, idx) => {
                          const isUser = turn.role?.toLowerCase() === "user";
                          return (
                            <Box
                              key={idx}
                              sx={{
                                display: "flex",
                                justifyContent: isUser ? "flex-end" : "flex-start",
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: "85%",
                                  p: 1.5,
                                  borderRadius: "12px",
                                  backgroundColor: isUser ? "#ECFDF5" : "#EBF5FF",
                                  border: isUser ? "1px solid #A7F3D0" : "1px solid #BFDBFE",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: isUser ? "#059669" : "#1E40AF",
                                    display: "block",
                                    mb: 0.5,
                                    fontSize: "10px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {isUser ? "User" : "Assistant"}
                                </Typography>
                                <Box
                                  sx={{ fontSize: "12px", color: "#374151" }}
                                  dangerouslySetInnerHTML={{ __html: markdownToHtml(turn.content || "") }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                    {selectedLog.metadata.expected_outcome && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6B7280" }}>
                          Expected Outcome:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", color: "#374151", mt: 0.5 }}>
                          {selectedLog.metadata.expected_outcome}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <>
                    {/* Input (single-turn) */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 1.5 }}>
                        Input
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#F9FAFB" }}>
                        <Box
                          sx={{ fontSize: "12px" }}
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedLog.input_text || "No input") }}
                        />
                      </Paper>
                    </Box>

                    {/* Output (single-turn) */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 1.5 }}>
                        Output
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#F9FAFB" }}>
                        <Box
                          sx={{ fontSize: "12px" }}
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedLog.output_text || "No output") }}
                        />
                      </Paper>
                    </Box>
                  </>
                )}

                {/* Metadata - Always show */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 1.5 }}>
                    Metadata
                  </Typography>
                  <Stack spacing={1}>
                    {selectedLog.latency_ms && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          Latency
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {selectedLog.latency_ms}ms
                        </Typography>
                      </Box>
                    )}
                    {selectedLog.token_count && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          Token count
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {selectedLog.token_count}
                        </Typography>
                      </Box>
                    )}
                    {selectedLog.model_name && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          Model
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {selectedLog.model_name}
                        </Typography>
                      </Box>
                    )}
                    {selectedLog.metadata?.turn_count && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          Turns
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {selectedLog.metadata.turn_count}
                        </Typography>
                      </Box>
                    )}
                    {selectedLog.timestamp && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          Timestamp
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {new Date(selectedLog.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Error message if failed */}
                {selectedLog.error_message && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 1, color: "#991B1B" }}>
                      Error
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#FEE2E2", borderColor: "#991B1B" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "12px",
                          color: "#991B1B",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedLog.error_message}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Sample ID at bottom */}
                <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #E5E7EB" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", fontFamily: "monospace", display: "block" }}>
                    Sample ID: {selectedLog.id}
                  </Typography>
                </Box>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
