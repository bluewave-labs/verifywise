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
import { useState, useEffect, Suspense } from "react";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as SaveIconSVGWhite } from "../../../assets/icons/save-white.svg";
import { useAuth } from "../../../../application/hooks/useAuth";
import useUsers from "../../../../application/hooks/useUsers";
import { User } from "../../../../domain/types/User";
import UppyUploadFile from "../../Inputs/FileUpload";
import Alert from "../../Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Uppy from "@uppy/core";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import allowedRoles from "../../../../application/constants/permissions";
import AuditRiskPopup from "../../RiskPopup/AuditRiskPopup";
import LinkedRisksPopup from "../../LinkedRisks";
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
  const [isLinkedRisksModalOpen, setIsLinkedRisksModalOpen] =
    useState<boolean>(false);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);
  const [auditedStatusModalOpen, setAuditedStatusModalOpen] =
    useState<boolean>(false);
  const statusIdMap = new Map([
    ["Not started", "0"],
    ["Draft", "1"],
    ["In progress", "2"],
    ["Awaiting review", "3"],
    ["Awaiting approval", "4"],
    ["Implemented", "5"],
    // ["Audited", "6"],
    ["Needs rework", "6"],
  ]);
  // Create the reverse map
  const idStatusMap = new Map();
  for (const [status, id] of statusIdMap.entries()) {
    idStatusMap.set(id, status);
  }

  const { userId, userRoleName } = useAuth();
  const { users } = useUsers();

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
    risks: [] as number[],
  });

  // Filter users to only show project members
  useEffect(() => {
    if (users?.length > 0) {
      // Since we don't have project data, use all users
      setProjectMembers(users);
    }
  }, [users]);

  // Setup Uppy instance
  const [uppy] = useState(() => new Uppy());

  useEffect(() => {
    const fetchSubClause = async () => {
      if (open && subClause?.id) {
        setIsLoading(true);
        try {
          const response = await ISO27001GetSubClauseById({
            routeUrl: `/iso-27001/subClause/byId/${subClause.id}?projectFrameworkId=${projectFrameworkId}`,
          });

          // The response structure is { message: "OK", data: actualData }
          const subClauseData = response.data;
          setFetchedSubClause(subClauseData);

          // Initialize form data with fetched values
          if (subClauseData) {
            const statusId = statusIdMap.get(subClauseData.status) || "0";
            const initialFormData = {
              implementation_description:
                subClauseData.implementation_description || "",
              status: statusId,
              owner: subClauseData.owner?.toString() || "",
              reviewer: subClauseData.reviewer?.toString() || "",
              approver: subClauseData.approver?.toString() || "",
              auditor_feedback: subClauseData.auditor_feedback || "",
              risks: subClauseData.risks || [],
            };

            setFormData(initialFormData);

            // Set the date if it exists in the fetched data
            if (subClauseData.due_date) {
              setDate(subClauseData.due_date);
            }
          }

          // On subclause fetch, set evidence files if available
          if (subClauseData?.evidence_links) {
            setEvidenceFiles(subClauseData.evidence_links);
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
      className="vw-iso-27001-clause-drawer-dialog"
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
              {displayData?.requirement_summary}
            </Typography>
            <Typography fontSize={13} fontWeight={600}>
              Key Questions:
            </Typography>
            <ul style={{ paddingLeft: "20px" }}>
              {displayData?.key_questions?.map((question: any, index: any) => (
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
          gap={"24px"}
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
            icon={<SaveIconSVGWhite />}
          />
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO27001ClauseDrawerDialog;
