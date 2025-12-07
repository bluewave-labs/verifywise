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
  Trash2 as DeleteIcon,
  Download as DownloadIcon,
  FileText as FileIcon,
} from "lucide-react";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import { useState, useEffect, lazy, Suspense, useRef } from "react";
import TabBar from "../../TabBar";
import StandardModal from "../../Modals/StandardModal";
import { getFileById } from "../../../../application/repository/file.repository";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomizableButton from "../../Button/CustomizableButton";
import { Save as SaveIcon } from "lucide-react";
import { User } from "../../../../domain/types/User";
import { STATUSES } from "../../../../domain/types/Status";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import allowedRoles from "../../../../application/constants/permissions";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { GetAnnexControlISO27001ById } from "../../../../application/repository/annex_struct_iso.repository";
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

interface VWISO27001AnnexDrawerDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  control: Control;
  annex: any;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
  projectFrameworkId: number;
  project_id: number;
  onSaveSuccess?: (success: boolean, message?: string) => void;
}

const VWISO27001AnnexDrawerDialog = ({
  title,
  open,
  onClose,
  control,
  annex,
  projectFrameworkId,
  project_id,
  onSaveSuccess,
}: VWISO27001AnnexDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [fetchedAnnex, setFetchedAnnex] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] =
    useState<boolean>(false);
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState(false);
  const [riskFormData, setRiskFormData] = useState<any>(null);
  const onRiskSubmitRef = useRef<(() => void) | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const theme = useTheme();
  const [_alert, setAlert] = useState<AlertProps | null>(null);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
  const [currentRisks, setCurrentRisks] = useState<number[]>([]);
  const [auditedStatusModalOpen, setAuditedStatusModalOpen] =
    useState<boolean>(false);

  const { userId, userRoleName } = useAuth();
  const { users } = useUsers();

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

  // Add state for all form fields
  const [formData, setFormData] = useState({
    title: "",
    requirement_summary: "",
    key_questions: [] as string[],
    evidence_examples: [] as string[],
    implementation_description: "",
    status: "",
    owner: "",
    reviewer: "",
    approver: "",
    auditor_feedback: "",
    risks: [] as number[],
  });

  // Tab configuration
  const tabs = [
    { label: "Details", value: "details", icon: "FileText" as const },
    { label: "Evidence", value: "evidence", icon: "FolderOpen" as const },
    { label: "Cross mappings", value: "cross-mappings", icon: "Link" as const },
    { label: "Notes", value: "notes", icon: "MessageSquare" as const },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Filter users to only show project members
  useEffect(() => {
    if (users?.length > 0) {
      // Since we don't have project data, use all users
      setProjectMembers(users);
    }
  }, [users]);

  useEffect(() => {
    const fetchAnnexControl = async () => {
      if (open && annex?.id) {
        setIsLoading(true);
        try {
          const response: any = await GetAnnexControlISO27001ById({
            routeUrl: `/iso-27001/annexControl/byId/${control.id}?projectFrameworkId=${projectFrameworkId}`,
          });
          setFetchedAnnex(response.data);

          // Initialize form data with fetched values
          if (response.data) {
            setFormData({
              title: response.data.title || "",
              requirement_summary: response.data.requirement_summary || "",
              key_questions: response.data.key_questions || [],
              evidence_examples: response.data.evidence_examples || [],
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

          // On annex control fetch, set evidence files if available
          if (response.data.evidence_links) {
            setEvidenceFiles(response.data.evidence_links as FileData[]);
          }
        } catch (error) {
          console.error("Error fetching annex control:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAnnexControl();
  }, [open, annex?.id, projectFrameworkId]);

  // Initialize risk state from form data
  useEffect(() => {
    if (formData.risks && formData.risks.length > 0) {
      setCurrentRisks(formData.risks);
    } else {
      setCurrentRisks([]);
    }
  }, [formData.risks]);

  // File management functions for inline Evidence tab
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

  const handleDeleteFile = (fileId: string | number) => {
    if (typeof fileId === "string") {
      setUploadFiles(uploadFiles.filter((f) => f.id !== fileId));
    } else {
      setDeletedFilesIds([...deletedFilesIds, fileId]);
      handleAlert({
        variant: "info",
        body: "Please save the changes to delete the file.",
        setAlert,
      });
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

  const handleRiskUpdateSuccess = () => {
    setIsRiskDetailModalOpen(false);
    setRiskFormData(null);
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
      setAlert,
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
        "implementation_description",
        formData.implementation_description
      );
      formDataToSend.append("status", formData.status);

      // Only append user fields if they have valid values
      if (formData.owner && formData.owner.trim() !== "") {
        formDataToSend.append("owner", formData.owner);
      }
      if (formData.reviewer && formData.reviewer.trim() !== "") {
        formDataToSend.append("reviewer", formData.reviewer);
      }
      if (formData.approver && formData.approver.trim() !== "") {
        formDataToSend.append("approver", formData.approver);
      }

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
              : new File([file.data!], file.fileName, { type: file.type });
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

      try {
        const response = await updateEntityById({
          routeUrl: `/iso-27001/saveAnnexes/${fetchedAnnex.id}`,
          body: formDataToSend,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response && response.status === 200) {
          handleAlert({
            variant: "success",
            body: "Annex control saved successfully",
            setAlert,
          });
          onSaveSuccess?.(true, "Annex control saved successfully");
          onClose();
        } else {
          throw new Error(
            `Failed to save annex control. Status: ${
              response?.status || "unknown"
            }`
          );
        }
      } catch (apiError) {
        console.error("API call failed:", apiError);
        // If it's an axios error, extract the error message
        if (
          apiError &&
          typeof apiError === "object" &&
          "response" in apiError
        ) {
          const axiosError = apiError as any;
          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.response?.data ||
            axiosError.message ||
            "Failed to save annex control";
          throw new Error(errorMessage);
        }
        throw apiError;
      }
    } catch (error) {
      console.error("Error saving annex control:", error);
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
          <Typography sx={{ mt: 2 }}>Loading annex control data...</Typography>
        </Stack>
      </Drawer>
    );
  }

  return (
    <Drawer
      id={`vw-iso-27001-annex-drawer-dialog-${annex?.id}`}
      className="vw-iso-27001-annex-drawer-dialog"
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
        className="vw-iso-27001-annex-drawer-dialog-content"
        sx={{ width: 600 }}
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
            <Stack sx={{ gap: "15px" }}>
              {/* Requirement Summary Panel - Gray Box */}
              {formData.requirement_summary && (
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
                    {formData.requirement_summary}
                  </Typography>
                </Stack>
              )}

              {/* Key Questions Panel - Red-Tinted Box */}
              {formData.key_questions && formData.key_questions.length > 0 && (
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
                    {formData.key_questions.map(
                      (question: string, idx: number) => (
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

              {/* Evidence Examples Panel - Green-Tinted Box */}
              {formData.evidence_examples &&
                formData.evidence_examples.length > 0 && (
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
                      {formData.evidence_examples.map(
                        (example: string, idx: number) => (
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

              <Stack>
                <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
                  Implementation Description:
                </Typography>
                <Field
                  type="description"
                  value={formData.implementation_description}
                  onChange={(e) =>
                    handleFieldChange("implementation_description", e.target.value)
                  }
                  disabled={isEditingDisabled}
                  sx={{
                    cursor: "text",
                    "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                      {
                        height: "73px",
                      },
                  }}
                  placeholder="Describe how this requirement is implemented"
                />
              </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                borderRadius: 2,
                width: 155,
                height: 25,
                fontSize: 11,
                border: "1px solid #D0D5DD",
                backgroundColor: "white",
                color: "#344054",
              }}
              disableRipple={
                theme.components?.MuiButton?.defaultProps?.disableRipple
              }
              onClick={() => setIsLinkedRisksModalOpen(true)}
              disabled={isEditingDisabled}
            >
              Add/remove risks
            </Button>
            <Stack direction="row" spacing={10}>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#344054",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  margin: "auto",
                  textWrap: "wrap",
                }}
              >
                {`${formData.risks.length || 0} risks linked`}
              </Typography>
              {selectedRisks.length > 0 && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#344054",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    margin: "auto",
                    textWrap: "wrap",
                  }}
                >
                  {`${selectedRisks.length} ${
                    selectedRisks.length === 1 ? "risk" : "risks"
                  } pending save`}
                </Typography>
              )}
              {deletedRisks.length > 0 && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#344054",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    margin: "auto",
                    textWrap: "wrap",
                  }}
                >
                  {`${deletedRisks.length} ${
                    deletedRisks.length === 1 ? "risk" : "risks"
                  } pending delete`}
                </Typography>
              )}
            </Stack>
          </Stack>

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

          {isLinkedRisksModalOpen && (
            <Suspense fallback={"loading..."}>
              <LinkedRisksPopup
                onClose={() => setIsLinkedRisksModalOpen(false)}
                currentRisks={formData.risks
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

            <Stack
              sx={{
                padding: "15px 20px",
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
                disabled={isEditingDisabled}
                sx={inputStyles}
                placeholder={"Select status"}
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
                disabled={isEditingDisabled}
                sx={inputStyles}
                placeholder={"Select owner"}
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
                disabled={isEditingDisabled}
                sx={inputStyles}
                placeholder={"Select reviewer"}
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
                disabled={isEditingDisabled}
                sx={inputStyles}
                placeholder={"Select approver"}
                getOptionValue={(item) => item._id}
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
                  Auditor Feedback:
                </Typography>
                <Field
                  type="description"
                  value={formData.auditor_feedback}
                  onChange={(e) =>
                    handleFieldChange("auditor_feedback", e.target.value)
                  }
                  disabled={isAuditingDisabled}
                  sx={{
                    cursor: "text",
                    "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                      {
                        height: "73px",
                      },
                  }}
                  placeholder="Enter any feedback from the internal or external audits..."
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
                Upload evidence files to document compliance with this requirement.
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
                    onClick={() => document.getElementById("evidence-file-input")?.click()}
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
                    disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
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
                    .filter((file) => !deletedFilesIds.includes(typeof file.id === "number" ? file.id : parseInt(file.id.toString())))
                    .map((file) => (
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
                Link risks from your risk database to track which risks are addressed by this requirement.
              </Typography>

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
                    "&:hover": { backgroundColor: "#F9FAFB" },
                  }}
                  disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
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

              {currentRisks.length === 0 && selectedRisks.length === 0 && (
                <Box sx={{ border: "2px dashed #D0D5DD", borderRadius: "4px", padding: "20px", textAlign: "center", backgroundColor: "#FAFBFC" }}>
                  <Typography sx={{ color: "#6B7280" }}>
                    No risks linked yet
                  </Typography>
                </Box>
              )}

              {isLinkedRisksModalOpen && (
                <Suspense fallback={"loading..."}>
                  <LinkedRisksPopup
                    onClose={() => setIsLinkedRisksModalOpen(false)}
                    currentRisks={formData.risks.concat(selectedRisks).filter((risk) => !deletedRisks.includes(risk))}
                    setSelectecRisks={setSelectedRisks}
                    _setDeletedRisks={setDeletedRisks}
                    frameworkId={3}
                    isOrganizational={true}
                  />
                </Suspense>
              )}

              <StandardModal
                isOpen={isRiskDetailModalOpen}
                onClose={() => setIsRiskDetailModalOpen(false)}
                title="Risk Details"
                description="View and edit risk details"
              >
                <Suspense fallback={<CircularProgress />}>
                  <AddNewRiskForm
                    closePopup={() => setIsRiskDetailModalOpen(false)}
                    popupStatus="edit"
                    initialRiskValues={riskFormData}
                    onSuccess={handleRiskUpdateSuccess}
                    onSubmitRef={onRiskSubmitRef}
                    compactMode={true}
                  />
                </Suspense>
              </StandardModal>
            </Stack>
          </TabPanel>

          {/* Tab 4: Notes */}
          <TabPanel value="notes" sx={{ padding: "15px 20px" }}>
            <Suspense fallback={<CircularProgress />}>
              <NotesTab
                attachedTo="ISO_27001_ANNEX"
                attachedToId={fetchedAnnex?.id?.toString() || ""}
              />
            </Suspense>
          </TabPanel>
        </TabContext>

        <Divider />
        <Stack
          className="vw-iso-27001-annex-drawer-dialog-footer"
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

export default VWISO27001AnnexDrawerDialog;
