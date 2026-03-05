import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import { FileText, Download, Clock, CheckCircle, AlertTriangle, Eye, X, ExternalLink } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import Alert from "../../components/Alert";
import ReportConfigModal from "./ReportConfigModal";
import type { ReportConfig } from "./types";
import CustomAxios from "../../../infrastructure/api/customAxios";
import {
  getAllExperiments,
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

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

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
      const response = await CustomAxios.post(
        "/deepeval/reports/generate",
        {
          title: config.title,
          format: config.format,
          experimentIds: config.experimentIds,
          sections: config.sections,
          includeDetailedSamples: config.includeDetailedSamples,
          includeArena: config.includeArena,
          projectId,
          orgName: orgName || orgId,
        },
        {
          responseType: "blob",
          timeout: 120000,
        },
      );

      if (config.format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        setPdfTitle(config.title || `${projectName} - Evaluation Report`);

        setTimeout(() => {
          pdfContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(config.title || projectName).replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.csv`;
        a.click();
        URL.revokeObjectURL(url);
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

  const handleDownloadCurrent = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = `${pdfTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.pdf`;
    a.click();
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) window.open(pdfBlobUrl, "_blank");
  };

  const closePdfViewer = () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfTitle("");
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
          Reports follow the{" "}
          <Typography
            component="a"
            href="https://arxiv.org/abs/2206.11249"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: 14, color: "#13715B", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            EvalCards
          </Typography>{" "}
          standard for structured AI evaluation documentation.
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

      {/* PDF Viewer */}
      {pdfBlobUrl && (
        <Box
          ref={pdfContainerRef}
          sx={{
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 1.5,
              borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#F9FAFB",
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Eye size={16} color="#13715B" />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {pdfTitle}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <IconButton size="small" onClick={handleDownloadCurrent} title="Download PDF">
                <Download size={16} color="#6B7280" />
              </IconButton>
              <IconButton size="small" onClick={handleOpenInNewTab} title="Open in new tab">
                <ExternalLink size={16} color="#6B7280" />
              </IconButton>
              <IconButton size="small" onClick={closePdfViewer} title="Close viewer">
                <X size={16} color="#6B7280" />
              </IconButton>
            </Stack>
          </Box>
          <Box sx={{ width: "100%", height: "80vh", backgroundColor: "#525659" }}>
            <iframe
              src={pdfBlobUrl}
              title="Report Preview"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </Box>
        </Box>
      )}

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
                      backgroundColor: "#ECFDF5",
                      color: "#13715B",
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

      {/* EvalCards Standard Info */}
      <Box
        sx={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "4px",
          p: "20px",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374054", mb: 1 }}>
          About EvalCards
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.8 }}>
          Reports are structured following the{" "}
          <Typography
            component="a"
            href="https://arxiv.org/abs/2206.11249"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: 12, color: "#13715B", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            EvalCards
          </Typography>{" "}
          standard — a structured documentation framework for AI evaluation results. Each report includes:
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          {[
            ["Evaluation context", "Model identity, dataset, judge configuration, and use case"],
            ["Metric results", "Per-metric averages, pass/fail rates, and score distributions"],
            ["Safety assessment", "Dedicated section for bias, toxicity, and hallucination metrics"],
            ["Comparative analysis", "Arena comparison results when multiple models are evaluated"],
            ["Methodology", "Scoring criteria, thresholds, and evaluation pipeline details"],
          ].map(([title, desc]) => (
            <Stack key={title} direction="row" gap={1} alignItems="baseline">
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#13715B", minWidth: 130, flexShrink: 0 }}>
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
