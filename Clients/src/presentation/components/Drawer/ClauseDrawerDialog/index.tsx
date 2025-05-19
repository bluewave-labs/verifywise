import {
  Button,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Field from "../../Inputs/Field";
import { FileData } from "../../../../domain/types/File";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { Dayjs } from "dayjs";
import { useState, useEffect, useContext } from "react";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { GetSubClausesById } from "../../../../application/repository/subClause_iso.repository";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useProjectData from "../../../../application/hooks/useProjectData";
import { User } from "../../../../domain/types/User";

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
}

const VWISO42001ClauseDrawerDialog = ({
  open,
  onClose,
  subClause,
  clause,
  evidenceFiles = [],
  uploadFiles = [],
  projectFrameworkId,
}: VWISO42001ClauseDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [fetchedSubClause, setFetchedSubClause] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);

  // Get context and project data
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;
  const { project } = useProjectData({
    projectId: String(projectFrameworkId) || "0",
  });

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

  useEffect(() => {
    const fetchSubClause = async () => {
      if (open && subClause?.id) {
        setIsLoading(true);
        try {
          const response = await GetSubClausesById({
            routeUrl: `/iso-42001/subClause/byId/${subClause.id}?projectFrameworkId=${projectFrameworkId}`,
          });
          console.log("Fetched SubClause:", response.data);
          setFetchedSubClause(response.data);

          // Initialize form data with fetched values
          if (response.data) {
            setFormData({
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
              setDate(response.data.due_date);
            }
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
    console.log(`Updated ${field}:`, value);
  };

  const handleSelectChange =
    (field: string) => (event: SelectChangeEvent<string | number>) => {
      handleFieldChange(field, event.target.value.toString());
    };

  const handleSave = () => {
    console.log("Form Data:", {
      ...formData,
      due_date: date,
    });
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
            {clause?.clause_no + "." + displayData?.id} {displayData?.title}
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
              onClick={() => {}}
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
                {`${
                  displayData?.evidence_links?.length || 0
                } evidence files attached`}
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
            items={[
              { _id: "Not started", name: "Not started" },
              { _id: "Draft", name: "Draft" },
              { _id: "In progress", name: "In progress" },
              { _id: "Awaiting review", name: "Awaiting review" },
              { _id: "Awaiting approval", name: "Awaiting approval" },
              { _id: "Implemented", name: "Implemented" },
              { _id: "Audited", name: "Audited" },
              { _id: "Needs rework", name: "Needs rework" },
            ]}
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
              console.log("Updated due date:", newDate);
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
          className="vw-iso-42001-clause-drawer-dialog-footer"
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
    </Drawer>
  );
};

export default VWISO42001ClauseDrawerDialog;
