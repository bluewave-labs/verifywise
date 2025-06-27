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
import Checkbox from "../../Inputs/Checkbox";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import { useContext, useState, useEffect, lazy, Suspense } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { User } from "../../../../domain/types/User";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useProjectData from "../../../../application/hooks/useProjectData";
import {
  GetAnnexCategoriesById,
  UpdateAnnexCategoryById,
} from "../../../../application/repository/annexCategory_iso.repository";
import { AnnexCategoryISO } from "../../../../domain/types/AnnexCategoryISO";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import { STATUSES } from "../../../../domain/types/Status";
import Alert from "../../Alert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import Uppy from "@uppy/core";
import allowedRoles from "../../../../application/constants/permissions";
const LinkedRisksPopup = lazy(
  () => import("../../LinkedRisks")
);

interface Control {
  id: number;
  control_no: number;
  control_subSection: number;
  title: string;
  shortDescription: string;
  guidance: string;
  status: string;
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
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] = useState<boolean>(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [evidenceFilesDeleteCount, setEvidenceFilesDeleteCount] = useState(0);
  const theme = useTheme();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);

  // Get context and project data
  const { users, userId, userRoleName } = useContext(VerifyWiseContext);
  const { project } = useProjectData({ projectId: String(project_id) });

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

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
  });

  // Filter users to only show project members
  useEffect(() => {
    if (project && users?.length > 0) {
      const members = users.filter(
        (user: User) =>
          typeof user.id === "number" &&
          project.members.some((memberId) => Number(memberId) === user.id)
      );
      setProjectMembers(members);
    }
  }, [project, users]);

  const setUploadFilesAnnexCategories = (files: FileData[]) => {
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
          data: file.data, // Keep the actual file for upload
          id: file.id,
          fileName: file.name || "unnamed",
          size: file.size || 0,
          type: file.type || "application/octet-stream",
        } as FileData;
      })
      .filter((file): file is FileData => file !== null);

    // Only update uploadFiles state, don't combine with evidenceFiles yet
    setUploadFilesAnnexCategories(newUploadFiles);
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

    // Check if file is in evidenceFiles or uploadFiles
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

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    handleFieldChange(field, event.target.value.toString());
  };

  // Setup Uppy instance
  const [uppy] = useState(() => new Uppy());

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
      formDataToSend.append("user_id", userId?.toString() || "");
      formDataToSend.append("project_id", project_id.toString());
      formDataToSend.append("delete", JSON.stringify(deletedFilesIds));
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
          <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            gap: "15px",
          }}
        >
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
                label="Not Applicable"
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
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            gap: "15px",
            opacity: formData.is_applicable ? 1 : 0.5,
            pointerEvents: formData.is_applicable ? "auto" : "none",
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
          </Stack>

          <Dialog 
            open={isLinkedRisksModalOpen} 
            onClose={() => setIsLinkedRisksModalOpen(false)}
            PaperProps={{
              sx: {
                width: '1100px',
                maxWidth: '1100px',
                minHeight: '520px'
              },
            }}
          >
            <Suspense fallback={"loading..."}>
              <LinkedRisksPopup onClose={() => setIsLinkedRisksModalOpen(false)} />
            </Suspense>
          </Dialog>
          
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            opacity: formData.is_applicable ? 1 : 0.5,
            pointerEvents: formData.is_applicable ? "auto" : "none",
          }}
          gap={"20px"}
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
            icon={<SaveIcon />}
          />
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO42001AnnexDrawerDialog;
