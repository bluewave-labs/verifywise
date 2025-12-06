import {
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  CircularProgress,
  SelectChangeEvent,
  Dialog,
  useTheme,
  Box,
  IconButton,
  Tooltip,
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
import Field from "../../Inputs/Field";
import { FileData } from "../../../../domain/types/File";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { Dayjs } from "dayjs";
import { useState, useEffect, Suspense, lazy, useRef } from "react";
import CustomizableButton from "../../Button/CustomizableButton";
import TabBar from "../../TabBar";
const NotesTab = lazy(() => import("../../Notes/NotesTab"));
const AddNewRiskForm = lazy(() => import("../../AddNewRiskForm"));
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { User } from "../../../../domain/types/User";
import Alert from "../../Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import {
  updateEntityById,
  getEntityById,
} from "../../../../application/repository/entity.repository";
import { getFileById } from "../../../../application/repository/file.repository";
import StandardModal from "../../Modals/StandardModal";
import allowedRoles from "../../../../application/constants/permissions";
import AuditRiskPopup from "../../RiskPopup/AuditRiskPopup";
const LinkedRisksPopup = lazy(() => import("../../LinkedRisks"));
import { ISO27001GetSubClauseById } from "../../../../application/repository/subClause_iso.repository";

export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

interface VWISO27001ClauseDrawerDialogProps {
  open: boolean;
  onClose: (event?: any, reason?: string) => void;
  subClause: any;
  clause: any;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
  projectFrameworkId: number;
  onSaveSuccess?: (success: boolean, message?: string) => void;
  index: number;
  project_id: number;
}

