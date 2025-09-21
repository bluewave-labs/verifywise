import {
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  CircularProgress,
  Dialog,
  useTheme,
} from "@mui/material";
import { FileData } from "../../../../domain/types/File";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import { useState, useEffect, lazy, Suspense } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as SaveIconSVGWhite } from "../../../assets/icons/save-white.svg";
import { User } from "../../../../domain/types/User";
import UppyUploadFile from "../../Inputs/FileUpload";
import { STATUSES } from "../../../../domain/types/Status";
import Alert from "../../Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import Uppy from "@uppy/core";
import allowedRoles from "../../../../application/constants/permissions";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { GetAnnexControlISO27001ById } from "../../../../application/repository/annex_struct_iso.repository";
const AuditRiskPopup = lazy(() => import("../../RiskPopup/AuditRiskPopup"));
const LinkedRisksPopup = lazy(() => import("../../LinkedRisks"));

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
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] =
    useState<boolean>(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [evidenceFilesDeleteCount, setEvidenceFilesDeleteCount] = useState(0);
  const theme = useTheme();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
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
    guidance: "",
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

  const setUploadFilesAnnexControls = (files: FileData[]) => {
    setUploadFiles(files);
    if (deletedFilesIds.length > 0 || files.length > 0) {
      handleAlert({
        variant: "info",
        body: "Please save the changes to save the file changes.",
        setAlert,
      });
    }
  };

  function closeFileUploadModal(): void {
    const uppyFiles = uppy.getFiles();
    const newUploadFiles = uppyFiles
      .map((file) => {
        if (!(file.data instanceof Blob)) {
          return null;
        }
        return {
          data: file.data,
          id: file.id,
          fileName: file.name || "unnamed",
          size: file.size || 0,
          type: file.type || "application/octet-stream",
        } as FileData;
      })
      .filter((file): file is FileData => file !== null);

    setUploadFilesAnnexControls(newUploadFiles);
    setIsFileUploadOpen(false);
  }

  const handleRemoveFile = async (fileId: string) => {
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      handleAlert({
        variant: "error",
        body: "Invalid file ID",
        setAlert,
      });
      return;
    }

    const isEvidenceFile = evidenceFiles.some((file) => file.id === fileId);

    if (isEvidenceFile) {
      const newEvidenceFiles = evidenceFiles.filter(
        (file) => file.id !== fileId
      );
      setEvidenceFiles(newEvidenceFiles);
      setEvidenceFilesDeleteCount((prev) => prev + 1);
      setDeletedFilesIds([...deletedFilesIds, fileIdNumber]);
    } else {
      setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

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
              guidance: response.data.requirement_summary || "",
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

  const [uppy] = useState(() => new Uppy());

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
          <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Divider />
        <Stack sx={{ padding: "15px 20px", gap: "15px" }}>
          <Stack
            className="vw-iso-27001-annex-drawer-dialog-content-annex-guidance"
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
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            gap: "15px",
          }}
        >
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
              onClick={() => setIsFileUploadOpen(true)}
              disabled={isEditingDisabled}
            >
              Add/Remove evidence
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
                {`${evidenceFiles.length || 0} evidence files attached`}
              </Typography>
              {uploadFiles.length > 0 && (
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
                  {`${uploadFiles.length} ${
                    uploadFiles.length === 1 ? "file" : "files"
                  } pending upload`}
                </Typography>
              )}
              {evidenceFilesDeleteCount > 0 && (
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
                  {`${evidenceFilesDeleteCount} ${
                    evidenceFilesDeleteCount === 1 ? "file" : "files"
                  } pending delete`}
                </Typography>
              )}
            </Stack>
          </Stack>
          <Dialog open={isFileUploadOpen} onClose={closeFileUploadModal}>
            <UppyUploadFile
              uppy={uppy}
              files={[...evidenceFiles, ...uploadFiles]}
              onClose={closeFileUploadModal}
              onRemoveFile={handleRemoveFile}
              hideProgressIndicators={true}
            />
          </Dialog>
          {alert && (
            <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
          )}

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
              Add/Remove risks
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

          <Dialog
            open={isLinkedRisksModalOpen}
            onClose={() => setIsLinkedRisksModalOpen(false)}
            PaperProps={{
              sx: {
                width: "1500px",
                maxWidth: "1500px",
              },
            }}
          >
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
          </Dialog>
        </Stack>
        <Divider />
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
            icon={<SaveIconSVGWhite />}
          />
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO27001AnnexDrawerDialog;
