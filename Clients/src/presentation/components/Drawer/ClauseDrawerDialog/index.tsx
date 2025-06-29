import {
  Button,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  SelectChangeEvent,
  Dialog,
  useTheme,
} from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Field from "../../Inputs/Field";
import { FileData } from "../../../../domain/types/File";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { Dayjs } from "dayjs";
import { useState, useEffect, useContext} from "react";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useProjectData from "../../../../application/hooks/useProjectData";
import { User } from "../../../../domain/types/User";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import Alert from "../../Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Uppy from "@uppy/core";
import {
  getEntityById,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import allowedRoles from "../../../../application/constants/permissions";
import LinkedRisksSection from "../Sections/LinkedRisksSection";

export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

interface VWISO42001ClauseDrawerDialogProps {
  open: boolean;
  onClose: () => void;
  subClause: any;
  clause: any;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
  projectFrameworkId: number;
  project_id: number;
  onSaveSuccess?: (success: boolean, message?: string) => void;
  index: number;
}

const VWISO42001ClauseDrawerDialog = ({
  open,
  onClose,
  subClause,
  clause,
  projectFrameworkId,
  project_id,
  onSaveSuccess,
  index,
}: VWISO42001ClauseDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [fetchedSubClause, setFetchedSubClause] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState<boolean>(false);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const theme = useTheme();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [deletedFilesIds, setDeletedFilesIds] = useState<number[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileData[]>([]);
  const [evidenceFilesDeleteCount, setEvidenceFilesDeleteCount] = useState(0);
  const statusIdMap = new Map([
    ["Not started", "0"],
    ["Draft", "1"],
    ["In progress", "2"],
    ["Awaiting review", "3"],
    ["Awaiting approval", "4"],
    ["Implemented", "5"],
    ["Audited", "6"],
    ["Needs rework", "7"],
  ]);
  // Create the reverse map
  const idStatusMap = new Map();
  for (const [status, id] of statusIdMap.entries()) {
    idStatusMap.set(id, status);
  }

  // Get context and project data
  const { users, userId, userRoleName } = useContext(VerifyWiseContext);
  const { project } = useProjectData({
    projectId: String(project_id) || "0",
  });

  const isEditingDisabled =
    !allowedRoles.frameworks.edit.includes(userRoleName);
  const isAuditingDisabled =
    !allowedRoles.frameworks.audit.includes(userRoleName);

  // Add state for all form fields
  const [formData, setFormData] = useState({
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

  // Setup Uppy instance
  const [uppy] = useState(() => new Uppy());

  useEffect(() => {
    const fetchSubClause = async () => {
      if (open && subClause?.id) {
        setIsLoading(true);
        try {
          const response = await getEntityById({
            routeUrl: `/iso-42001/subClause/byId/${subClause.id}?projectFrameworkId=${projectFrameworkId}`,
          });
          setFetchedSubClause(response.data);

          // Initialize form data with fetched values
          if (response.data) {
            const statusId = statusIdMap.get(response.data.status) || "0";
            setFormData({
              implementation_description:
                response.data.implementation_description || "",
              status: statusId,
              owner: response.data.owner?.toString() || "",
              reviewer: response.data.reviewer?.toString() || "",
              approver: response.data.approver?.toString() || "",
              auditor_feedback: response.data.auditor_feedback || "",
            });

            // Set the date if it exists in the fetched data
            if (response.data.due_date) {
              setDate(response.data.due_date);
            }
          }

          // On subclause fetch, set evidence files if available
          if (response.data?.evidence_links) {
            setEvidenceFiles(response.data.evidence_links);
          }
        } catch (error) {
          console.error("Error fetching subclause:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSubClause();
  }, [open, subClause?.id, projectFrameworkId]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange =
    (field: string) => (event: SelectChangeEvent<string | number>) => {
      handleFieldChange(field, event.target.value.toString());
    };

  // Update handleSave to use evidenceFiles
  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (!fetchedSubClause) {
        console.error("Fetched subclause is undefined");
        handleAlert({
          variant: "error",
          body: "Error: Subclause data not found",
          setAlert,
        });
        onSaveSuccess?.(false, "Error: Subclause data not found");
        return;
      }

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
      const response = await updateEntityById({
        routeUrl: `/iso-42001/saveClauses/${fetchedSubClause.id}`,
        body: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        handleAlert({
          variant: "success",
          body: "Subclause saved successfully",
          setAlert,
        });
        setUploadFiles([]);
        onSaveSuccess?.(true, "Subclause saved successfully");
        onClose();
      } else {
        throw new Error("Failed to save subclause");
      }
    } catch (error) {
      console.error("Error saving subclause:", error);
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

  const setUploadFilesForSubcontrol = (files: FileData[]) => {
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
    setUploadFilesForSubcontrol(newUploadFiles);
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

  return (
    <Drawer
      className="vw-iso-42001-clause-drawer-dialog"
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
        className="vw-iso-42001-clause-drawer-dialog-content"
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
            {clause?.clause_no + "." + (index + 1)} {displayData?.title}
          </Typography>
          <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "#f8f9fa",
              borderLeft: `3px solid #13715B`,
              p: "10px",
              mt: "10px",
              mb: "15px",
            }}
          >
            <Typography fontSize={13} sx={{ marginBottom: "13px" }}>
              <strong>Requirement Summary: </strong>
              {displayData?.summary}
            </Typography>
            <Typography fontSize={13} fontWeight={600}>
              Key Questions:
            </Typography>
            <ul style={{ paddingLeft: "20px" }}>
              {displayData?.questions?.map((question: any, index: any) => (
                <li key={index}>
                  <Typography fontSize={13}>{question}</Typography>
                </li>
              ))}
            </ul>

            <Typography fontSize={13} fontWeight={600}>
              Evidence Examples:
            </Typography>
            <ul style={{ paddingLeft: "20px" }}>
              {displayData?.evidence_examples?.map(
                (example: any, index: any) => (
                  <li key={index}>
                    <Typography fontSize={13}>{example}</Typography>
                  </li>
                )
              )}
            </ul>
          </Paper>
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
          gap={"20px"}
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

          
          <Dialog open={isFileUploadOpen} onClose={closeFileUploadModal} >
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
          <LinkedRisksSection />
          
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
          gap={"20px"}
        >
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
              { _id: "6", name: "Audited" },
              { _id: "7", name: "Needs rework" },
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
              name: `${user.name}`,
              email: user.email,
              surname: user.surname,
            }))}
            sx={inputStyles}
            placeholder={"Select owner"}
            disabled={isEditingDisabled}
          />

          <Select
            id="Reviewer"
            label="Reviewer:"
            value={formData.reviewer || ""}
            onChange={handleSelectChange("reviewer")}
            items={projectMembers.map((user) => ({
              _id: user.id.toString(),
              name: `${user.name}`,
              email: user.email,
              surname: user.surname,
            }))}
            sx={inputStyles}
            placeholder={"Select reviewer"}
            disabled={isEditingDisabled}
          />

          <Select
            id="Approver"
            label="Approver:"
            value={formData.approver || ""}
            onChange={handleSelectChange("approver")}
            items={projectMembers.map((user) => ({
              _id: user.id.toString(),
              name: `${user.name}`,
              email: user.email,
              surname: user.surname,
            }))}
            sx={inputStyles}
            placeholder={"Select approver"}
            disabled={isEditingDisabled}
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
        <Divider />
        <Stack
          className="vw-iso-42001-clause-drawer-dialog-footer"
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

export default VWISO42001ClauseDrawerDialog;