const VWISO27001ClauseDrawerDialog = ({
  open,
  onClose,
  subClause,
  clause,
  projectFrameworkId,
  onSaveSuccess,
  index,
  project_id,
}: VWISO27001ClauseDrawerDialogProps) => {
  const { userId, userRoleName } = useAuth();
  const { users } = useUsers();

  // ========================================================================
  // STATE - UI & LOADING
  // ========================================================================

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const theme = useTheme();

  // ========================================================================
  // STATE - FORM DATA
  // ========================================================================

  const [fetchedSubClause, setFetchedSubClause] = useState<any>(null);
  const [formData, setFormData] = useState({
    implementation_description: "",
    status: "",
    owner: "",
    reviewer: "",
    approver: "",
    auditor_feedback: "",
    risks: [] as number[],
  });
  const [date, setDate] = useState<Dayjs | null>(null);

  // ========================================================================
  // STATE - EVIDENCE FILES
  // ========================================================================

  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);

  // ========================================================================
  // STATE - RISKS
  // ========================================================================

  const [currentRisks, setCurrentRisks] = useState<number[]>([]);
  const [linkedRiskObjects, setLinkedRiskObjects] = useState<any[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] = useState(false);

  // Risk detail modal state
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState(false);
  const [selectedRiskForView, setSelectedRiskForView] = useState<any | null>(
    null
  );
  const [riskFormData, setRiskFormData] = useState<any>(null);
  const onRiskSubmitRef = useRef<(() => void) | null>(null);

  // Audit status modal
  const [auditedStatusModalOpen, setAuditedStatusModalOpen] =
    useState<boolean>(false);

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
    { label: "Details", value: "details", icon: "FileText" as const },
    { label: "Evidence", value: "evidence", icon: "FolderOpen" as const },
    { label: "Cross mappings", value: "cross-mappings", icon: "Link" as const },
    { label: "Notes", value: "notes", icon: "MessageSquare" as const },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // ========================================================================
  // STATUS MAPPING
  // ========================================================================

  const statusIdMap = new Map([
    ["Not started", "0"],
    ["Draft", "1"],
    ["In progress", "2"],
    ["Awaiting review", "3"],
    ["Awaiting approval", "4"],
    ["Implemented", "5"],
    ["Needs rework", "6"],
  ]);
  const idStatusMap = new Map();
  for (const [status, id] of statusIdMap.entries()) {
    idStatusMap.set(id, status);
  }

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
    if (open && subClause?.id) {
      fetchSubClauseData();
      fetchLinkedRisks();
    }
  }, [open, subClause?.id, projectFrameworkId]);

  // Initialize risk state from formData
  useEffect(() => {
    if (formData.risks && formData.risks.length > 0) {
      setCurrentRisks(formData.risks);
    } else {
      setCurrentRisks([]);
    }
  }, [formData.risks]);

  // Fetch linked risk objects when risks change
  useEffect(() => {
    if (open && fetchedSubClause?.id) {
      fetchLinkedRisks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetchedSubClause?.id, formData.risks, selectedRisks, deletedRisks]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const fetchSubClauseData = async () => {
    if (!subClause?.id) return;
    setIsLoading(true);
    try {
      const response = await ISO27001GetSubClauseById({
        routeUrl: `/iso-27001/subClause/byId/${subClause.id}?projectFrameworkId=${projectFrameworkId}`,
      });

      const subClauseData = response.data;
      setFetchedSubClause(subClauseData);

      if (subClauseData) {
        const statusId = statusIdMap.get(subClauseData.status) || "0";
        setFormData({
          implementation_description:
            subClauseData.implementation_description || "",
          status: statusId,
          owner: subClauseData.owner?.toString() || "",
          reviewer: subClauseData.reviewer?.toString() || "",
          approver: subClauseData.approver?.toString() || "",
          auditor_feedback: subClauseData.auditor_feedback || "",
          risks: subClauseData.risks || [],
        });

        if (subClauseData.due_date) {
          setDate(subClauseData.due_date);
        } else {
          setDate(null);
        }

        if (subClauseData.evidence_links) {
          setEvidenceFiles(subClauseData.evidence_links);
        } else {
          setEvidenceFiles([]);
        }
      }
    } catch (error) {
      console.error("Error fetching subclause:", error);
      handleAlert({
        variant: "error",
        body: "Failed to load clause data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinkedRisks = async () => {
    if (!fetchedSubClause?.id) return;

    const allRiskIds = [...(formData.risks || []), ...selectedRisks].filter(
      (id) => !deletedRisks.includes(id)
    );

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
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange =
    (field: string) => (event: SelectChangeEvent<string | number>) => {
      const value = event.target.value.toString();
      if (
        field === "status" &&
        value === "6" &&
        (selectedRisks.length > 0 ||
          formData.risks.length > 0 ||
          (formData.risks.length > 0 &&
            deletedRisks.length === formData.risks.length))
      ) {
        setAuditedStatusModalOpen(true);
      }
      handleFieldChange(field, value);
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
    setDeletedFilesIds((prev) => [...prev, fileIdNumber]);
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

  const handleViewRiskDetails = async (risk: any) => {
    setSelectedRiskForView(risk);
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/${risk.id}`,
      });
      if (response.data) {
        const riskData = response.data;
        setRiskFormData({
          riskName: riskData.risk_name || "",
          actionOwner: riskData.action_owner || 0,
          aiLifecyclePhase: riskData.ai_lifecycle_phase || 0,
          riskDescription: riskData.risk_description || "",
          riskCategory: riskData.risk_category || [1],
          potentialImpact: riskData.potential_impact || "",
          assessmentMapping: riskData.assessment_mapping || 0,
          controlsMapping: riskData.controls_mapping || 0,
          likelihood: riskData.likelihood || 1,
          riskSeverity: riskData.risk_severity || 1,
          riskLevel: riskData.risk_level || 0,
          reviewNotes: riskData.review_notes || "",
          applicableProjects: riskData.applicable_projects || [],
          applicableFrameworks: riskData.applicable_frameworks || [],
        });
        setIsRiskDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching risk details:", error);
      handleAlert({
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
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
    });
    // Refresh linked risks after update
    if (fetchedSubClause?.id) {
      fetchLinkedRisks();
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const refreshData = async () => {
    if (!fetchedSubClause?.id) return;
    // Refresh evidence files
    try {
      const response = await ISO27001GetSubClauseById({
        routeUrl: `/iso-27001/subClause/byId/${fetchedSubClause.id}?projectFrameworkId=${projectFrameworkId}`,
      });
      if (response.data?.evidence_links) {
        setEvidenceFiles(response.data.evidence_links);
      }
    } catch (error) {
      console.error("Error refreshing evidence files:", error);
    }

    // Refresh linked risks
    await fetchLinkedRisks();
  };

  const resetPendingState = () => {
    setUploadFiles([]);
    setDeletedFilesIds([]);
    setSelectedRisks([]);
    setDeletedRisks([]);
  };

  // ========================================================================
  // EVENT HANDLERS - SAVE
  // ========================================================================

  const handleSave = async () => {
    if (!fetchedSubClause?.id) {
      handleAlert({
        variant: "error",
        body: "No clause selected for update",
      });
      return;
    }
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
        "implementation_description",
        formData.implementation_description
      );
      formDataToSend.append(
        "status",
        idStatusMap.get(formData.status) || "Not started"
      );
      formDataToSend.append("owner", formData.owner);
      formDataToSend.append("reviewer", formData.reviewer);
      formDataToSend.append("approver", formData.approver);
      formDataToSend.append("auditor_feedback", formData.auditor_feedback);
      if (date) formDataToSend.append("due_date", date.toString());
      formDataToSend.append("user_id", userId?.toString() || "1");
      formDataToSend.append("delete", JSON.stringify(deletedFilesIds));
      formDataToSend.append("risksMitigated", JSON.stringify(selectedRisks));
      formDataToSend.append("risksDelete", JSON.stringify(deletedRisks));
      formDataToSend.append("project_id", project_id.toString());

      uploadFiles.forEach((file) => {
        if (file.data instanceof Blob) {
          const fileToUpload =
            file.data instanceof File
              ? file.data
              : new File([file.data!], file.fileName, {
                  type: file.type,
                });
          formDataToSend.append("files", fileToUpload);
        }
      });
      const response = await updateEntityById({
        routeUrl: `/iso-27001/saveClauses/${fetchedSubClause.id}`,
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

        onSaveSuccess?.(true, "Clause saved successfully");
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
  // RENDER - LOADING STATE
  // ========================================================================

  const displayData = fetchedSubClause || subClause;
  if (isLoading) {
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
          <Typography sx={{ mt: 2 }}>Loading subclause data...</Typography>
        </Stack>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        className="vw-iso-27001-clause-drawer-dialog"
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
          className="vw-iso-27001-clause-drawer-dialog-content"
          sx={{
            width: 600,
          }}
        >
          <Stack
            sx={{
              width: 600,
              padding: "15px 20px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography fontSize={15} fontWeight={700}>
              {clause?.arrangement + "." + (index + 1)} {displayData?.title}
            </Typography>
            <CloseIcon
              size={20}
              onClick={onClose}
              style={{ cursor: "pointer" }}
            />
          </Stack>
          <Divider />
          <TabContext value={activeTab}>
            <Box sx={{ padding: "0 20px" }}>
              <TabBar
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
              />
            </Box>

            <TabPanel value="details" sx={{ padding: "15px 20px", gap: "15px" }}>
              <Stack gap="15px">
                {/* Requirement Summary Panel */}
                {displayData?.requirement_summary && (
                  <Stack
                    sx={{
                      border: "1px solid #eee",
                      padding: "12px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography fontSize={13} sx={{ marginBottom: "8px" }}>
                      <strong>Requirement Summary:</strong>
                    </Typography>
                    <Typography fontSize={13} color="#666">
                      {displayData.requirement_summary}
                    </Typography>
                  </Stack>
                )}

                {/* Key Questions Panel */}
                {displayData?.key_questions && displayData.key_questions.length > 0 && (
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
                      {displayData.key_questions.map((question: any, idx: any) => (
                        <Typography
                          key={idx}
                          fontSize={12}
                          color="#666"
                          sx={{ pl: 1, position: "relative" }}
                        >
                          • {question}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                )}

                {/* Evidence Examples Panel */}
                {displayData?.evidence_examples &&
                  displayData.evidence_examples.length > 0 && (
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
                        {displayData.evidence_examples.map(
                          (example: any, idx: any) => (
                            <Typography
                              key={idx}
                              fontSize={12}
                              color="#666"
                              sx={{ pl: 1, position: "relative" }}
                            >
                              • {example}
                            </Typography>
                          )
                        )}
                      </Stack>
                    </Stack>
                  )}

                {/* Implementation Description */}
                <Stack>
                  <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                    Implementation Description:
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
                    sx={{
                      cursor: "text",
                      "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                        {
                          height: "73px",
                        },
                    }}
                    placeholder="Describe how this requirement is implemented"
                    disabled={isEditingDisabled}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack gap={"24px"}>

                <Select
                  id="status"
                  label="Status:"
                  value={formData.status}
                  onChange={handleSelectChange("status")}
                  items={[
                    { _id: "0", name: "Not started" },
                    { _id: "1", name: "Draft" },
                    { _id: "2", name: "In progress" },
                    { _id: "3", name: "Awaiting review" },
                    { _id: "4", name: "Awaiting approval" },
                    { _id: "5", name: "Implemented" },
                    // { _id: "6", name: "Audited" },
                    { _id: "6", name: "Needs rework" },
                  ]}
                  sx={inputStyles}
                  placeholder={"Select status"}
                  disabled={isEditingDisabled}
                />

                <Select
                  id="Owner"
                  label="Owner:"
                  value={formData.owner || ""}
                  onChange={handleSelectChange("owner")}
                  items={projectMembers.map((user) => ({
                    _id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder={"Select owner"}
                  disabled={isEditingDisabled}
                  getOptionValue={(item) => item._id}
                />

                <Select
                  id="Reviewer"
                  label="Reviewer:"
                  value={formData.reviewer || ""}
                  onChange={handleSelectChange("reviewer")}
                  items={projectMembers.map((user) => ({
                    _id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder={"Select reviewer"}
                  disabled={isEditingDisabled}
                  getOptionValue={(item) => item._id}
                />

                <Select
                  id="Approver"
                  label="Approver:"
                  value={formData.approver || ""}
                  onChange={handleSelectChange("approver")}
                  items={projectMembers.map((user) => ({
                    _id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    surname: user.surname,
                  }))}
                  sx={inputStyles}
                  placeholder={"Select approver"}
                  disabled={isEditingDisabled}
                  getOptionValue={(item) => item._id}
                />

                <DatePicker
                  label="Due date:"
                  sx={inputStyles}
                  date={date}
                  handleDateChange={(newDate) => {
                    setDate(newDate);
                  }}
                  disabled={isEditingDisabled}
                />

                <Stack>
                  <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                    Auditor Feedback:
                  </Typography>
                  <Field
                    type="description"
                    value={formData.auditor_feedback}
                    onChange={(e) =>
                      handleFieldChange("auditor_feedback", e.target.value)
                    }
                    sx={{
                      cursor: "text",
                      "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                        {
                          height: "73px",
                        },
                    }}
                    placeholder="Enter any feedback from the internal or external audits..."
                    disabled={isAuditingDisabled}
                  />
                </Stack>
              </Stack>
            </TabPanel>

            {/* Tab 2: Evidence */}
            <TabPanel value="evidence" sx={{ padding: "15px 20px" }}>
              <Stack spacing={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Evidence files
                </Typography>
                <Typography variant="body2" color="#6B7280">
                  Upload evidence files to document compliance with this
                  requirement.
                </Typography>

                {/* File Input */}
                <Box>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style={{ display: "none" }}
                    id="evidence-file-input"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleAddFiles(files);
                        e.target.value = "";
                      }
                    }}
                  />
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      onClick={() =>
                        document.getElementById("evidence-file-input")?.click()
                      }
                      disabled={isEditingDisabled}
                      sx={{
                        borderRadius: 2,
                        minWidth: 155,
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
                      disableRipple={
                        theme.components?.MuiButton?.defaultProps?.disableRipple
                      }
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
                      {deletedFilesIds.length > 0 && (
                        <Typography sx={{ fontSize: 11, color: "#D32F2F" }}>
                          {`-${deletedFilesIds.length} pending delete`}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>

                {/* Existing Files List */}
                {evidenceFiles.length > 0 && (
                  <Stack spacing={1}>
                    {evidenceFiles
                      .filter(
                        (file) =>
                          !deletedFilesIds.includes(
                            parseInt(file.id.toString())
                          )
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
                                  {((file.size || 0) / 1024).toFixed(1)} KB
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

                {/* Pending Upload Files */}
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
                                {((file.size || 0) / 1024).toFixed(1)} KB
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

            {/* Tab 3: Cross Mappings */}
            <TabPanel value="cross-mappings" sx={{ padding: "15px 20px" }}>
              <Stack spacing={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Linked risks
                </Typography>
                <Typography variant="body2" color="#6B7280">
                  Link risks from your risk database to track which risks are
                  addressed by this requirement.
                </Typography>

                {/* Add/Remove Button */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={() => setIsLinkedRisksModalOpen(true)}
                    disabled={isEditingDisabled}
                    sx={{
                      borderRadius: 2,
                      minWidth: 155,
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
                    disableRipple={
                      theme.components?.MuiButton?.defaultProps?.disableRipple
                    }
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
                      border: "2px dashed #D0D5DD",
                      borderRadius: "4px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#FAFBFC",
                    }}
                  >
                    <Typography sx={{ color: "#6B7280" }}>
                      No risks linked yet
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
                      frameworkId={3}
                      isOrganizational={true}
                    />
                  </Suspense>
                )}
              </Stack>
            </TabPanel>

            {/* Tab 4: Notes */}
            <TabPanel value="notes" sx={{ padding: "15px 20px" }}>
              <Suspense fallback={<CircularProgress />}>
                {fetchedSubClause?.id && (
                  <NotesTab
                    key={`iso27001-clause-${fetchedSubClause.id}`}
                    attachedTo="ISO_27001_CLAUSE"
                    attachedToId={fetchedSubClause.id.toString()}
                  />
                )}
              </Suspense>
            </TabPanel>
          </TabContext>
          <Divider />
          <Stack
            className="vw-iso-27001-clause-drawer-dialog-footer"
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: "15px 20px",
            }}
          >
            <CustomizableButton
              variant="contained"
              text="Save"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleSave}
              icon={<SaveIcon size={16} />}
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
              handleAlert({
                variant: "error",
                body: error?.message || "Failed to update risk",
              });
            }}
            users={users}
            onSubmitRef={onRiskSubmitRef}
          />
        </Suspense>
      </StandardModal>

      {/* Audit Risk Dialog */}
      <Dialog
        open={auditedStatusModalOpen}
        onClose={() => setAuditedStatusModalOpen(false)}
        PaperProps={{
          sx: {
            width: "800px",
            maxWidth: "800px",
          },
        }}
      >
        <Suspense fallback={"Loading..."}>
          <AuditRiskPopup
            onClose={() => setAuditedStatusModalOpen(false)}
            risks={formData.risks.concat(selectedRisks)}
            _deletedRisks={deletedRisks}
            _setDeletedRisks={setDeletedRisks}
            _selectedRisks={selectedRisks}
            _setSelectedRisks={setSelectedRisks}
          />
        </Suspense>
      </Dialog>

      {/* Alert */}
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </>
  );
};

export default VWISO27001ClauseDrawerDialog;
