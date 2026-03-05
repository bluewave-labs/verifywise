import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from "@mui/material";
import { FileText, Download, AlertTriangle, Eye, X, ExternalLink, Trash2 } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import Alert from "../../components/Alert";
import ReportConfigModal from "./ReportConfigModal";
import type { ReportConfig } from "./types";
import CustomAxios from "../../../infrastructure/api/customAxios";
import {
  getAllExperiments,
} from "../../../application/repository/deepEval.repository";
import singleTheme from "../../themes/v1SingleTheme";

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
  experimentIds: string[];
  sections: any[];
  generatedAt: string;
}

const REPORT_HISTORY_KEY = "evals_report_history";

export default function ReportPage({
  projectId,
  projectName,
  orgId,
  orgName = "",
}: ReportPageProps) {
  const theme = useTheme();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
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
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((e: any) => ({
        ...e,
        experimentIds: e.experimentIds || [],
        sections: e.sections || [],
        experiments: e.experiments || 0,
      }));
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

  const generateReport = async (
    title: string,
    format: string,
    experimentIds: string[],
    sections: any[],
    includeDetailedSamples: boolean,
    includeArena: boolean,
  ): Promise<Blob> => {
    const response = await CustomAxios.post(
      "/deepeval/reports/generate",
      {
        title,
        format,
        experimentIds,
        sections,
        includeDetailedSamples,
        includeArena,
        projectId,
        orgName: orgName || orgId,
      },
      {
        responseType: "blob",
        timeout: 120000,
      },
    );
    return new Blob([response.data], {
      type: format === "pdf" ? "application/pdf" : "text/csv",
    });
  };

  const showPdf = (blob: Blob, title: string) => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
    setPdfTitle(title);
    setTimeout(() => {
      pdfContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (config: ReportConfig) => {
    setIsGenerating(true);
    try {
      const blob = await generateReport(
        config.title,
        config.format,
        config.experimentIds,
        config.sections,
        config.includeDetailedSamples,
        config.includeArena,
      );

      const reportTitle = config.title || `${projectName} - Evaluation Report`;

      if (config.format === "pdf") {
        showPdf(blob, reportTitle);
      } else {
        downloadBlob(blob, `${reportTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.csv`);
      }

      const entry: ReportHistoryEntry = {
        id: crypto.randomUUID(),
        title: reportTitle,
        format: config.format.toUpperCase(),
        experiments: config.experimentIds.length,
        experimentIds: config.experimentIds,
        sections: config.sections,
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

  const handleViewReport = async (entry: ReportHistoryEntry) => {
    if (!entry.experimentIds || entry.experimentIds.length === 0) {
      setAlert({ variant: "warning", body: "Cannot regenerate: no experiment IDs stored for this report." });
      setTimeout(() => setAlert(null), 4000);
      return;
    }
    setRegeneratingId(entry.id);
    try {
      const blob = await generateReport(
        entry.title,
        "pdf",
        entry.experimentIds,
        entry.sections || [],
        false,
        false,
      );
      showPdf(blob, entry.title);
    } catch (err) {
      console.error("Failed to regenerate report:", err);
      setAlert({
        variant: "error",
        body: `Failed to load report: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownloadReport = async (entry: ReportHistoryEntry) => {
    if (!entry.experimentIds || entry.experimentIds.length === 0) {
      setAlert({ variant: "warning", body: "Cannot regenerate: no experiment IDs stored for this report." });
      setTimeout(() => setAlert(null), 4000);
      return;
    }
    setRegeneratingId(entry.id);
    try {
      const format = entry.format.toLowerCase();
      const blob = await generateReport(
        entry.title,
        format,
        entry.experimentIds,
        entry.sections || [],
        false,
        false,
      );
      const ext = format === "csv" ? "csv" : "pdf";
      downloadBlob(blob, `${entry.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.${ext}`);
    } catch (err) {
      console.error("Failed to download report:", err);
      setAlert({
        variant: "error",
        body: `Failed to download report: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRemoveReport = (entryId: string) => {
    const updated = reportHistory.filter(e => e.id !== entryId);
    setReportHistory(updated);
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(updated));
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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
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

      {/* Report History Table */}
      {reportHistory.length > 0 && (
        <Box
          sx={{
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
          }}
        >
          <Box sx={{ px: "24px", pt: "20px", pb: "12px" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Recent reports
            </Typography>
          </Box>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
              <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "35%" }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Report</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "12%" }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Format</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "15%" }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Experiments</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "23%" }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Generated</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "15%", minWidth: 120 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportHistory.slice(0, 15).map(entry => (
                  <TableRow
                    key={entry.id}
                    sx={singleTheme.tableStyles.primary.body.row}
                  >
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <FileText size={14} strokeWidth={1.5} color="#13715B" />
                        <Typography sx={{ fontSize: 13, color: theme.palette.text.primary, fontWeight: 500 }}>
                          {entry.title}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip
                        label={entry.format}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 22,
                          fontWeight: 500,
                          backgroundColor: entry.format === "PDF" ? "#ECFDF5" : "#F0FDF4",
                          color: "#13715B",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                        {entry.experiments} exp{entry.experiments !== 1 ? "s" : ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                        {formatDate(entry.generatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell} onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5}>
                        {entry.format === "PDF" && (
                          <Tooltip title="View report">
                            <IconButton
                              size="small"
                              onClick={() => handleViewReport(entry)}
                              disabled={regeneratingId === entry.id}
                              sx={{ padding: 0.5 }}
                            >
                              {regeneratingId === entry.id ? (
                                <CircularProgress size={14} />
                              ) : (
                                <Eye size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Download report">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadReport(entry)}
                            disabled={regeneratingId === entry.id}
                            sx={{ padding: 0.5 }}
                          >
                            <Download size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from history">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveReport(entry.id)}
                            sx={{ padding: 0.5 }}
                          >
                            <Trash2 size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
