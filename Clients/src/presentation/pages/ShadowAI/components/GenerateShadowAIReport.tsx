/**
 * Generate Shadow AI Report Modal
 *
 * Multi-step modal for generating Shadow AI reports.
 * Page 1: Select sections to include
 * Page 2: Report options (name, period, format)
 * Page 3: Generation status with auto-download
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Stack,
  Box,
  Typography,
  Checkbox,
  Collapse,
  useTheme,
} from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ButtonToggle } from "../../../components/button-toggle";
import StandardModal from "../../../components/Modals/StandardModal";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import Alert from "../../../components/Alert";
import {
  generateShadowAIReport,
  GenerateShadowAIReportParams,
} from "../../../../application/repository/shadowAi.repository";
import { triggerBrowserDownload } from "../../../utils/browserDownload.utils";
import { handleAlert } from "../../../../application/tools/alertUtils";

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

interface SectionItem {
  id: string;
  label: string;
}

interface SectionGroup {
  id: string;
  label: string;
  sections: SectionItem[];
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    id: "overview",
    label: "Overview",
    sections: [
      { id: "executiveSummary", label: "Executive summary" },
      { id: "usageTrends", label: "Usage trends" },
    ],
  },
  {
    id: "toolsAndRisk",
    label: "Tools & risk",
    sections: [
      { id: "toolInventory", label: "Tool inventory" },
      { id: "riskAnalysis", label: "Risk analysis" },
      { id: "compliancePosture", label: "Compliance posture" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    sections: [
      { id: "departmentBreakdown", label: "Department breakdown" },
      { id: "topUsers", label: "Top users" },
      { id: "alertActivity", label: "Alert & rule activity" },
    ],
  },
];

const ALL_SECTION_IDS = SECTION_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id)
);

const STORAGE_KEY = "verifywise_shadow_ai_report_sections";

function loadSavedSections(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  // Default: all selected
  const defaults: Record<string, boolean> = {};
  ALL_SECTION_IDS.forEach((id) => (defaults[id] = true));
  return defaults;
}

function saveSections(selection: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Period options
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { _id: "7d", name: "Last 7 days" },
  { _id: "30d", name: "Last 30 days" },
  { _id: "90d", name: "Last 90 days" },
  { _id: "365d", name: "Last 365 days" },
  { _id: "all", name: "All time" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ModalPage = "sections" | "options" | "status";

interface GenerateShadowAIReportProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated?: () => void;
}

export default function GenerateShadowAIReport({
  isOpen,
  onClose,
  onReportGenerated,
}: GenerateShadowAIReportProps) {
  const theme = useTheme();

  // Modal state
  const [currentPage, setCurrentPage] = useState<ModalPage>("sections");
  const [selection, setSelection] = useState<Record<string, boolean>>(
    loadSavedSections
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    toolsAndRisk: true,
    activity: true,
  });

  // Options state
  const [reportName, setReportName] = useState("");
  const [period, setPeriod] = useState("30d");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");

  // Status state
  const [statusCode, setStatusCode] = useState<number>(200);
  const [isGenerating, setIsGenerating] = useState(false);

  // Alert
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  const hasAnySelection = useMemo(
    () => ALL_SECTION_IDS.some((id) => selection[id] === true),
    [selection]
  );

  const allSelected = useMemo(
    () => ALL_SECTION_IDS.every((id) => selection[id] === true),
    [selection]
  );

  const someSelected = useMemo(() => {
    const count = ALL_SECTION_IDS.filter((id) => selection[id] === true).length;
    return count > 0 && count < ALL_SECTION_IDS.length;
  }, [selection]);

  const handleSelectAll = useCallback(() => {
    const val = !allSelected;
    const next: Record<string, boolean> = {};
    ALL_SECTION_IDS.forEach((id) => (next[id] = val));
    setSelection(next);
  }, [allSelected]);

  const handleSectionToggle = useCallback(
    (sectionId: string) => {
      setSelection((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    },
    []
  );

  const handleGroupToggle = useCallback(
    (group: SectionGroup) => {
      const ids = group.sections.map((s) => s.id);
      const allChecked = ids.every((id) => selection[id] === true);
      const next = { ...selection };
      ids.forEach((id) => (next[id] = !allChecked));
      setSelection(next);
    },
    [selection]
  );

  const getGroupState = useCallback(
    (group: SectionGroup): "checked" | "unchecked" | "indeterminate" => {
      const ids = group.sections.map((s) => s.id);
      const count = ids.filter((id) => selection[id] === true).length;
      if (count === 0) return "unchecked";
      if (count === ids.length) return "checked";
      return "indeterminate";
    },
    [selection]
  );

  const toggleGroupExpand = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------

  const handleToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      handleAlert({ variant: type, body: message, setAlert });
      clearTimerRef.current = setTimeout(() => {
        setAlert(null);
        if (type === "success") {
          setCurrentPage("sections");
          setStatusCode(200);
          setIsGenerating(false);
          onClose();
        }
      }, 3000);
    },
    [onClose]
  );

  // ---------------------------------------------------------------------------
  // Generate
  // ---------------------------------------------------------------------------

  const handleGenerate = useCallback(async () => {
    saveSections(selection);
    setCurrentPage("status");
    setIsGenerating(true);

    const selectedSections = ALL_SECTION_IDS.filter(
      (id) => selection[id] === true
    );

    const body: GenerateShadowAIReportParams = {
      sections: selectedSections,
      format,
      period: period === "all" ? undefined : period,
      reportName: reportName.trim() || undefined,
    };

    try {
      const response = await generateShadowAIReport(body);
      setStatusCode(200);

      // Extract filename from response headers or build fallback
      const contentDisposition = response.headers?.["content-disposition"];
      let filename = `ShadowAI_Report.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/"([^"]+)"/);
        if (match) filename = match[1];
      }

      triggerBrowserDownload(response.data as Blob, filename);
      handleToast("success", "Report downloaded successfully.");
      if (onReportGenerated) onReportGenerated();
    } catch (error: unknown) {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status ?? 500
          : 500;
      setStatusCode(status);

      if (status === 403) {
        handleToast("warning", "Access denied: only administrators can generate reports.");
      } else {
        handleToast("error", "Failed to generate report. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selection, format, period, reportName, handleToast, onReportGenerated]);

  // ---------------------------------------------------------------------------
  // Close handler
  // ---------------------------------------------------------------------------

  const handleModalClose = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    // Reset state for next open
    setCurrentPage("sections");
    setStatusCode(200);
    setIsGenerating(false);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const checkboxSx = {
    padding: "2px",
    marginRight: "4px",
    color: theme.palette.border.dark,
    width: "20px",
    height: "20px",
    minWidth: "20px",
    minHeight: "20px",
    "&.Mui-checked": { color: "#13715B" },
    "&.MuiCheckbox-indeterminate": { color: "#13715B" },
    "& .MuiSvgIcon-root": { width: "16px", height: "16px" },
  };

  const rowSx = {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    "&:hover": { backgroundColor: theme.palette.background.alt },
  };

  const expandIconSx = {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    flexShrink: 0,
    "&:hover": { backgroundColor: theme.palette.background.main },
  };

  // ---------------------------------------------------------------------------
  // Modal content by page
  // ---------------------------------------------------------------------------

  const getModalMeta = () => {
    switch (currentPage) {
      case "sections":
        return {
          title: "Generate Shadow AI report",
          description: "Select which sections to include in your report.",
        };
      case "options":
        return {
          title: "Generate Shadow AI report",
          description: "Configure report options.",
        };
      case "status":
        return {
          title: "Generate Shadow AI report",
          description: "Your report is being generated.",
        };
    }
  };

  const { title, description } = getModalMeta();

  // ---------------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------------

  const renderFooter = () => {
    if (currentPage === "status") return null;

    const cancelBtn = (
      <CustomizableButton
        variant="outlined"
        text="Cancel"
        onClick={handleModalClose}
        sx={{
          minWidth: "80px",
          height: "34px",
          border: "1px solid #D0D5DD",
          color: "#344054",
          "&:hover": {
            backgroundColor: "#F9FAFB",
            border: "1px solid #D0D5DD",
          },
        }}
      />
    );

    if (currentPage === "sections") {
      return (
        <>
          <Box />
          <Stack direction="row" spacing={2}>
            {cancelBtn}
            <CustomizableButton
              variant="contained"
              text="Next"
              isDisabled={!hasAnySelection}
              onClick={() => setCurrentPage("options")}
              sx={{
                minWidth: "80px",
                height: "34px",
                backgroundColor: "#13715B",
                "&:hover:not(.Mui-disabled)": { backgroundColor: "#0F5A47" },
                "&.Mui-disabled": {
                  backgroundColor: "#E5E7EB",
                  color: "#9CA3AF",
                },
              }}
            />
          </Stack>
        </>
      );
    }

    // options page
    return (
      <>
        <CustomizableButton
          variant="outlined"
          text="Back"
          onClick={() => setCurrentPage("sections")}
          sx={{
            minWidth: "80px",
            height: "34px",
            border: "1px solid #D0D5DD",
            color: "#344054",
            "&:hover": {
              backgroundColor: "#F9FAFB",
              border: "1px solid #D0D5DD",
            },
          }}
        />
        <Stack direction="row" spacing={2}>
          {cancelBtn}
          <CustomizableButton
            variant="contained"
            text="Generate report"
            onClick={handleGenerate}
            sx={{
              minWidth: "120px",
              height: "34px",
              backgroundColor: "#13715B",
              "&:hover:not(.Mui-disabled)": { backgroundColor: "#0F5A47" },
            }}
          />
        </Stack>
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Section selector (Page 1)
  // ---------------------------------------------------------------------------

  const renderSections = () => (
    <Stack spacing={0.5}>
      {/* Select all */}
      <Box
        sx={{
          ...rowSx,
          backgroundColor: theme.palette.background.alt,
          borderBottom: `1px solid ${theme.palette.border.light}`,
          marginBottom: "4px",
        }}
        onClick={handleSelectAll}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={handleSelectAll}
          sx={checkboxSx}
          size="small"
        />
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: theme.palette.text.primary }}>
          Select all
        </Typography>
      </Box>

      {SECTION_GROUPS.map((group) => {
        const state = getGroupState(group);
        const expanded = expandedGroups[group.id] ?? true;

        return (
          <Box key={group.id}>
            <Box
              sx={{ ...rowSx, justifyContent: "space-between" }}
              onClick={() => handleGroupToggle(group)}
            >
              <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                <Checkbox
                  checked={state === "checked"}
                  indeterminate={state === "indeterminate"}
                  onChange={() => handleGroupToggle(group)}
                  sx={checkboxSx}
                  size="small"
                />
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: theme.palette.text.primary }}>
                  {group.label}
                </Typography>
              </Box>
              <Box sx={expandIconSx} onClick={(e) => toggleGroupExpand(group.id, e)}>
                {expanded ? (
                  <ChevronDown size={14} color={theme.palette.text.secondary} />
                ) : (
                  <ChevronRight size={14} color={theme.palette.text.secondary} />
                )}
              </Box>
            </Box>

            <Collapse in={expanded}>
              <Stack sx={{ marginLeft: "20px" }} spacing={0}>
                {group.sections.map((section) => (
                  <Box
                    key={section.id}
                    sx={rowSx}
                    onClick={() => handleSectionToggle(section.id)}
                  >
                    <Checkbox
                      checked={selection[section.id] === true}
                      onChange={() => handleSectionToggle(section.id)}
                      sx={checkboxSx}
                      size="small"
                    />
                    <Typography sx={{ fontSize: "13px", fontWeight: 400, color: theme.palette.text.primary }}>
                      {section.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        );
      })}

      <Typography
        sx={{
          fontSize: "12px",
          color: theme.palette.error.main,
          textAlign: "center",
          marginTop: "4px",
          visibility: hasAnySelection ? "hidden" : "visible",
          height: "18px",
        }}
      >
        Please select at least one section to generate a report.
      </Typography>
    </Stack>
  );

  // ---------------------------------------------------------------------------
  // Options form (Page 2)
  // ---------------------------------------------------------------------------

  const renderOptions = () => (
    <Stack spacing={3}>
      <Field
        label="Report name (optional)"
        placeholder="e.g. Q1 Shadow AI audit"
        value={reportName}
        onChange={(e) => setReportName(e.target.value)}
      />

      <Select
        id="shadow-ai-period"
        label="Time period"
        placeholder="Select period"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        items={PERIOD_OPTIONS}
      />

      <Stack spacing={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#344054" }}>
          Format
        </Typography>
        <ButtonToggle
          options={[
            { label: "PDF", value: "pdf" },
            { label: "DOCX", value: "docx" },
          ]}
          value={format}
          onChange={(val) => setFormat(val as "pdf" | "docx")}
        />
      </Stack>
    </Stack>
  );

  // ---------------------------------------------------------------------------
  // Status page (Page 3)
  // ---------------------------------------------------------------------------

  const renderStatus = () => (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{ py: 6, textAlign: "center" }}
    >
      {statusCode === 200 ? (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#344054", mb: 1 }}>
            {isGenerating ? "Preparing your report..." : "Report ready"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#667085" }}>
            {isGenerating
              ? "Your report is being generated and will download automatically."
              : "Your report has been downloaded."}
          </Typography>
        </>
      ) : statusCode === 403 ? (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "error.main", mb: 1 }}>
            Access denied
          </Typography>
          <Typography sx={{ fontSize: 13, color: "error.main" }}>
            Only administrators can generate reports.
          </Typography>
        </>
      ) : (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "error.main", mb: 1 }}>
            Generation failed
          </Typography>
          <Typography sx={{ fontSize: 13, color: "error.main" }}>
            Something went wrong while generating the report. Please try again.
          </Typography>
        </>
      )}
    </Stack>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {alert && (
        <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Box>
      )}

      <StandardModal
        isOpen={isOpen}
        onClose={handleModalClose}
        title={title}
        description={description}
        customFooter={renderFooter()}
        hideFooter={currentPage === "status"}
        maxWidth="500px"
      >
        <Stack sx={{ minHeight: currentPage === "status" ? "200px" : "auto" }}>
          {currentPage === "sections" && renderSections()}
          {currentPage === "options" && renderOptions()}
          {currentPage === "status" && renderStatus()}
        </Stack>
      </StandardModal>
    </>
  );
}
