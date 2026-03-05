import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { FileText, Download, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import Alert from "../../components/Alert";
import ReportConfigModal from "./ReportConfigModal";
import { generatePDFReport, generateCSVReport } from "./utils/reportGenerator";
import type { ReportConfig, ReportExperimentData, ReportArenaData } from "./types";
import {
  getAllExperiments,
  getExperiment,
  listArenaComparisons,
  getArenaComparisonResults,
} from "../../../application/repository/deepEval.repository";

interface ReportPageProps {
  projectId: string;
  projectName: string;
  orgId: string;
  orgName?: string;
}

interface ReportHistoryEntry {
  id: string;
  title: string;
  format: string;
  experiments: number;
  generatedAt: string;
}

const REPORT_HISTORY_KEY = "evals_report_history";

export default function ReportPage({
  projectId,
  projectName,
  orgId,
  orgName = "",
}: ReportPageProps) {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [experiments, setExperiments] = useState<
    Array<{ id: string; name: string; model: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning";
    body: string;
  } | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(REPORT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExperiments({ project_id: projectId });
      const expList = (data.experiments || []).map((exp: any) => ({
        id: exp.id || exp._id,
        name: exp.name || exp.config?.name || exp.id,
        model: exp.config?.model?.model_name || exp.config?.model?.name || "Unknown",
        status: exp.status || "unknown",
      }));
      setExperiments(expList);
    } catch (err) {
      console.error("Failed to load experiments for report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const handleGenerate = async (config: ReportConfig) => {
    setIsGenerating(true);
    try {
      const experimentDataList: ReportExperimentData[] = [];

      for (const expId of config.experimentIds) {
        const detail = await getExperiment(expId);
        const results = detail.results || detail;

        const metricSummaries: Record<string, any> = {};
        const metricThresholds: Record<string, number> = {};

        if (results.metricSummaries || results.metric_summaries) {
          const summaries = results.metricSummaries || results.metric_summaries;
          for (const [key, val] of Object.entries(summaries) as [string, any][]) {
            metricSummaries[key] = {
              averageScore: val.averageScore ?? val.average_score ?? val.avg ?? 0,
              passRate: val.passRate ?? val.pass_rate ?? 0,
              minScore: val.minScore ?? val.min_score ?? val.min ?? 0,
              maxScore: val.maxScore ?? val.max_score ?? val.max ?? 0,
              totalEvaluated: val.totalEvaluated ?? val.total_evaluated ?? val.count ?? 0,
            };
          }
        }

        if (results.metricThresholds || results.metric_thresholds || detail.config?.metric_thresholds) {
          const thresholds = results.metricThresholds || results.metric_thresholds || detail.config?.metric_thresholds || {};
          for (const [key, val] of Object.entries(thresholds)) {
            metricThresholds[key] = Number(val) || 0.5;
          }
        }

        const detailedResults = config.includeDetailedSamples
          ? (results.detailedResults || results.detailed_results || results.samples || []).map((s: any) => ({
              sampleId: s.sampleId || s.sample_id || s.id || "",
              protectedAttributes: s.protectedAttributes || s.protected_attributes || {},
              input: s.input || s.query || "",
              actualOutput: s.actualOutput || s.actual_output || s.output || s.response || "",
              expectedOutput: s.expectedOutput || s.expected_output || "",
              responseLength: s.responseLength || s.response_length || 0,
              wordCount: s.wordCount || s.word_count || 0,
              metricScores: s.metricScores || s.metric_scores || {},
              timestamp: s.timestamp || "",
            }))
          : undefined;

        experimentDataList.push({
          id: detail.id || detail._id || expId,
          name: detail.name || detail.config?.name || results.model || expId,
          status: detail.status || "completed",
          model: results.model || detail.config?.model?.model_name || "Unknown",
          dataset: results.dataset || detail.config?.dataset?.name || "",
          judge: detail.config?.judge?.model_name || detail.config?.judge?.name || "",
          scorer: detail.config?.scorer?.name || "",
          useCase: detail.config?.use_case || "",
          totalSamples: results.totalSamples || results.total_samples || 0,
          createdAt: detail.createdAt || detail.created_at || "",
          completedAt: detail.completedAt || detail.completed_at || "",
          duration: results.duration || detail.duration,
          metricSummaries,
          metricThresholds,
          detailedResults,
        });
      }

      let arenaData: ReportArenaData[] = [];
      if (config.includeArena) {
        try {
          const arenaList = await listArenaComparisons(orgId ? { org_id: orgId } : undefined);
          const comparisons = arenaList.comparisons || [];
          for (const comp of comparisons.slice(0, 5)) {
            try {
              const result = await getArenaComparisonResults(comp.id || comp._id);
              arenaData.push({
                id: comp.id || comp._id,
                name: comp.name || comp.id,
                winner: result.winner || result.summary?.winner || "N/A",
                contestants: (result.contestants || []).map((c: any) => ({
                  model: c.model || c.name || "Unknown",
                  wins: c.wins || 0,
                  losses: c.losses || 0,
                  ties: c.ties || 0,
                  avgScore: c.avgScore || c.avg_score || 0,
                })),
                criteria: result.criteria || result.metrics || [],
                rounds: result.rounds || result.total_rounds || 0,
                createdAt: comp.created_at || comp.createdAt || "",
              });
            } catch {
              // skip individual arena failures
            }
          }
        } catch {
          // arena data is optional
        }
      }

      if (config.format === "pdf") {
        await generatePDFReport(config, experimentDataList, arenaData, projectName, orgName || orgId);
      } else {
        generateCSVReport(experimentDataList, projectName);
      }

      const entry: ReportHistoryEntry = {
        id: crypto.randomUUID(),
        title: config.title,
        format: config.format.toUpperCase(),
        experiments: config.experimentIds.length,
        generatedAt: new Date().toISOString(),
      };
      const updatedHistory = [entry, ...reportHistory].slice(0, 20);
      setReportHistory(updatedHistory);
      localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(updatedHistory));

      setAlert({ variant: "success", body: `Report generated successfully (${config.format.toUpperCase()})` });
      setTimeout(() => setAlert(null), 4000);
      setConfigModalOpen(false);
    } catch (err) {
      console.error("Report generation failed:", err);
      setAlert({
        variant: "error",
        body: `Failed to generate report: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setTimeout(() => setAlert(null), 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedCount = experiments.filter(e => e.status === "completed").length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <Stack spacing={1}>
        <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          Evaluation Reports
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: 14 }}>
          Generate comprehensive evaluation reports from your experiment results.
          Reports follow the EvalCards and Eval Factsheets standards for structured AI evaluation documentation.
        </Typography>
      </Stack>

      {/* Action Card */}
      <Box
        sx={{
          background: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: "24px",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} strokeWidth={1.5} color="#13715B" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                Generate new report
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                {completedCount} completed experiment{completedCount !== 1 ? "s" : ""} available
              </Typography>
            </Box>
          </Stack>
          <CustomizableButton
            variant="contained"
            onClick={() => setConfigModalOpen(true)}
            disabled={completedCount === 0}
            icon={<Download size={14} />}
            text="Generate Report"
            sx={{
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0f604d" },
              textTransform: "none",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: "6px",
              px: 3.5,
              py: 1.2,
            }}
          />
        </Stack>

        {completedCount === 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "6px",
              backgroundColor: "#FFFBEB",
              border: "1px solid #FDE68A",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AlertTriangle size={16} color="#D97706" />
            <Typography sx={{ fontSize: 12, color: "#92400E" }}>
              No completed experiments yet. Run at least one experiment to generate a report.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Report History */}
      {reportHistory.length > 0 && (
        <Box
          sx={{
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: "24px",
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 2 }}>
            Recent reports
          </Typography>
          <Stack spacing={0}>
            {reportHistory.slice(0, 10).map(entry => (
              <Box
                key={entry.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  borderBottom: "1px solid #F3F4F6",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <CheckCircle size={14} color="#16A34A" />
                  <Typography sx={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>
                    {entry.title}
                  </Typography>
                  <Chip
                    label={entry.format}
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 18,
                      backgroundColor: entry.format === "PDF" ? "#ECFDF5" : "#ECFDF5",
                      color: entry.format === "PDF" ? "#13715B" : "#065F46",
                    }}
                  />
                  <Chip
                    label={`${entry.experiments} exp${entry.experiments !== 1 ? "s" : ""}`}
                    size="small"
                    sx={{ fontSize: 10, height: 18, backgroundColor: "#F3F4F6", color: "#374151" }}
                  />
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Clock size={12} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                    {new Date(entry.generatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Standards Info */}
      <Box
        sx={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "4px",
          p: "20px",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374054", mb: 1 }}>
          Report standards
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
          Reports are structured following industry standards for AI evaluation documentation:
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {[
            ["EvalCards", "Structured evaluation documentation with metrics, context, and methodology"],
            ["Eval Factsheets", "Standardized fields covering evaluation setup, scoring, and limitations"],
            ["COMPL-AI", "EU AI Act compliance framework mapping for safety metrics"],
          ].map(([title, desc]) => (
            <Stack key={title} direction="row" gap={1} alignItems="baseline">
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#13715B", minWidth: 90 }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#6B7280" }}>{desc}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Config Modal */}
      <ReportConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onGenerate={handleGenerate}
        experiments={experiments}
        projectName={projectName}
        isGenerating={isGenerating}
      />
    </Box>
  );
}
