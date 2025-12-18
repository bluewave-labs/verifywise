import {
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  CircularProgress,
  Dialog,
  useTheme,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { FileData } from "../../../../domain/types/File";
import {
  X as CloseIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Trash2 as DeleteIcon,
  Eye as ViewIcon,
  FileText as FileIcon,
} from "lucide-react";
import Checkbox from "../../Inputs/Checkbox";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import TabBar from "../../TabBar";
import StandardModal from "../../Modals/StandardModal";
import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomizableButton from "../../Button/CustomizableButton";
import { User } from "../../../../domain/types/User";
import {
  GetAnnexCategoriesById,
  UpdateAnnexCategoryById,
} from "../../../../application/repository/annexCategory_iso.repository";
import { AnnexCategoryISO } from "../../../../domain/types/AnnexCategoryISO";
import { STATUSES } from "../../../../domain/types/Status";
import Alert from "../../Alert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../domain/interfaces/i.alert";
import allowedRoles from "../../../../application/constants/permissions";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";
import { getFileById } from "../../../../application/repository/file.repository";
import { getEntityById } from "../../../../application/repository/entity.repository";

const AuditRiskPopup = lazy(() => import("../../RiskPopup/AuditRiskPopup"));
const LinkedRisksPopup = lazy(() => import("../../LinkedRisks"));
const NotesTab = lazy(() => import("../../Notes/NotesTab"));
const AddNewRiskForm = lazy(() => import("../../AddNewRiskForm"));

interface Control {
  id: number;
  control_no: number;
  control_subSection: number;
  title: string;
  shortDescription: string;
  guidance: string;
  status: string;
}

interface LinkedRisk {
  id: number;
  risk_name: string;
  risk_level: string;
  description?: string;
  [key: string]: any;
}

interface VWISO42001ClauseDrawerDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  control: Control;
  annex: AnnexCategoryISO;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
  projectFrameworkId: number;
  project_id: number;
  onSaveSuccess?: (success: boolean, message?: string) => void;
}

