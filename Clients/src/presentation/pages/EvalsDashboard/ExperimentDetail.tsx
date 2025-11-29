import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { TrendingUp, X, Home, FlaskConical, Pencil, Check, List, Zap, Target, MessageSquare, Lightbulb, Shield } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../infrastructure/api/evaluationLogsService";
import MetricCard from "../../components/Cards/MetricCard";

export default function ExperimentDetail() {
  const { projectId, experimentId } = useParams<{ projectId: string; experimentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EvaluationLog | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);

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

      // Don't auto-select - let user choose
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
        <Typography>Eval not found</Typography>
      </Box>
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
    { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
    { label: "Experiments", icon: <List size={14} strokeWidth={1.5} />, onClick: () => navigate(`/evals/${projectId}#experiments`) },
    { label: experiment.name || "Eval", icon: <Zap size={14} strokeWidth={1.5} /> },
  ];

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
      <Box>
        <PageBreadcrumbs items={breadcrumbItems} />
      </Box>
      
      {/* Header */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {/* Experiment Name with inline editing */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
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

        {/* Experiment Description with inline editing */}
        <Box
          sx={{
            display: "block",
            mb: 2,
          }}
        >
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
                  minWidth: "400px",
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
                <Check size={18} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCancelEditDescription}
                disabled={saving}
                sx={{ color: "#6B7280" }}
              >
                <X size={18} />
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
        </Box>

        {/* Status and metadata */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
            Created {new Date(experiment.created_at).toLocaleString()}
          </Typography>
        </Stack>
      </Box>

      {/* Overall Stats Header */}
      {logs.length > 0 && (() => {
        // Calculate overall averages found in logs
        const metricsSum: Record<string, { sum: number; count: number }> = {};
        logs.forEach((log) => {
          if (log.metadata?.metric_scores) {
            Object.entries(log.metadata.metric_scores).forEach(([key, value]) => {
              const score = typeof value === "number" ? value : (value as { score?: number })?.score;
              if (typeof score === "number") {
                if (!metricsSum[key]) metricsSum[key] = { sum: 0, count: 0 };
                metricsSum[key].sum += score;
                metricsSum[key].count += 1;
              }
            });
          }
        });

        // Map to display names - add common metric variations
        const displayMap: Record<string, string> = {
          answerCorrectness: "Answer correctness",
          coherence: "Coherence",
          tonality: "Tonality",
          safety: "Safety",
          bias: "Bias",
          toxicity: "Toxicity",
          Bias: "Bias",
          Toxicity: "Toxicity",
          "Contextual Relevancy": "Contextual Relevancy",
          "Answer Relevancy": "Answer Relevancy",
          "Faithfulness": "Faithfulness",
          "Hallucination": "Hallucination",
          "Knowledge Retention": "Knowledge Retention",
          "contextual_relevancy": "Contextual Relevancy",
          "answer_relevancy": "Answer Relevancy",
          "faithfulness": "Faithfulness",
          "hallucination": "Hallucination",
          "knowledge_retention": "Knowledge Retention",
          "G-Eval (Coherence)": "Coherence",
          "G-Eval (Fluency)": "Fluency",
          "G-Eval (Consistency)": "Consistency",
          "G-Eval (Relevance)": "Relevance",
          "G-Eval (Correctness)": "Correctness",
        };

        // Always show all metrics found in the data
        if (Object.keys(metricsSum).length === 0) return null;

        // Map metric keys to appropriate icons
        const metricIcons: Record<string, React.ComponentType<any>> = {
          answerCorrectness: Target,
          coherence: MessageSquare,
          tonality: Lightbulb,
          safety: Shield,
          bias: Shield,
          toxicity: Shield,
          Bias: Shield,
          Toxicity: Shield,
          "Contextual Relevancy": Target,
          "Answer Relevancy": Target,
          "Faithfulness": Shield,
          "Hallucination": Shield,
          "Knowledge Retention": Lightbulb,
          "contextual_relevancy": Target,
          "knowledge_retention": Lightbulb,
          "answer_relevancy": Target,
          "faithfulness": Shield,
          "hallucination": Shield,
          "G-Eval (Coherence)": MessageSquare,
          "G-Eval (Fluency)": Lightbulb,
          "G-Eval (Consistency)": Target,
          "G-Eval (Relevance)": Target,
          "G-Eval (Correctness)": Target,
        };

        // Map metric keys to their explanations
        const metricExplanations: Record<string, string> = {
          answerCorrectness: "Measures how factually accurate and correct the AI's response is compared to the expected answer. Higher scores indicate the model provides accurate information without hallucinations or errors.",
          coherence: "Evaluates how logically structured and well-organized the response is. Higher scores mean the response flows naturally, maintains consistency, and stays on topic throughout.",
          tonality: "Assesses whether the AI's tone and style match the desired communication style. This includes checking for appropriate formality, empathy, and alignment with brand voice.",
          safety: "Detects harmful, toxic, biased, or inappropriate content in the AI's responses. Higher scores indicate the model avoids generating unsafe or problematic outputs.",
          bias: "Measures unfair prejudice or discrimination in AI responses based on protected characteristics like race, gender, age, or religion. Lower bias scores indicate more equitable treatment across different groups.",
          toxicity: "Detects offensive, insulting, threatening, or profane language in AI responses. Lower toxicity scores indicate more respectful and professional communication.",
          Bias: "Measures unfair prejudice or discrimination in AI responses based on protected characteristics like race, gender, age, or religion. Lower bias scores indicate more equitable treatment across different groups.",
          Toxicity: "Detects offensive, insulting, threatening, or profane language in AI responses. Lower toxicity scores indicate more respectful and professional communication.",
          "Contextual Relevancy": "Evaluates whether the retrieved context or information is relevant to answering the user's question. Higher scores indicate better retrieval quality and more pertinent supporting information.",
          "Answer Relevancy": "Measures how well the AI's answer directly addresses the user's question without including irrelevant information. Higher scores mean the response stays focused and on-topic.",
          "Faithfulness": "Assesses whether the AI's response is grounded in and faithful to the provided context or source material. Higher scores indicate the model doesn't fabricate information beyond what's given.",
          "Hallucination": "Detects when the AI generates information that contradicts or isn't supported by the provided context. Lower hallucination scores indicate more trustworthy, fact-based responses.",
          "Knowledge Retention": "Measures the AI's ability to accurately remember and recall information from previous conversations or provided context. Higher scores indicate better long-term information retention and consistency across interactions.",
          "Role Adherence": "Evaluates how well the AI stays within its designated role, persona, or system instructions. Higher scores indicate the model consistently follows its intended behavior and doesn't deviate from assigned responsibilities.",
          "Conversation Relevancy": "Assesses whether the AI's responses stay relevant to the ongoing conversation topic and context. Higher scores mean the model maintains focus on the discussion without introducing unrelated information.",
          "Conversation Completeness": "Measures how thoroughly the AI addresses all aspects of the user's query or conversation thread. Higher scores indicate the model provides comprehensive answers without leaving important points unaddressed.",
          "contextual_relevancy": "Evaluates whether the retrieved context or information is relevant to answering the user's question. Higher scores indicate better retrieval quality and more pertinent supporting information.",
          "knowledge_retention": "Measures the AI's ability to accurately remember and recall information from previous conversations or provided context. Higher scores indicate better long-term information retention and consistency across interactions.",
          "role_adherence": "Evaluates how well the AI stays within its designated role, persona, or system instructions. Higher scores indicate the model consistently follows its intended behavior and doesn't deviate from assigned responsibilities.",
          "conversation_relevancy": "Assesses whether the AI's responses stay relevant to the ongoing conversation topic and context. Higher scores mean the model maintains focus on the discussion without introducing unrelated information.",
          "conversation_completeness": "Measures how thoroughly the AI addresses all aspects of the user's query or conversation thread. Higher scores indicate the model provides comprehensive answers without leaving important points unaddressed.",
          "answer_relevancy": "Measures how well the AI's answer directly addresses the user's question without including irrelevant information. Higher scores mean the response stays focused and on-topic.",
          "faithfulness": "Assesses whether the AI's response is grounded in and faithful to the provided context or source material. Higher scores indicate the model doesn't fabricate information beyond what's given.",
          "hallucination": "Detects when the AI generates information that contradicts or isn't supported by the provided context. Lower hallucination scores indicate more trustworthy, fact-based responses.",
          "G-Eval (Coherence)": "Evaluates how logically structured and well-organized the response is using G-Eval framework. Higher scores mean the response flows naturally, maintains consistency, and stays on topic throughout.",
          "G-Eval (Fluency)": "Assesses how natural and smooth the language flows in the AI's response. Higher scores indicate more human-like, grammatically correct, and easy-to-read text.",
          "G-Eval (Consistency)": "Measures whether the response maintains logical consistency throughout, without contradicting itself or previous statements. Higher scores indicate better internal coherence.",
          "G-Eval (Relevance)": "Evaluates how well the response addresses the user's question or prompt. Higher scores mean the response stays on-topic and provides pertinent information.",
          "G-Eval (Correctness)": "Assesses the factual accuracy and correctness of the information provided in the response. Higher scores indicate more accurate and reliable answers.",
        };

        // Map metric keys to their evaluation direction (lower-is-better vs higher-is-better)
        const metricTypeMap: Record<string, "lower-is-better" | "higher-is-better" | "neutral"> = {
          // Lower is better (negative metrics)
          bias: "lower-is-better",
          toxicity: "lower-is-better",
          Bias: "lower-is-better",
          Toxicity: "lower-is-better",
          "Hallucination": "lower-is-better",
          "hallucination": "lower-is-better",

          // Higher is better (positive metrics)
          answerCorrectness: "higher-is-better",
          coherence: "higher-is-better",
          tonality: "higher-is-better",
          safety: "higher-is-better",
          "Contextual Relevancy": "higher-is-better",
          "Answer Relevancy": "higher-is-better",
          "Faithfulness": "higher-is-better",
          "Knowledge Retention": "higher-is-better",
          "Role Adherence": "higher-is-better",
          "Conversation Relevancy": "higher-is-better",
          "Conversation Completeness": "higher-is-better",
          "contextual_relevancy": "higher-is-better",
          "answer_relevancy": "higher-is-better",
          "faithfulness": "higher-is-better",
          "knowledge_retention": "higher-is-better",
          "role_adherence": "higher-is-better",
          "conversation_relevancy": "higher-is-better",
          "conversation_completeness": "higher-is-better",
          "G-Eval (Coherence)": "higher-is-better",
          "G-Eval (Fluency)": "higher-is-better",
          "G-Eval (Consistency)": "higher-is-better",
          "G-Eval (Relevance)": "higher-is-better",
          "G-Eval (Correctness)": "higher-is-better",
        };

        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: "14px" }}>
              Overall statistics
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
              {Object.keys(metricsSum).map((metricKey) => {
                const entry = metricsSum[metricKey];
                const avgValue = entry ? entry.sum / Math.max(1, entry.count) : undefined;
                const count = entry ? entry.count : 0;
                const friendlyLabel = displayMap[metricKey] || metricKey;
                const percentageValue = avgValue === undefined ? "N/A" : `${(avgValue * 100).toFixed(1)}%`;
                const subtitleText = avgValue === undefined ? "No data yet" : `Average across ${count} samples`;
                const BackgroundIcon = metricIcons[metricKey] || TrendingUp;
                const explanation = metricExplanations[metricKey] || `Evaluation metric: ${friendlyLabel}`;
                const metricType = metricTypeMap[metricKey] || "neutral";

                return (
                  <Box key={metricKey} sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                    <MetricCard
                      title={friendlyLabel}
                      value={percentageValue}
                      subtitle={subtitleText}
                      tooltipText={explanation}
                      navigable={false}
                      compact={true}
                      backgroundIcon={BackgroundIcon}
                      metricType={metricType}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })()}

      {/* Split Panel Layout (Braintrust style) */}
      <Card sx={{ overflow: "hidden" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: selectedLog ? "1fr 1fr" : "1fr", 
            height: "calc(100vh - 260px)",
            minHeight: "520px",
            transition: "grid-template-columns 0.2s ease",
          }}>
            {/* Left: Samples List */}
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%", borderRight: selectedLog ? "1px solid #E5E7EB" : "none", overflow: "hidden" }}>
              <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, pl: 2, pr: 2, pt: 2, pb: 1 }}>
                All samples
              </Typography>

              <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                <TableContainer sx={{ maxHeight: "100%" }}>
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
                height: "100%",
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
                    Evaluation Metrics
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
                {/* Metric Scores (Judge's Opinion) */}
                {selectedLog.metadata?.metric_scores && Object.keys(selectedLog.metadata.metric_scores).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Stack spacing={1.5}>
                       {Object.entries(selectedLog.metadata.metric_scores).map(([metricName, metricData]) => {
                        const score = typeof metricData === "number" ? metricData : (metricData as { score?: number })?.score;
                        const passed = typeof metricData === "object" && metricData !== null && (metricData as { passed?: boolean })?.passed !== undefined ? (metricData as { passed: boolean }).passed : typeof score === "number" && score >= 0.5;
                        const reason = typeof metricData === "object" && metricData !== null ? (metricData as { reason?: string }).reason : undefined;
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

                {/* Input */}
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

                {/* Output */}
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

                {/* Additional Metadata */}
                {(selectedLog.latency_ms || selectedLog.token_count) && (
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
                            Token Count
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
                )}

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
