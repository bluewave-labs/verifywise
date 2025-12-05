/**
 * ISO 42001 Clause Drawer Dialog
 *
 * Tab-based drawer for managing ISO 42001 sub-clauses
 * Mirrors NIST AI RMF architecture for consistency
 *
 * Tabs:
 * - Details: Form fields (status, owner, assignments, etc.)
 * - Evidence: File management (upload, download, delete)
 * - Cross Mappings: Risk management
 * - Notes: Collaboration notes (lazy-loaded)
 */

import React, { useState, useEffect, Suspense, lazy } from "react";
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
} from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import {
  X as CloseIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Trash2 as DeleteIcon,
  Eye as ViewIcon,
  FileText as FileIcon,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

// Inputs & UI Components
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import TabBar from "../../TabBar";
import CustomizableButton from "../../Button/CustomizableButton";
import Alert from "../../Alert";

// Lazy-loaded components
const LinkedRisksPopup = lazy(() => import("../../LinkedRisks"));
const NotesTab = lazy(() => import("../../Notes/NotesTab"));

// Types & Constants
import {
  ISO42001Status,
  ISO42001_STATUS_OPTIONS,
  ISO42001ClauseDrawerProps,
  ISO42001FormData,
  FileData,
  LinkedRisk,
  AlertProps,
  ACCEPTED_FILE_TYPES,
} from "../../../pages/Framework/ISO42001/types";

// Hooks & Utilities
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { User } from "../../../../domain/types/User";
import {
  getEntityById,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import { getFileById } from "../../../../application/repository/file.repository";
import allowedRoles from "../../../../application/constants/permissions";

// Constants
export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

// ============================================================================
// COMPONENT
// ============================================================================

const ISO42001ClauseDrawerDialog: React.FC<ISO42001ClauseDrawerProps> = ({
  open,
  onClose,
  onSaveSuccess,
  clause,
  subclause,
  projectFrameworkId,
}) => {
  const { userRoleName, userId } = useAuth();
  const { users } = useUsers();

  // ========================================================================
  // STATE - UI & LOADING
  // ========================================================================

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [projectMembers, setProjectMembers] = useState<User[]>([]);

  // ========================================================================
  // STATE - FORM DATA
  // ========================================================================

  const [formData, setFormData] = useState<ISO42001FormData>({
    status: ISO42001Status.NOT_STARTED,
    implementation_description: "",
    owner: "",
    reviewer: "",
    approver: "",
    auditor_feedback: "",
  });

  const [date, setDate] = useState<Dayjs | null>(null);

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

  // ========================================================================
  // PERMISSIONS
  // ========================================================================

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

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
  // EFFECTS - INITIALIZATION
  // ========================================================================

  useEffect(() => {
    if (users?.length > 0) {
      setProjectMembers(users);
    }
  }, [users]);

  // Fetch clause data when drawer opens
  useEffect(() => {
    if (open && subclause?.id) {
      fetchClauseData();
      fetchLinkedRisks();
    }
  }, [open, subclause?.id]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const fetchClauseData = async () => {
    if (!subclause?.id) return;
    setIsLoading(true);
    try {
      const response = await getEntityById({
        routeUrl: `/iso-42001/subClause/byId/${subclause.id}?projectFrameworkId=${projectFrameworkId}`,
      });

      if (response.data) {
        setFormData({
          status: response.data.status || ISO42001Status.NOT_STARTED,
          implementation_description:
            response.data.implementation_description || "",
          owner: response.data.owner ? response.data.owner.toString() : "",
          reviewer: response.data.reviewer
            ? response.data.reviewer.toString()
            : "",
          approver: response.data.approver
            ? response.data.approver.toString()
            : "",
          auditor_feedback: response.data.auditor_feedback || "",
        });

        if (response.data.due_date) {
          setDate(dayjs(response.data.due_date));
        } else {
          setDate(null);
        }

        if (response.data.evidence_links) {
          setEvidenceFiles(response.data.evidence_links as FileData[]);
        } else {
          setEvidenceFiles([]);
        }
      }
    } catch (error) {
      console.error("Error fetching clause data:", error);
      handleAlert({
        variant: "error",
        body: "Failed to load clause data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinkedRisks = async () => {
    if (!subclause?.id) return;

    try {
      const response = await getEntityById({
        routeUrl: `/iso-42001/subclauses/${subclause.id}/risks`,
      });

      if (response.data) {
        const riskIds = response.data.map((risk: any) => risk.id);
        setCurrentRisks(riskIds);
        setLinkedRiskObjects(response.data as LinkedRisk[]);
      }
    } catch (error) {
      console.error("Error fetching linked risks:", error);
      setCurrentRisks([]);
      setLinkedRiskObjects([]);
    }
  };

  // ========================================================================
  // EVENT HANDLERS - FORM CHANGES
  // ========================================================================

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    handleFieldChange(field, event.target.value.toString());
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // ========================================================================
  // EVENT HANDLERS - ALERTS
  // ========================================================================

  const handleAlert = ({
    variant,
    body,
  }: {
    variant: "success" | "error" | "warning" | "info";
    body: string;
  }) => {
    setAlert({ variant, body });
    setTimeout(() => setAlert(null), 3000);
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
    handleAlert({
      variant: "info",
      body: `${files.length} file(s) added. Save to apply changes.`,
    });
  };

  const handleDeleteEvidenceFile = (fileId: string) => {
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      handleAlert({
        variant: "error",
        body: "Invalid file ID",
      });
      return;
    }
    setEvidenceFiles((prev) => prev.filter((f) => f.id.toString() !== fileId));
    setDeletedFiles((prev) => [...prev, fileIdNumber]);
    handleAlert({
      variant: "info",
      body: "File marked for deletion. Save to apply changes.",
    });
  };

  const handleDeleteUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
    handleAlert({
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

      handleAlert({
        variant: "success",
        body: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      handleAlert({
        variant: "error",
        body: "Failed to download file. Please try again.",
      });
    }
  };

  // ========================================================================
  // EVENT HANDLERS - RISK MANAGEMENT
  // ========================================================================

  const handleViewRiskDetails = async (risk: LinkedRisk) => {
    // This would open a detailed risk view modal
    // For now, just show info
    handleAlert({
      variant: "info",
      body: `Risk: ${risk.risk_name} (${risk.risk_level || "N/A"})`,
    });
  };

  // ========================================================================
  // EVENT HANDLERS - SAVE
  // ========================================================================

  const handleSave = async () => {
    if (!subclause?.id) {
      handleAlert({
        variant: "error",
        body: "No clause selected for update",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append("status", formData.status);
      formDataToSend.append(
        "implementation_description",
        formData.implementation_description
      );
      if (formData.owner) formDataToSend.append("owner", formData.owner);
      if (formData.reviewer)
        formDataToSend.append("reviewer", formData.reviewer);
      if (formData.approver)
        formDataToSend.append("approver", formData.approver);
      formDataToSend.append("auditor_feedback", formData.auditor_feedback);

      if (date) {
        formDataToSend.append("due_date", date.toISOString());
      }

      // Add file operations
      formDataToSend.append("user_id", userId?.toString() || "1");
      formDataToSend.append("delete", JSON.stringify(deletedFiles));

      // Add risk operations
      formDataToSend.append("risksMitigated", JSON.stringify(selectedRisks));
      formDataToSend.append("risksDelete", JSON.stringify(deletedRisks));

      // Add uploaded files
      uploadFiles.forEach((file) => {
        if (file.data instanceof Blob) {
          const fileToUpload =
            file.data instanceof File
              ? file.data
              : new File([file.data], file.fileName, { type: file.type });
          formDataToSend.append("files", fileToUpload);
        }
      });

      // Send update to API
      const response = await updateEntityById({
        routeUrl: `/iso-42001/saveClauses/${subclause.id}`,
        body: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        handleAlert({
          variant: "success",
          body: "Clause updated successfully",
        });

        // Refresh data from API
        await refreshData();

        // Reset pending states
        resetPendingState();

        onSaveSuccess?.(true, "Clause saved successfully", subclause.id);
      } else {
        throw new Error(response.data?.message || "Failed to save clause");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      handleAlert({
        variant: "error",
        body: errorMessage,
      });
      onSaveSuccess?.(false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const refreshData = async () => {
    if (!subclause?.id) return;
    // Refresh evidence files
    try {
      const clauseResponse = await getEntityById({
        routeUrl: `/iso-42001/subClause/byId/${subclause.id}?projectFrameworkId=${projectFrameworkId}`,
      });
      if (clauseResponse.data?.evidence_links) {
        setEvidenceFiles(clauseResponse.data.evidence_links);
      }
    } catch (error) {
      console.error("Error refreshing evidence files:", error);
    }

    // Refresh linked risks
    await fetchLinkedRisks();
  };

  const resetPendingState = () => {
    setUploadFiles([]);
    setDeletedFiles([]);
    setSelectedRisks([]);
    setDeletedRisks([]);
  };

  // ========================================================================
  // RENDER - LOADING STATE
  // ========================================================================

  if (isLoading && !subclause) {
    return (
      <Drawer open={open} onClose={onClose} anchor="right">
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
          <Typography sx={{ mt: 2 }}>Loading clause data...</Typography>
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
        className="iso42001-clause-drawer-dialog"
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
          className="iso42001-clause-drawer-dialog-content"
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
              {clause?.clause_no
                ? `${clause.clause_no}.${subclause?.index || 1}`
                : "Clause"}{" "}
              {subclause?.title}
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
                {/* Summary Panel */}
                {subclause?.summary && (
                  <Stack
                    sx={{
                      border: "1px solid #eee",
                      padding: "12px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography fontSize={13} sx={{ marginBottom: "8px" }}>
                      <strong>Summary:</strong>
                    </Typography>
                    <Typography fontSize={13} color="#666">
                      {subclause.summary}
                    </Typography>
                  </Stack>
                )}

                {/* Key Questions Panel */}
                {((subclause?.questions?.length ?? 0) > 0 ||
                  (subclause?.key_questions?.length ?? 0) > 0) && (
                  <Stack
                    sx={{
                      border: "1px solid #e8d5d5",
                      padding: "12px",
                      backgroundColor: "#fef5f5",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography
                      fontSize={13}
                      sx={{ marginBottom: "8px", fontWeight: 600 }}
                    >
                      Key Questions:
                    </Typography>
                    <Stack spacing={1}>
                      {(subclause?.questions || subclause?.key_questions)?.map(
                        (question, idx) => (
                          <Typography
                            key={idx}
                            fontSize={12}
                            color="#666"
                            sx={{ pl: 1, position: "relative" }}
                          >
                            • {question}
                          </Typography>
                        )
                      )}
                    </Stack>
                  </Stack>
                )}

                {/* Evidence Examples Panel */}
                {subclause?.evidence_examples &&
                  subclause?.evidence_examples.length > 0 && (
                    <Stack
                      sx={{
                        border: "1px solid #d5e8d5",
                        padding: "12px",
                        backgroundColor: "#f5fef5",
                        borderRadius: "4px",
                      }}
                    >
                      <Typography
                        fontSize={13}
                        sx={{ marginBottom: "8px", fontWeight: 600 }}
                      >
                        Evidence Examples:
                      </Typography>
                      <Stack spacing={1}>
                        {subclause.evidence_examples.map((example, idx) => (
                          <Typography
                            key={idx}
                            fontSize={12}
                            color="#666"
                            sx={{ pl: 1, position: "relative" }}
                          >
                            • {example}
                          </Typography>
                        ))}
                      </Stack>
                    </Stack>
                  )}

                {/* Implementation Description */}
                <Stack>
                  <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                    Implementation description:
                  </Typography>
                  <Field
                    type="description"
                    value={formData.implementation_description}
                    onChange={(e) =>
                      handleFieldChange(
                        "implementation_description",
                        e.target.value
                      )
                    }
                    placeholder="Describe how this requirement is implemented..."
                    disabled={isEditingDisabled}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Status & Assignments */}
              <Stack gap="24px">
                <Select
                  id="status"
                  label="Status:"
                  value={formData.status}
                  onChange={handleSelectChange("status")}
                  items={ISO42001_STATUS_OPTIONS.map((status) => ({
                    _id: status.id,
                    name: status.name,
                  }))}
                  sx={inputStyles}
                  placeholder="Select status"
                  disabled={isEditingDisabled}
                />

                <Select
                  id="Owner"
                  label="Owner:"
                  value={formData.owner ? parseInt(formData.owner) : ""}
                  onChange={handleSelectChange("owner")}
                  items={projectMembers.map((user) => ({
                    _id: user.id,
                    name: `${user.name}`,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder="Select owner"
                  disabled={isEditingDisabled}
                />

                <Select
                  id="Reviewer"
                  label="Reviewer:"
                  value={formData.reviewer ? parseInt(formData.reviewer) : ""}
                  onChange={handleSelectChange("reviewer")}
                  items={projectMembers.map((user) => ({
                    _id: user.id,
                    name: `${user.name}`,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder="Select reviewer"
                  disabled={isEditingDisabled}
                />

                <Select
                  id="Approver"
                  label="Approver:"
                  value={formData.approver ? parseInt(formData.approver) : ""}
                  onChange={handleSelectChange("approver")}
                  items={projectMembers.map((user) => ({
                    _id: user.id,
                    name: `${user.name}`,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder="Select approver"
                  disabled={isEditingDisabled}
                />

                <DatePicker
                  label="Due date:"
                  sx={inputStyles}
                  date={date}
                  disabled={isEditingDisabled}
                  handleDateChange={(newDate) => {
                    setDate(newDate);
                  }}
                />

                <Stack>
                  <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                    Auditor feedback:
                  </Typography>
                  <Field
                    type="description"
                    value={formData.auditor_feedback}
                    onChange={(e) =>
                      handleFieldChange("auditor_feedback", e.target.value)
                    }
                    placeholder="Enter audit feedback..."
                    disabled={isAuditingDisabled}
                  />
                </Stack>
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
                  Upload evidence files to document how this requirement is
                  implemented.
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
                    {evidenceFiles.map((file) => (
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
                      this requirement
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
                  being addressed by this implementation.
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      width: 155,
                      height: 25,
                      fontSize: 11,
                      border: "1px solid #D0D5DD",
                      backgroundColor: "white",
                      color: "#344054",
                    }}
                    onClick={() => setIsLinkedRisksModalOpen(true)}
                    disabled={isEditingDisabled}
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
                                  handleAlert({
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
                      frameworkId={2}
                      isOrganizational={true}
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
                {subclause?.id && (
                  <NotesTab
                    key={`iso42001-clause-${subclause.id}`}
                    attachedTo="ISO_42001_CLAUSE"
                    attachedToId={subclause.id.toString()}
                  />
                )}
              </Suspense>
            </TabPanel>
          </TabContext>

          <Divider />

          {/* FOOTER - SAVE BUTTON */}
          <Stack
            className="iso42001-clause-drawer-dialog-footer"
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
              text="Save"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                minWidth: "120px",
                height: "36px",
              }}
              onClick={handleSave}
              icon={<SaveIcon size={16} />}
            />
          </Stack>
        </Stack>
      </Drawer>

      {/* ALERT */}
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </>
  );
};

export default ISO42001ClauseDrawerDialog;