const VWISO42001AnnexDrawerDialog = ({
  title,
  open,
  onClose,
  control,
  annex,
  projectFrameworkId,
  project_id,
  onSaveSuccess,
}: VWISO42001ClauseDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [fetchedAnnex, setFetchedAnnex] = useState<AnnexCategoryISO>();
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] =
    useState<boolean>(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const theme = useTheme();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
  const [auditedStatusModalOpen, setAuditedStatusModalOpen] =
    useState<boolean>(false);

  // Tab management state
  const [activeTab, setActiveTab] = useState("details");
  const [currentRisks, setCurrentRisks] = useState<number[]>([]);
  const [linkedRiskObjects, setLinkedRiskObjects] = useState<LinkedRisk[]>([]);
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState(false);
  const [selectedRiskForView, setSelectedRiskForView] = useState<LinkedRisk | null>(null);
  const [riskFormData, setRiskFormData] = useState<any>(null);
  const onRiskSubmitRef = useRef<(() => void) | null>(null);

  const { userId, userRoleName } = useAuth();
  const { users } = useUsers();

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

  // Tab configuration
  const tabs = [
    { label: "Details", value: "details", icon: "FileText" as const },
    { label: "Evidence", value: "evidence", icon: "FolderOpen" as const },
    { label: "Cross mappings", value: "cross-mappings", icon: "Link" as const },
    // { label: "Notes", value: "notes", icon: "MessageSquare" as const },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Add state for all form fields
  const [formData, setFormData] = useState({
    guidance: "",
    is_applicable: false,
    justification_for_exclusion: "",
    implementation_description: "",
    status: "",
    owner: "",
    reviewer: "",
    approver: "",
    auditor_feedback: "",
    risks: [] as number[],
  });

  // Filter users to only show project members
  useEffect(() => {
    if (users?.length > 0) {
      // Since we don't have project data, use all users
      setProjectMembers(users);
    }
  }, [users]);

  // File management functions
  const handleAddFiles = (files: File[]) => {
    const newFiles: FileData[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      fileName: file.name,
      size: file.size,
      type: file.type,
      data: file,
      uploadDate: new Date().toISOString(),
      uploader: userId?.toString() || "1",
    }));

    setUploadFiles([...uploadFiles, ...newFiles]);
    handleAlert({
      variant: "info",
      body: "Please save the changes to upload the files.",
      setAlert,
    });
  };

  const handleDeleteFile = (fileId: number | string) => {
    const fileIdNumber = typeof fileId === "number" ? fileId : parseInt(fileId);

    if (evidenceFiles.some((file) => file.id === fileId)) {
      setEvidenceFiles(evidenceFiles.filter((file) => file.id !== fileId));
      setDeletedFilesIds([...deletedFilesIds, fileIdNumber]);
    } else {
      setUploadFiles(uploadFiles.filter((file) => file.id !== fileId));
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const response = await getFileById({
        id: fileId.toString(),
        responseType: "arraybuffer",
      });

      const blob = new Blob([response], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      handleAlert({
        variant: "error",
        body: "Failed to download file",
        setAlert,
      });
    }
  };

  // Risk management functions
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
      handleAlert({
        variant: "error",
        body: "Failed to load risk details",
        setAlert,
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
    // Refresh linked risks
    if (fetchedAnnex?.id) {
      fetchLinkedRisks();
    }
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
      setAlert,
    });
  };

  const fetchLinkedRisks = async () => {
    if (!fetchedAnnex?.id) return;

    try {
      const response = await getEntityById({
        routeUrl: `/iso-42001/annexCategories/${fetchedAnnex.id}/risks`,
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

  const handleUnlinkRisk = (riskId: number) => {
    if (!deletedRisks.includes(riskId)) {
      setDeletedRisks([...deletedRisks, riskId]);
    }
  };

  useEffect(() => {
    const fetchAnnexCategory = async () => {
      if (open && annex?.id) {
        setIsLoading(true);
        try {
          const response: any = await GetAnnexCategoriesById({
            routeUrl: `/iso-42001/annexCategory/byId/${control.id}?projectFrameworkId=${projectFrameworkId}`,
          });
          setFetchedAnnex(response.data);

          // Initialize form data with fetched values
          if (response.data) {
            setFormData({
              guidance: response.data.guidance || "",
              is_applicable: response.data.is_applicable ?? false,
              justification_for_exclusion:
                response.data.justification_for_exclusion || "",
              implementation_description:
                response.data.implementation_description || "",
              status: response.data.status || "",
              owner: response.data.owner?.toString() || "",
              reviewer: response.data.reviewer?.toString() || "",
              approver: response.data.approver?.toString() || "",
              auditor_feedback: response.data.auditor_feedback || "",
              risks: response.data.risks || [],
            });
            // Set the date if it exists in the fetched data
            if (response.data.due_date) {
              setDate(dayjs(response.data.due_date));
            }
          }

          // On annex category fetch, set evidence files if available
          if (response.data.evidence_links) {
            setEvidenceFiles(response.data.evidence_links as FileData[]);
          }
        } catch (error) {
          console.error("Error fetching annex category:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAnnexCategory();
  }, [open, annex?.id, projectFrameworkId]);

  // Fetch linked risks when drawer opens and annex is loaded
  useEffect(() => {
    if (open && fetchedAnnex?.id) {
      fetchLinkedRisks();
    }
  }, [open, fetchedAnnex?.id]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    const value = event.target.value.toString();
    if (
      field === "status" &&
      value === "Implemented" &&
      (selectedRisks.length > 0 ||
        formData.risks.length > 0 ||
        (formData.risks.length > 0 &&
          deletedRisks.length === formData.risks.length))
    ) {
      setAuditedStatusModalOpen(true);
    }
    handleFieldChange(field, value);
  };

  // Add handleSave function before the return statement
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("is_applicable", formData.is_applicable.toString());
      formDataToSend.append(
        "justification_for_exclusion",
        formData.justification_for_exclusion
      );
      formDataToSend.append(
        "implementation_description",
        formData.implementation_description
      );
      formDataToSend.append("status", formData.status);
      formDataToSend.append("owner", formData.owner);
      formDataToSend.append("reviewer", formData.reviewer);
      formDataToSend.append("approver", formData.approver);
      formDataToSend.append("auditor_feedback", formData.auditor_feedback);
      if (date) formDataToSend.append("due_date", date.toString());
      formDataToSend.append("user_id", userId?.toString() || "1");
      formDataToSend.append("project_id", project_id.toString());
      formDataToSend.append("delete", JSON.stringify(deletedFilesIds));
      formDataToSend.append("risksMitigated", JSON.stringify(selectedRisks));
      formDataToSend.append("risksDelete", JSON.stringify(deletedRisks));
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

      if (!fetchedAnnex) {
        console.error("Fetched annex is undefined");
        handleAlert({
          variant: "error",
          body: "Error: Annex data not found",
          setAlert,
        });
        onSaveSuccess?.(false, "Error: Annex data not found");
        return;
      }

      // Call the update API
      const response = await UpdateAnnexCategoryById({
        routeUrl: `/iso-42001/saveAnnexes/${fetchedAnnex.id}`,
        body: formDataToSend,
      });

      if (response.status === 200) {
        handleAlert({
          variant: "success",
          body: "Annex category saved successfully",
          setAlert,
        });
        onSaveSuccess?.(true, "Annex category saved successfully");
        
        // Refresh linked risks after saving
        if (fetchedAnnex?.id) {
          await fetchLinkedRisks();
        }
        
        onClose();
      } else {
        throw new Error("Failed to save annex category");
      }
    } catch (error) {
      console.error("Error saving annex category:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while saving changes";
      handleAlert({
        variant: "error",
        body: errorMessage,
        setAlert,
      });
      onSaveSuccess?.(false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Typography sx={{ mt: 2 }}>Loading annex category data...</Typography>
        </Stack>
      </Drawer>
    );
  }

  return (
    <Drawer
      id={`vw-iso-42001-annex-drawer-dialog-${annex?.id}`}
      className="vw-iso-42001-annex-drawer-dialog"
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
        className="vw-iso-42001-annex-drawer-dialog-content"
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
            {title}
          </Typography>
          <CloseIcon size={20} onClick={onClose} style={{ cursor: "pointer" }} />
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

          {/* Tab 1: Details */}
          <TabPanel value="details" sx={{ padding: "15px 20px" }}>
            <Stack gap="15px">
              {/* Guidance Panel */}
              <Stack
                className="vw-iso-42001-annex-drawer-dialog-content-annex-guidance"
                sx={{
                  border: `1px solid #eee`,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                <Typography fontSize={13}>
                  <strong>Guidance:</strong> {formData.guidance}
                </Typography>
              </Stack>

              {/* Applicability Section */}
              <Stack
                className="vw-iso-42001-annex-drawer-dialog-applicability"
                sx={{
                  gap: "15px",
                }}
              >
                <Typography fontSize={13}>Applicability:</Typography>
                <Stack sx={{ display: "flex", flexDirection: "row", gap: 10 }}>
                  <Checkbox
                    id={`${control?.id}-iso-42001-applicable`}
                    label="Applicable"
                    isChecked={formData.is_applicable}
                    value={"Applicable"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_applicable: true,
                        justification_for_exclusion: "",
                      }))
                    }
                    size="small"
                    isDisabled={isEditingDisabled}
                  />
                  <Checkbox
                    id={`${control?.id}-iso-42001-not-applicable`}
                    label="Not applicable"
                    isChecked={!formData.is_applicable}
                    value={"Not Applicable"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_applicable: false,
                      }))
                    }
                    size="small"
                    isDisabled={isEditingDisabled}
                  />
                </Stack>
              </Stack>

              {/* Justification Field */}
              <Stack
                sx={{
                  opacity: formData.is_applicable ? 0.5 : 1,
                  pointerEvents: formData.is_applicable ? "none" : "auto",
                }}
              >
                <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                  {"Justification for Exclusion (if Not Applicable)"}:
                </Typography>
                <Field
                  type="description"
                  value={formData.justification_for_exclusion}
                  onChange={(e) =>
                    handleFieldChange("justification_for_exclusion", e.target.value)
                  }
                  disabled={formData.is_applicable || isEditingDisabled}
                  sx={{
                    cursor: formData.is_applicable ? "not-allowed" : "text",
                    "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                      {
                        height: "73px",
                      },
                  }}
                  placeholder="Required if control is not applicable..."
                />
              </Stack>

              {/* Implementation Description */}
              <Stack
                sx={{
                  opacity: formData.is_applicable ? 1 : 0.5,
                  pointerEvents: formData.is_applicable ? "auto" : "none",
                }}
              >
                <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                  Implementation Description:
                </Typography>
                <Field
                  type="description"
                  value={formData.implementation_description}
                  onChange={(e) =>
                    handleFieldChange("implementation_description", e.target.value)
                  }
                  disabled={!formData.is_applicable || isEditingDisabled}
                  sx={{
                    cursor: !formData.is_applicable ? "not-allowed" : "text",
                    "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                      {
                        height: "73px",
                      },
                  }}
                  placeholder="Describe how this requirement is implemented"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Status & Assignments Section */}
              <Stack
                sx={{
                  opacity: formData.is_applicable ? 1 : 0.5,
                  pointerEvents: formData.is_applicable ? "auto" : "none",
                }}
                gap={"24px"}
              >
                <Select
                  id="status"
                  label="Status:"
                  value={formData.status}
                  onChange={handleSelectChange("status")}
                  items={STATUSES.map((status) => ({
                    _id: status,
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                  }))}
                  disabled={!formData.is_applicable || isEditingDisabled}
                  sx={inputStyles}
                  placeholder={"Select status"}
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
                  disabled={!formData.is_applicable || isEditingDisabled}
                  sx={inputStyles}
                  placeholder={"Select owner"}
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
                  disabled={!formData.is_applicable || isEditingDisabled}
                  sx={inputStyles}
                  placeholder={"Select reviewer"}
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
                  disabled={!formData.is_applicable || isEditingDisabled}
                  sx={inputStyles}
                  placeholder={"Select approver"}
                />

                <DatePicker
                  label="Due date:"
                  sx={inputStyles}
                  date={date}
                  disabled={!formData.is_applicable || isEditingDisabled}
                  handleDateChange={(newDate) => {
                    setDate(newDate);
                  }}
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
                    disabled={!formData.is_applicable || isAuditingDisabled}
                    sx={{
                      cursor: !formData.is_applicable ? "not-allowed" : "text",
                      "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                        {
                          height: "73px",
                        },
                    }}
                    placeholder="Enter any feedback from the internal or external audits..."
                  />
                </Stack>
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
                Upload evidence files to document how this requirement is implemented.
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
                  {evidenceFiles.map((file) => (
                    <Box
                      key={file.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #D0D5DD",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        backgroundColor: "#FAFBFC",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <FileIcon size={18} color="#475467" />
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {file.fileName}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                            {((file.size || 0) / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Download file">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDownloadFile(
                                typeof file.id === "number" ? file.id : parseInt(file.id.toString()),
                                file.fileName
                              )
                            }
                          >
                            <DownloadIcon size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete file">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFile(file.id)}
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
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>
                    Pending upload
                  </Typography>
                  {uploadFiles.map((file) => (
                    <Box
                      key={file.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #FCD34D",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        backgroundColor: "#FFFBEB",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <FileIcon size={18} color="#92400E" />
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {file.fileName}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                            {((file.size || 0) / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => handleDeleteFile(file.id)}>
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
                    border: "2px dashed #D0D5DD",
                    borderRadius: "4px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAFBFC",
                  }}
                >
                  <Typography sx={{ color: "#6B7280" }}>
                    No evidence files uploaded yet
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
                Link risks from your risk database to track which risks are addressed by this annex category.
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
                          border: "1px solid #D0D5DD",
                          borderRadius: "4px",
                          padding: "12px",
                          backgroundColor: "#FAFBFC",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {risk.risk_name}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                            Risk level: {risk.risk_level}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRiskDetails(risk)}
                            >
                              <ViewIcon size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Unlink risk">
                            <IconButton
                              size="small"
                              onClick={() => handleUnlinkRisk(risk.id)}
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

              {/* Audit Modal */}
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
                <Suspense fallback={"loading..."}>
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

              {/* LinkedRisks Modal */}
              {isLinkedRisksModalOpen && (
                <Suspense fallback={"loading..."}>
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
                        setAlert,
                      });
                    }}
                    users={users}
                    onSubmitRef={onRiskSubmitRef}
                  />
                </Suspense>
              </StandardModal>
            </Stack>
          </TabPanel>

          {/* Tab 4: Notes */}
          <TabPanel value="notes" sx={{ padding: "15px 20px" }}>
            <Suspense fallback={<CircularProgress />}>
              <NotesTab
                attachedTo="ISO_42001_ANNEX"
                attachedToId={fetchedAnnex?.id?.toString() || ""}
              />
            </Suspense>
          </TabPanel>
        </TabContext>

        {/* Alert */}
        {alert && (
          <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
        )}

        <Divider />
        <Stack
          className="vw-iso-42001-annex-drawer-dialog-footer"
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
  );
};

export default VWISO42001AnnexDrawerDialog;
