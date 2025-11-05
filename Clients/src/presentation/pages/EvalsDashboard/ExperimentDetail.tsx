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
} from "@mui/material";
import { TrendingUp, X } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../infrastructure/api/evaluationLogsService";

export default function ExperimentDetail() {
  const { projectId, experimentId } = useParams<{ projectId: string; experimentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EvaluationLog | null>(null);

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
    { label: "LLM Evals Dashboard", onClick: () => navigate("/evals") },
    { label: "Evals", onClick: () => navigate(`/evals/${projectId}#experiments`) },
    { label: experiment.name || "Eval" },
  ];

  // Lightweight Markdown -> HTML converter for common syntax
  const markdownToHtml = (md: string): string => {
    if (!md) return "";
    let html = md;
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre style="background:#0F172A;color:#E5E7EB;padding:12px;border-radius:6px;overflow:auto"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
    // Inline code
    html = html.replace(/`([^`]+)`/g, (_m, code) => `<code style="background:#F3F4F6;padding:2px 4px;border-radius:4px;font-family:monospace">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`);
    // Headings
    html = html.replace(/^######\s?(.*)$/gm, '<h6 style="margin:8px 0 4px;font-size:12px;font-weight:600">$1</h6>');
    html = html.replace(/^#####\s?(.*)$/gm, '<h5 style="margin:8px 0 4px;font-size:13px;font-weight:600">$1</h5>');
    html = html.replace(/^####\s?(.*)$/gm, '<h4 style="margin:10px 0 6px;font-size:14px;font-weight:600">$1</h4>');
    html = html.replace(/^###\s?(.*)$/gm, '<h3 style="margin:12px 0 6px;font-size:15px;font-weight:700">$1</h3>');
    html = html.replace(/^##\s?(.*)$/gm, '<h2 style="margin:14px 0 6px;font-size:16px;font-weight:700">$1</h2>');
    html = html.replace(/^#\s?(.*)$/gm, '<h1 style="margin:16px 0 8px;font-size:18px;font-weight:700">$1</h1>');
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
    html = `<p style="margin:0;line-height:1.6;font-size:13px">${html}</p>`;
    return html;
  };

  return (
    <Box>
      <PageBreadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: "18px", mb: 1 }}>
          {experiment.name}
        </Typography>
        {experiment.description && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px", mb: 2 }}>
            {experiment.description}
          </Typography>
        )}

        {/* Status and metadata */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={experiment.status}
            size="small"
            color={
              experiment.status === "completed" ? "success" :
              experiment.status === "failed" ? "error" :
              experiment.status === "running" ? "warning" :
              "default"
            }
            sx={{ textTransform: "capitalize" }}
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

        // Determine enabled metrics from experiment config and map to display names
        const enabled: Record<string, unknown> = (experiment as unknown as { config?: { metrics?: Record<string, unknown> } })?.config?.metrics || {};
        const displayMap: Record<string, string> = {
          answerRelevancy: "Answer Relevancy",
          bias: "Bias",
          toxicity: "Toxicity",
          faithfulness: "Faithfulness",
          hallucination: "Hallucination",
          contextualRelevancy: "Contextual Relevancy",
        };
        const orderedLabels = Object.keys(displayMap)
          .filter((k) => !!enabled?.[k])
          .map((k) => displayMap[k]);

        if (orderedLabels.length === 0 && Object.keys(metricsSum).length === 0) return null;

        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: "14px" }}>
              Overall Statistics
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
              {(orderedLabels.length ? orderedLabels : Object.keys(metricsSum)).map((label) => {
                const entry = metricsSum[label];
                const avgValue = entry ? entry.sum / Math.max(1, entry.count) : undefined;
                const count = entry ? entry.count : 0;
                return (
                  <Card key={label} variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <TrendingUp size={14} color="#13715B" />
                        <Typography variant="body2" sx={{ fontSize: "11px", fontWeight: 600, color: "#6B7280" }}>
                          {label}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 700 }}>
                        {avgValue === undefined ? "N/A" : `${(avgValue * 100).toFixed(1)}%`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px" }}>
                        {avgValue === undefined ? "No data yet" : `Average across ${count} samples`}
                      </Typography>
                    </CardContent>
                  </Card>
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
              <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600, p: 2, pb: 1 }}>
                All Samples
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
                        <TableCell sx={{ fontSize: "13px" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "13px",
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
                        <TableCell sx={{ fontSize: "13px" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "13px",
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
                            color={log.status === "success" ? "success" : "error"}
                            sx={{ fontSize: "11px", height: 20 }}
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
              <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                {/* Close button header */}
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "flex-end", 
                  p: 1, 
                  borderBottom: "1px solid #E5E7EB",
                  backgroundColor: "#F9FAFB",
                  flexShrink: 0
                }}>
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
                  {/* Sample ID and Timestamp */}
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px", fontFamily: "monospace" }}>
                    {selectedLog.id}
                  </Typography>
                
                {/* Metric Scores (Judge's Opinion) */}
                {selectedLog.metadata?.metric_scores && Object.keys(selectedLog.metadata.metric_scores).length > 0 && (
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: 600, mb: 2 }}>
                      % Scores
                    </Typography>
                    <Stack spacing={1.5}>
                       {Object.entries(selectedLog.metadata.metric_scores).map(([metricName, metricData]) => {
                        const score = typeof metricData === "number" ? metricData : (metricData as { score?: number })?.score;
                        const passed = typeof metricData === "object" && metricData !== null && (metricData as { passed?: boolean })?.passed !== undefined ? (metricData as { passed: boolean }).passed : typeof score === "number" && score >= 0.5;
                        const reason = typeof metricData === "object" && metricData !== null ? (metricData as { reason?: string }).reason : undefined;
                        
                         return (
                           <Box key={metricName} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                               <Typography variant="body2" sx={{ fontSize: "13px", textTransform: "capitalize" }}>
                                 {metricName.replace(/([A-Z])/g, " $1").trim()}
                               </Typography>
                               <Chip
                                 label={typeof score === "number" ? `${(score * 100).toFixed(0)}%` : "N/A"}
                                 size="small"
                                 sx={{
                                   fontSize: "12px",
                                   fontWeight: 600,
                                   height: 24,
                                   backgroundColor: passed ? "#D1FAE5" : "#FEE2E2",
                                   color: passed ? "#065F46" : "#991B1B",
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
                      sx={{ fontSize: "13px" }}
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
                      sx={{ fontSize: "13px" }}
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
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
