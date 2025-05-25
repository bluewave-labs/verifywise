import {
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  CircularProgress,
  Dialog,
} from "@mui/material";
import { FileData } from "../../../../domain/types/File";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Checkbox from "../../Inputs/Checkbox";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import { useContext, useState, useEffect, useMemo } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import VWButton from "../../../vw-v2-components/Buttons";
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
import createUppy from "../../../../application/tools/createUppy";
import { STATUSES } from "../../../../domain/types/Status";

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
  control: Control | null;
  annex: AnnexCategoryISO;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
  projectFrameworkId: number;
  project_id: number;
  onSaveSuccess?: () => void;
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
  console.log("VWISO42001AnnexDrawerDialog -- project_id : ", project_id);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [fetchedAnnex, setFetchedAnnex] = useState<AnnexCategoryISO>();
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);

  // Get context and project data
  const { dashboardValues, userId } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;
  const { project } = useProjectData({
    projectId: String(project_id) || "0",
  });

  // Add state for all form fields
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const fetchAnnexCategory = async () => {
      if (open && annex?.id) {
        setIsLoading(true);
        try {
          const response: any = await GetAnnexCategoriesById({
            routeUrl: `/iso-42001/annexCategory/byId/${annex.id}?projectFrameworkId=${projectFrameworkId}`,
          });
          const fetchedData = response.data.data;
          setFetchedAnnex(fetchedData);

          // Initialize form data with fetched values
          setFormData({
            is_applicable: fetchedData.is_applicable ?? false,
            justification_for_exclusion:
              fetchedData.justification_for_exclusion || "",
            implementation_description:
              fetchedData.implementation_description || "",
            status: fetchedData.status || "",
            owner: fetchedData.owner?.toString() || "",
            reviewer: fetchedData.reviewer?.toString() || "",
            approver: fetchedData.approver?.toString() || "",
            auditor_feedback: fetchedData.auditor_feedback || "",
          });

          // Set the date if it exists in the fetched data
          if (fetchedData.due_date) {
            setDate(dayjs(fetchedData.due_date));
          }

          // Set evidence files if available
          if (fetchedData.evidence_links) {
            setEvidenceFiles(fetchedData.evidence_links as FileData[]);
          }
        } catch (error) {
          console.error("Error fetching annex category:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Reset states when drawer opens with a new control
    if (open) {
      setFormData({
        is_applicable: false,
        justification_for_exclusion: "",
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        auditor_feedback: "",
      });
      setDate(null);
      setEvidenceFiles([]);
      fetchAnnexCategory();
    }
  }, [open, annex?.id, projectFrameworkId]);

  // Reset states when drawer closes
  useEffect(() => {
    if (!open) {
      setFetchedAnnex(undefined);
      setFormData({
        is_applicable: false,
        justification_for_exclusion: "",
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        auditor_feedback: "",
      });
      setDate(null);
      setEvidenceFiles([]);
    }
  }, [open]);

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
  const uppy = useMemo(
    () =>
      createUppy({
        onChangeFiles: setEvidenceFiles,
        allowedMetaFields: ["annex_id", "user_id", "project_id", "delete"],
        meta: {
          annex_id: annex?.id,
          user_id: userId,
          project_id: project_id?.toString(),
          delete: "[]",
        },
        routeUrl: "api/files",
      }),
    [annex?.id, userId, project_id]
  );

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
      formDataToSend.append(
        "project_framework_id",
        projectFrameworkId.toString()
      );
      formDataToSend.append("delete", JSON.stringify([])); // Add deleted file IDs if needed

      // Attach each evidence file (as File objects)
      evidenceFiles.forEach((file) => {
        // If file is a File object (new upload), append it
        if (file instanceof File) {
          formDataToSend.append("evidence_files", file);
        }
        // If file is an existing file object (from backend), skip or handle as needed
      });

      if (!fetchedAnnex) {
        console.error("Fetched annex is undefined");
        return;
      }

      console.log(
        `Updating Annex Category: /iso-42001/saveAnnexes/${fetchedAnnex.id}`
      );

      // Call the update API
      const response = await UpdateAnnexCategoryById({
        routeUrl: `/iso-42001/saveAnnexes/${fetchedAnnex.id}`,
        body: formDataToSend,
      });

      if (response.status === 200) {
        // Call onSaveSuccess after successful save
        onSaveSuccess?.();
        // Close the drawer after successful save
        onClose();
      }
    } catch (error) {
      console.error("Error saving annex category:", error);
      // Optionally, show an error message
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
              <strong>Guidance:</strong> {control?.guidance}
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
              />
            </Stack>
          </Stack>
          <Stack>
            <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
              {"Justification for Exclusion (if Not Applicable)"}:
            </Typography>
            <Field
              type="description"
              value={formData.justification_for_exclusion}
              onChange={(e) =>
                handleFieldChange("justification_for_exclusion", e.target.value)
              }
              sx={{
                cursor: "text",
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
              disableRipple={false}
              onClick={() => setIsFileUploadOpen(true)}
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
            </Stack>
          </Stack>
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
            items={STATUSES.map((status) => ({
              _id: status,
              name: status.charAt(0).toUpperCase() + status.slice(1),
            }))}
            sx={inputStyles}
            placeholder={"Select status"}
          />

          <Select
            id="Owner"
            label="Owner:"
            value={formData.owner}
            onChange={handleSelectChange("owner")}
            items={projectMembers.map((user) => ({
              _id: user.id?.toString() || "",
              name: `${user.name} ${user.surname}`,
            }))}
            sx={inputStyles}
            placeholder={"Select owner"}
          />

          <Select
            id="Reviewer"
            label="Reviewer:"
            value={formData.reviewer}
            onChange={handleSelectChange("reviewer")}
            items={projectMembers.map((user) => ({
              _id: user.id?.toString() || "",
              name: `${user.name} ${user.surname}`,
            }))}
            sx={inputStyles}
            placeholder={"Select reviewer"}
          />

          <Select
            id="Approver"
            label="Approver:"
            value={formData.approver}
            onChange={handleSelectChange("approver")}
            items={projectMembers.map((user) => ({
              _id: user.id?.toString() || "",
              name: `${user.name} ${user.surname}`,
            }))}
            sx={inputStyles}
            placeholder={"Select approver"}
          />

          <DatePicker
            label="Due date:"
            sx={inputStyles}
            date={date}
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
          className="vw-iso-42001-annex-drawer-dialog-footer"
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            padding: "15px 20px",
          }}
        >
          <VWButton
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
      <Dialog
        open={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
      >
        <UppyUploadFile
          uppy={uppy}
          files={evidenceFiles}
          onClose={() => setIsFileUploadOpen(false)}
          onRemoveFile={(fileId) =>
            setEvidenceFiles((prev) => prev.filter((f) => f.id !== fileId))
          }
        />
      </Dialog>
    </Drawer>
  );
};

export default VWISO42001AnnexDrawerDialog;
