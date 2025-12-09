/**
 * EU AI Act Question Drawer Dialog
 *
 * Tab-based drawer for managing EU AI Act assessment questions
 * Mirrors ISO27001/ISO42001/NIST AI RMF architecture for consistency
 *
 * Tabs:
 * - Details: Question, answer, status
 * - Evidence: File management (upload, download, delete)
 * - Cross mappings: Risk management
 * - Notes: Collaboration notes (lazy-loaded)
 */

import React, { useState, useEffect, Suspense, lazy, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import {
  X as CloseIcon,
  Save as SaveIcon,
  Trash2 as DeleteIcon,
  Download as DownloadIcon,
  FileText as FileIcon,
  Eye as ViewIcon,
} from "lucide-react";

// Inputs & UI Components
import RichTextEditor from "../../RichTextEditor";
import Select from "../../Inputs/Select";
import TabBar from "../../TabBar";
import CustomizableButton from "../../Button/CustomizableButton";
import Alert from "../../Alert";
import StandardModal from "../../Modals/StandardModal";

// Lazy-loaded components
const LinkedRisksPopup = lazy(() => import("../../LinkedRisks"));
const NotesTab = lazy(() => import("../../Notes/NotesTab"));
const AddNewRiskForm = lazy(() => import("../../AddNewRiskForm"));

// Types & Constants
import {
  EUAIActQuestionDrawerProps,
  EUAIActFormData,
  EUAIACT_STATUS_OPTIONS,
} from "./types";
import { FileData } from "../../../../domain/types/File";
import { AlertProps } from "../../../../domain/interfaces/iAlert";

// Hooks & Utilities
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { updateEUAIActAnswerById } from "../../../../application/repository/question.repository";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { getFileById } from "../../../../application/repository/file.repository";
import allowedRoles from "../../../../application/constants/permissions";

// Type for risk objects
interface LinkedRisk {
  id: number;
  risk_name: string;
  risk_description?: string;
  risk_level?: string;
  mitigation_status?: string;
}

// Constants
export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

const ACCEPTED_FILE_TYPES =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar";

// ============================================================================
// COMPONENT
// ============================================================================

const EUAIActQuestionDrawerDialog: React.FC<EUAIActQuestionDrawerProps> = ({
  open,
  onClose,
  question: questionProp,
  subtopic,
  currentProjectId,
  onSaveSuccess,
}) => {
  const { userRoleName, userId } = useAuth();
  const { users } = useUsers();

  // ========================================================================
  // STATE - UI & LOADING
  // ========================================================================

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [fetchedQuestion, setFetchedQuestion] = useState<any>(null);

  // ========================================================================
  // STATE - FORM DATA
  // ========================================================================

  const [formData, setFormData] = useState<EUAIActFormData>({
    answer: "",
    status: "notStarted",
  });

  // ========================================================================
  // STATE - EVIDENCE FILES
  // ========================================================================

  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<number[]>([]);

  // ========================================================================
  // STATE - RISKS
  // ========================================================================

  const [currentRisks, setCurrentRisks] = useState<number[]>([]);
  const [linkedRiskObjects, setLinkedRiskObjects] = useState<LinkedRisk[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] = useState(false);

  // Risk detail modal state
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState(false);
  const [selectedRiskForView, setSelectedRiskForView] =
    useState<LinkedRisk | null>(null);
  const [riskFormData, setRiskFormData] = useState<any>(null);
  const onRiskSubmitRef = useRef<(() => void) | null>(null);

  // ========================================================================
  // PERMISSIONS
  // ========================================================================

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);

  // ========================================================================
  // TAB CONFIGURATION
  // ========================================================================

  const tabs = [
    {
      label: "Details",
      value: "details",
      icon: "FileText" as const,
    },
    {
      label: "Evidence",
      value: "evidence",
      icon: "FolderOpen" as const,
    },
    {
      label: "Cross mappings",
      value: "cross-mappings",
      icon: "Link" as const,
    },
    {
      label: "Notes",
      value: "notes",
      icon: "MessageSquare" as const,
    },
  ];

  // ========================================================================
  // STATUS MAPPING
  // ========================================================================

  const statusIdMap = new Map([
    ["Not started", "notStarted"],
    ["In progress", "inProgress"],
    ["Done", "done"],
  ]);

  const idStatusMap = new Map();
  for (const [status, id] of statusIdMap.entries()) {
    idStatusMap.set(id, status);
  }

  // ========================================================================
  // EFFECTS - INITIALIZATION
  // ========================================================================

  // Initialize from props or fetch when drawer opens
  useEffect(() => {
    if (open && questionProp?.answer_id) {
      // Use prop data immediately for fast display
      const question = questionProp;
      setFetchedQuestion(question);

      // Initialize form data from props
      const statusId =
        question.status === "Not started"
          ? "notStarted"
          : question.status === "In progress"
          ? "inProgress"
          : question.status === "Done"
          ? "done"
          : "notStarted";

      setFormData({
        answer: question.answer || "",
        status: statusId,
      });

      // Initialize evidence files
      if (question.evidence_files) {
        setEvidenceFiles(question.evidence_files as FileData[]);
      } else {
        setEvidenceFiles([]);
      }

      // Initialize risks
      if (question.risks) {
        setCurrentRisks(question.risks);
        fetchLinkedRisks(question.risks);
      } else {
        setCurrentRisks([]);
        setLinkedRiskObjects([]);
      }

      // Reset pending states
      resetPendingState();
    }
  }, [open, questionProp?.answer_id]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const fetchLinkedRisks = async (riskIds?: number[]) => {
    if (!questionProp?.answer_id) return;

    // Use provided riskIds or fall back to currentRisks
    const allRiskIds = riskIds || currentRisks;

    if (allRiskIds.length === 0) {
      setLinkedRiskObjects([]);
      return;
    }

    try {
      const riskPromises = allRiskIds.map((riskId: number) =>
        getEntityById({
          routeUrl: `/projectRisks/${riskId}`,
        })
          .then((response) => response.data)
          .catch(() => null)
      );

      const riskResults = await Promise.all(riskPromises);
      const validRisks = riskResults.filter((risk) => risk !== null);
      setLinkedRiskObjects(validRisks);
    } catch (error) {
      console.error("Error fetching linked risks:", error);
      setLinkedRiskObjects([]);
    }
  };

  // ========================================================================
  // EVENT HANDLERS - FORM CHANGES
  // ========================================================================

  const handleFieldChange = (field: keyof EUAIActFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (answer: string) => {
    const cleanedAnswer = answer?.replace(/^<p>|<\/p>$/g, "") || "";
    handleFieldChange("answer", cleanedAnswer || "");
  };

  const handleSelectChange = (field: keyof EUAIActFormData) => (event: any) => {
    handleFieldChange(field, event.target.value.toString());
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // ========================================================================
  // EVENT HANDLERS - ALERTS
  // ========================================================================

  const handleAlertCall = ({
    variant,
    body,
  }: {
    variant: "success" | "error" | "warning" | "info";
    body: string;
  }) => {
    handleAlert({
      variant,
      body,
      setAlert,
    });
  };

  // ========================================================================
  // EVENT HANDLERS - FILE MANAGEMENT
  // ========================================================================

  const handleAddFiles = (files: File[]) => {
    const newFiles: FileData[] = files.map((file) => ({
      id: (Date.now() + Math.random()).toString(),
      fileName: file.name,
      size: file.size,
      type: file.type,
      data: file,
      uploadDate: new Date().toISOString(),
      uploader: "Current User",
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
    handleAlertCall({
      variant: "info",
      body: `${files.length} file(s) added. Save to apply changes.`,
    });
  };

  const handleDeleteEvidenceFile = (fileId: string) => {
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      handleAlertCall({
        variant: "error",
        body: "Invalid file ID",
      });
      return;
    }
    setEvidenceFiles((prev) => prev.filter((f) => f.id.toString() !== fileId));
    setDeletedFiles((prev) => [...prev, fileIdNumber]);
    handleAlertCall({
      variant: "info",
      body: "File marked for deletion. Save to apply changes.",
    });
  };

  const handleDeleteUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
    handleAlertCall({
      variant: "info",
      body: "File removed from upload queue.",
    });
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await getFileById({
        id: fileId,
        responseType: "arraybuffer",
      });

      const blob = new Blob([response], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      handleAlertCall({
        variant: "success",
        body: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      handleAlertCall({
        variant: "error",
        body: "Failed to download file. Please try again.",
      });
    }
  };

  // ========================================================================
  // EVENT HANDLERS - RISK MANAGEMENT
  // ========================================================================

  const handleViewRiskDetails = async (risk: LinkedRisk) => {
    setSelectedRiskForView(risk);
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/${risk.id}`,
      });
      if (response.data) {
        const riskData = response.data;
        setRiskFormData({
          riskName: riskData.risk_name || "",
          actionOwner: riskData.risk_owner || 0,
          aiLifecyclePhase: riskData.ai_lifecycle_phase || 0,
          riskDescription: riskData.risk_description || "",
          riskCategory: riskData.risk_category || [1],
          potentialImpact: riskData.impact || "",
          assessmentMapping: riskData.assessment_mapping || 0,
          controlsMapping: riskData.controls_mapping || 0,
          likelihood: riskData.likelihood_score || 1,
          riskSeverity: riskData.severity_score || 1,
          riskLevel: riskData.risk_level || 0,
          reviewNotes: riskData.review_notes || "",
          applicableProjects: riskData.applicable_projects || [],
          applicableFrameworks: riskData.applicable_frameworks || [],
        });
        setIsRiskDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching risk details:", error);
      handleAlertCall({
        variant: "error",
        body: "Failed to load risk details",
      });
    }
  };

  const handleRiskDetailModalClose = () => {
    setIsRiskDetailModalOpen(false);
    setSelectedRiskForView(null);
    setRiskFormData(null);
  };

  const handleRiskUpdateSuccess = () => {
    handleRiskDetailModalClose();
    handleAlertCall({
      variant: "success",
      body: "Risk updated successfully",
    });
    // Refresh linked risks after update
    if (questionProp?.answer_id) {
      fetchLinkedRisks();
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const resetPendingState = () => {
    setUploadFiles([]);
    setDeletedFiles([]);
    setSelectedRisks([]);
    setDeletedRisks([]);
  };

  // ========================================================================
  // EVENT HANDLERS - SAVE
  // ========================================================================

  const handleSave = async () => {
    if (!questionProp?.answer_id) {
      handleAlertCall({
        variant: "error",
        body: "No question selected for update",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("answer", formData.answer);
      formDataToSend.append(
        "status",
        idStatusMap.get(formData.status) || "Not started"
      );
      formDataToSend.append("user_id", userId?.toString() || "1");
      formDataToSend.append("project_id", currentProjectId.toString());
      formDataToSend.append("delete", JSON.stringify(deletedFiles));
      formDataToSend.append("risksDelete", JSON.stringify(deletedRisks));
      formDataToSend.append("risksMitigated", JSON.stringify(selectedRisks));

      // Add uploaded files
      uploadFiles.forEach((file) => {
        if (file.data instanceof Blob) {
          const fileToUpload =
            file.data instanceof File
              ? file.data
              : new File([file.data!], file.fileName, { type: file.type });
          formDataToSend.append("files", fileToUpload);
        }
      });

      const response = await updateEUAIActAnswerById({
        answerId: questionProp.answer_id,
        body: formDataToSend,
      });

      if (response.status === 202) {
        handleAlertCall({
          variant: "success",
          body: "Question updated successfully",
        });

        // Update local state with response data
        if (response.data?.data) {
          setFormData({
            answer: response.data.data.answer || "",
            status:
              response.data.data.status === "Not started"
                ? "notStarted"
                : response.data.data.status === "In progress"
                ? "inProgress"
                : response.data.data.status === "Done"
                ? "done"
                : "notStarted",
          });
          setEvidenceFiles(response.data.data.evidence_files || []);
        }

        // Refresh linked risks
        if (response.data?.data?.risks) {
          setCurrentRisks(response.data.data.risks);
          await fetchLinkedRisks(response.data.data.risks);
        }

        // Reset pending states
        resetPendingState();

        onSaveSuccess?.(
          true,
          "Question updated successfully",
          questionProp.question_id
        );
      } else {
        throw new Error(response.data?.message || "Failed to update question");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      handleAlertCall({
        variant: "error",
        body: errorMessage,
      });
      onSaveSuccess?.(false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // RENDER - LOADING STATE
  // ========================================================================

  const displayQuestion = fetchedQuestion || questionProp;

  if (isLoading && !displayQuestion) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        sx={{
          width: 600,
          margin: 0,
          "& .MuiDrawer-paper": {
            margin: 0,
            borderRadius: 0,
          },
        }}
        anchor="right"
      >
        <Stack
          sx={{
            width: 600,
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading question data...</Typography>
        </Stack>
      </Drawer>
    );
  }

  // ========================================================================
  // RENDER - MAIN
  // ========================================================================

  return (
    <>
      <Drawer
        className="eu-ai-act-question-drawer-dialog"
        open={open}
        onClose={onClose}
        sx={{
          width: 600,
          margin: 0,
          "& .MuiDrawer-paper": {
            width: 600,
            margin: 0,
            borderRadius: 0,
            overflowX: "hidden",
          },
        }}
        anchor="right"
      >
        <Stack
          className="eu-ai-act-question-drawer-dialog-content"
          sx={{ width: 600 }}
        >
          {/* HEADER */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            padding="15px 20px"
          >
            <Typography fontSize={15} fontWeight={700}>
              {subtopic?.title}
            </Typography>
            <Button
              onClick={onClose}
              sx={{
                minWidth: "0",
                padding: "5px",
              }}
            >
              <CloseIcon size={20} color="#667085" />
            </Button>
          </Stack>

          <Divider />

          {/* TAB NAVIGATION */}
          <TabContext value={activeTab}>
            <Box sx={{ padding: "0 20px" }}>
              <TabBar
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
              />
            </Box>

            {/* ================================================================ */}
            {/* DETAILS TAB */}
            {/* ================================================================ */}

            <TabPanel
              value="details"
              sx={{ padding: "15px 20px", gap: "15px" }}
            >
              <Stack gap="15px">
                {/* Question Panel */}
                {displayQuestion?.question && (
                  <Stack
                    sx={{
                      border: "1px solid #eee",
                      padding: "12px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography fontSize={13} sx={{ marginBottom: "8px" }}>
                      <strong>Question:</strong>
                    </Typography>
                    <Typography fontSize={13} color="#344054">
                      {displayQuestion.question}
                    </Typography>
                    {displayQuestion?.hint && (
                      <Typography
                        fontSize={12}
                        color="#666"
                        sx={{ marginTop: "8px", fontStyle: "italic" }}
                      >
                        💡 Hint: {displayQuestion.hint}
                      </Typography>
                    )}
                  </Stack>
                )}

                {/* Priority & Required Badges */}
                <Stack direction="row" gap={1} alignItems="center">
                  {displayQuestion?.priority_level && (
                    <Chip
                      label={displayQuestion.priority_level}
                      size="small"
                      sx={{
                        backgroundColor: "#f0f0f0",
                        color: "#344054",
                        textTransform: "capitalize",
                      }}
                    />
                  )}
                  {displayQuestion?.is_required && (
                    <Chip
                      label="Required"
                      size="small"
                      sx={{ backgroundColor: "#e8f5e9" }}
                    />
                  )}
                </Stack>

                {/* Answer Field */}
                <Stack>
                  <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                    Answer:
                  </Typography>
                  <RichTextEditor
                    onContentChange={handleAnswerChange}
                    initialContent={formData.answer}
                    isEditable={!isEditingDisabled}
                    headerSx={{
                      borderRadius: "4px 4px 0 0",
                      borderTop: "1px solid #d0d5dd",
                      borderColor: "#d0d5dd",
                    }}
                    bodySx={{
                      borderColor: "#d0d5dd",
                      borderRadius: "0 0 4px 4px",
                      "& .ProseMirror > p": {
                        margin: 0,
                      },
                    }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Status */}
              <Stack gap="24px">
                <Select
                  id="status"
                  label="Status:"
                  value={formData.status}
                  onChange={handleSelectChange("status")}
                  items={EUAIACT_STATUS_OPTIONS.map((option) => ({
                    _id: option.id,
                    name: option.name,
                  }))}
                  sx={inputStyles}
                  placeholder="Select status"
                  disabled={isEditingDisabled}
                  getOptionValue={(item) => String(item._id)}
                />
              </Stack>
            </TabPanel>

            {/* ================================================================ */}
            {/* EVIDENCE TAB */}
            {/* ================================================================ */}

            <TabPanel value="evidence" sx={{ padding: "15px 20px" }}>
              <Stack spacing={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Evidence files
                </Typography>
                <Typography variant="body2" color="#6B7280">
                  Upload evidence files to document compliance with this
                  question.
                </Typography>

                {/* File Input Button */}
                <Box>
                  <input
                    type="file"
                    multiple
                    accept={ACCEPTED_FILE_TYPES}
                    style={{ display: "none" }}
                    id="evidence-file-input"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleAddFiles(files);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                      variant="contained"
                      component="label"
                      htmlFor="evidence-file-input"
                      disabled={isEditingDisabled}
                      sx={{
                        borderRadius: 2,
                        width: 155,
                        height: 25,
                        fontSize: 11,
                        border: "1px solid #D0D5DD",
                        backgroundColor: "white",
                        color: "#344054",
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
                          border: "1px solid #D0D5DD",
                        },
                      }}
                    >
                      Add evidence files
                    </Button>

                    <Stack direction="row" spacing={2}>
                      <Typography sx={{ fontSize: 11, color: "#344054" }}>
                        {`${evidenceFiles.length || 0} files attached`}
                      </Typography>
                      {uploadFiles.length > 0 && (
                        <Typography sx={{ fontSize: 11, color: "#13715B" }}>
                          {`+${uploadFiles.length} pending upload`}
                        </Typography>
                      )}
                      {deletedFiles.length > 0 && (
                        <Typography sx={{ fontSize: 11, color: "#D32F2F" }}>
                          {`-${deletedFiles.length} pending delete`}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>

                {/* Existing Evidence Files */}
                {evidenceFiles.length > 0 && (
                  <Stack spacing={1}>
                    {evidenceFiles
                      .filter(
                        (file) =>
                          !deletedFiles.includes(parseInt(file.id.toString()))
                      )
                      .map((file) => (
                        <Box
                          key={file.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            border: "1px solid #EAECF0",
                            borderRadius: "4px",
                            backgroundColor: "#FFFFFF",
                            "&:hover": {
                              backgroundColor: "#F9FAFB",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1.5,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <FileIcon size={18} color="#475467" />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "#1F2937",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {file.fileName}
                              </Typography>
                              {file.size && (
                                <Typography
                                  sx={{ fontSize: 11, color: "#6B7280" }}
                                >
                                  {(file.size / 1024).toFixed(1)} KB
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Download file">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDownloadFile(
                                    file.id.toString(),
                                    file.fileName
                                  )
                                }
                                sx={{
                                  color: "#475467",
                                  "&:hover": {
                                    color: "#13715B",
                                    backgroundColor: "rgba(19, 113, 91, 0.08)",
                                  },
                                }}
                              >
                                <DownloadIcon size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete file">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteEvidenceFile(file.id.toString())
                                }
                                disabled={isEditingDisabled}
                                sx={{
                                  color: "#475467",
                                  "&:hover": {
                                    color: "#D32F2F",
                                    backgroundColor: "rgba(211, 47, 47, 0.08)",
                                  },
                                }}
                              >
                                <DeleteIcon size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                  </Stack>
                )}

                {/* Upload Queue Files */}
                {uploadFiles.length > 0 && (
                  <Stack spacing={1}>
                    <Typography
                      sx={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}
                    >
                      Pending upload
                    </Typography>
                    {uploadFiles.map((file) => (
                      <Box
                        key={file.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          border: "1px solid #FEF3C7",
                          borderRadius: "4px",
                          backgroundColor: "#FFFBEB",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <FileIcon size={18} color="#D97706" />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "#92400E",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {file.fileName}
                            </Typography>
                            {file.size && (
                              <Typography
                                sx={{ fontSize: 11, color: "#B45309" }}
                              >
                                {(file.size / 1024).toFixed(1)} KB
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Tooltip title="Remove from queue">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteUploadFile(file.id.toString())
                            }
                            sx={{
                              color: "#92400E",
                              "&:hover": {
                                color: "#D32F2F",
                                backgroundColor: "rgba(211, 47, 47, 0.08)",
                              },
                            }}
                          >
                            <DeleteIcon size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* Empty State */}
                {evidenceFiles.length === 0 && uploadFiles.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "#6B7280",
                      border: "2px dashed #D1D5DB",
                      borderRadius: 1,
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      No evidence files uploaded yet
                    </Typography>
                    <Typography variant="caption" color="#9CA3AF">
                      Click "Add evidence files" to upload documentation for
                      this question
                    </Typography>
                  </Box>
                )}
              </Stack>
            </TabPanel>

            {/* ================================================================ */}
            {/* CROSS MAPPINGS TAB (RISKS) */}
            {/* ================================================================ */}

            <TabPanel value="cross-mappings" sx={{ padding: "15px 20px" }}>
              <Stack spacing={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Linked risks
                </Typography>
                <Typography variant="body2" color="#6B7280">
                  Link risks from your risk database to track which risks are
                  addressed by this question.
                </Typography>

                {/* Add/Remove Button */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={() => setIsLinkedRisksModalOpen(true)}
                    disabled={isEditingDisabled}
                    sx={{
                      borderRadius: 2,
                      width: 155,
                      height: 25,
                      fontSize: 11,
                      border: "1px solid #D0D5DD",
                      backgroundColor: "white",
                      color: "#344054",
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #D0D5DD",
                      },
                    }}
                  >
                    Add/remove risks
                  </Button>

                  <Stack direction="row" spacing={2}>
                    <Typography sx={{ fontSize: 11, color: "#344054" }}>
                      {`${currentRisks.length || 0} risks linked`}
                    </Typography>
                    {selectedRisks.length > 0 && (
                      <Typography sx={{ fontSize: 11, color: "#13715B" }}>
                        {`+${selectedRisks.length} pending save`}
                      </Typography>
                    )}
                    {deletedRisks.length > 0 && (
                      <Typography sx={{ fontSize: 11, color: "#D32F2F" }}>
                        {`-${deletedRisks.length} pending delete`}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                {/* Linked Risks List */}
                {linkedRiskObjects.length > 0 && (
                  <Stack spacing={1}>
                    {linkedRiskObjects
                      .filter((risk) => !deletedRisks.includes(risk.id))
                      .map((risk) => (
                        <Box
                          key={risk.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            border: "1px solid #EAECF0",
                            borderRadius: "4px",
                            backgroundColor: "#FFFFFF",
                            "&:hover": {
                              backgroundColor: "#F9FAFB",
                            },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "#1F2937",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {risk.risk_name}
                            </Typography>
                            {risk.risk_level && (
                              <Typography
                                sx={{ fontSize: 11, color: "#6B7280" }}
                              >
                                Risk level: {risk.risk_level}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="View details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewRiskDetails(risk)}
                                sx={{
                                  color: "#475467",
                                  "&:hover": {
                                    color: "#13715B",
                                    backgroundColor: "rgba(19, 113, 91, 0.08)",
                                  },
                                }}
                              >
                                <ViewIcon size={16} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Unlink risk">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setDeletedRisks((prev) => [...prev, risk.id]);
                                  handleAlertCall({
                                    variant: "info",
                                    body: "Risk marked for removal. Save to apply changes.",
                                  });
                                }}
                                disabled={isEditingDisabled}
                                sx={{
                                  color: "#475467",
                                  "&:hover": {
                                    color: "#D32F2F",
                                    backgroundColor: "rgba(211, 47, 47, 0.08)",
                                  },
                                }}
                              >
                                <DeleteIcon size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                  </Stack>
                )}

                {/* Empty State */}
                {currentRisks.length === 0 && selectedRisks.length === 0 && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "#6B7280",
                      border: "2px dashed #D1D5DB",
                      borderRadius: 1,
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      No risks linked yet
                    </Typography>
                    <Typography variant="caption" color="#9CA3AF">
                      Click "Add/remove risks" to link risks from your risk
                      database
                    </Typography>
                  </Box>
                )}

                {/* LinkedRisks Modal */}
                {isLinkedRisksModalOpen && (
                  <Suspense fallback={"Loading..."}>
                    <LinkedRisksPopup
                      onClose={() => setIsLinkedRisksModalOpen(false)}
                      currentRisks={currentRisks
                        .concat(selectedRisks)
                        .filter((risk) => !deletedRisks.includes(risk))}
                      setSelectecRisks={setSelectedRisks}
                      _setDeletedRisks={setDeletedRisks}
                      projectId={currentProjectId}
                    />
                  </Suspense>
                )}
              </Stack>
            </TabPanel>

            {/* ================================================================ */}
            {/* NOTES TAB (LAZY-LOADED) */}
            {/* ================================================================ */}

            <TabPanel value="notes" sx={{ padding: "15px 20px" }}>
              <Suspense fallback={<CircularProgress />}>
                {displayQuestion?.question_id && (
                  <NotesTab
                    key={`eu-ai-act-question-${displayQuestion.question_id}`}
                    attachedTo="EU_AI_ACT_QUESTION"
                    attachedToId={displayQuestion.question_id.toString()}
                  />
                )}
              </Suspense>
            </TabPanel>
          </TabContext>

          <Divider />

          {/* FOOTER - SAVE BUTTON */}
          <Stack
            className="eu-ai-act-question-drawer-dialog-footer"
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: "15px 20px",
              marginTop: "auto",
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isLoading ? "Saving..." : "Save"}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                minWidth: "120px",
                height: "36px",
              }}
              onClick={handleSave}
              icon={<SaveIcon size={16} />}
              isDisabled={isEditingDisabled || isLoading}
            />
          </Stack>
        </Stack>
      </Drawer>

      {/* Risk Detail Modal */}
      <StandardModal
        isOpen={isRiskDetailModalOpen && !!riskFormData}
        onClose={handleRiskDetailModalClose}
        title={`Risk: ${selectedRiskForView?.risk_name || "Risk Details"}`}
        description="View and edit risk details"
        onSubmit={() => onRiskSubmitRef.current?.()}
        submitButtonText="Update"
        maxWidth="1039px"
      >
        <Suspense fallback={<CircularProgress />}>
          <AddNewRiskForm
            closePopup={handleRiskDetailModalClose}
            popupStatus="edit"
            initialRiskValues={riskFormData}
            onSuccess={handleRiskUpdateSuccess}
            onError={(error) => {
              handleAlertCall({
                variant: "error",
                body: error?.message || "Failed to update risk",
              });
            }}
            users={users}
            onSubmitRef={onRiskSubmitRef}
          />
        </Suspense>
      </StandardModal>

      {/* ALERT */}
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </>
  );
};

export default EUAIActQuestionDrawerDialog;
