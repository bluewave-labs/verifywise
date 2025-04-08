import { Stack, Typography, useTheme, SelectChangeEvent } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import { formatDate } from "../../../tools/isoDateToString";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useProjectData from "../../../../application/hooks/useProjectData";
import { User } from "../../../../domain/User";
import { Dayjs } from "dayjs";

interface DropDownsProps {
  elementId?: string;
  state?: any;
  setState?: (newState: any) => void;
  isControl?: boolean;
}

const DropDowns: React.FC<DropDownsProps> = ({
  elementId,
  state,
  setState,
}) => {
  const [status, setStatus] = useState("");
  const [approver, setApprover] = useState("");
  const [riskReview, setRiskReview] = useState("");
  const [owner, setOwner] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [implementationDetails, setImplementationDetails] = useState("");
  const theme = useTheme();
  const { dashboardValues, currentProjectId } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;
  const { project } = useProjectData({ projectId: currentProjectId || "0" });

  const inputStyles = {
    minWidth: 200,
    maxWidth: 400,
    flexGrow: 1,
    height: 34,
  };

  const [projectMembers, setProjectMembers] = useState<User[]>([]);

  // Filter users to only show project members
  useEffect(() => {    
    if (project && users?.length > 0) {
      const members = users.filter((user: User) => 
        typeof user.id === 'number' && project.members.some(memberId => Number(memberId) === user.id)
      );
      setProjectMembers(members);
    }
  }, [project, users]);

  // Update local state when the state prop or projectMembers changes
  useEffect(() => {
    if (state) {
      setStatus(state?.status || "");
      
      // Only set user-related states if the value exists in projectMembers
      if (state?.approver && projectMembers.some(user => user.id?.toString() === state.approver.toString())) {
        setApprover(state.approver.toString());
      } else {
        setApprover("");
      }

      if (state?.risk_review) {
        const validRiskReviews = ["Acceptable risk", "Residual risk", "Unacceptable risk"];
        setRiskReview(validRiskReviews.includes(state.risk_review.toString()) ? state.risk_review.toString() : "");
      } else {
        setRiskReview("");
      }

      if (state?.owner && projectMembers.some(user => user.id?.toString() === state.owner.toString())) {
        setOwner(state.owner.toString());
      } else {
        setOwner("");
      }

      if (state?.reviewer && projectMembers.some(user => user.id?.toString() === state.reviewer.toString())) {
        setReviewer(state.reviewer.toString());
      } else {
        setReviewer("");
      }

      setDate(state?.due_date || null);
      setImplementationDetails(state?.implementation_details || "");
    }
  }, [state, projectMembers]);

  const handleChange = (e: SelectChangeEvent<string | number>, setter: (value: string) => void, field: string) => {
    const stringValue = e.target.value.toString();
    setter(stringValue);
    if (setState) {
      setState({ ...state, [field]: e.target.value });
    }
  };

  return (
    <Stack
      id={elementId}
      style={{
        gap: theme.spacing(8),
      }}
    >
      <Stack
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={theme.spacing(15)}
      >
        <Select
          id="status"
          label="Status:"
          value={status}
          onChange={(e) => handleChange(e, setStatus, 'status')}
          items={[
            { _id: "Waiting", name: "Waiting" },
            { _id: "In progress", name: "In progress" },
            { _id: "Done", name: "Done" }
          ]}
          sx={inputStyles}
          placeholder={"Select status"}
        />

        <Select
          id="Approver"
          label="Approver:"
          value={approver}
          onChange={(e) => handleChange(e, setApprover, 'approver')}
          items={projectMembers.map((user) => ({
            _id: user.id?.toString() || "",
            name: `${user.name} ${user.surname}`
          }))}
          sx={inputStyles}
          placeholder={"Select approver"}
        />

        <Select
          id="Risk review"
          label="Risk review:"
          value={riskReview}
          onChange={(e) => handleChange(e, setRiskReview, 'risk_review')}
          items={[
            { _id: "Acceptable risk", name: "Acceptable risk" },
            { _id: "Residual risk", name: "Residual risk" },
            { _id: "Unacceptable risk", name: "Unacceptable risk" }
          ]}
          sx={inputStyles}
          placeholder={"Select risk review"}
        />
      </Stack>

      {/* Second Row */}
      <Stack
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={theme.spacing(15)}
      >
        <Select
          id="Owner"
          label="Owner:"
          value={owner}
          onChange={(e) => handleChange(e, setOwner, 'owner')}
          items={projectMembers.map((user) => ({
            _id: user.id?.toString() || "",
            name: `${user.name} ${user.surname}`
          }))}
          sx={inputStyles}
          placeholder={"Select owner"}
        />

        <Select
          id="Reviewer"
          label="Reviewer:"
          value={reviewer}
          onChange={(e) => handleChange(e, setReviewer, 'reviewer')}
          items={projectMembers.map((user) => ({
            _id: user.id?.toString() || "",
            name: `${user.name} ${user.surname}`
          }))}
          sx={inputStyles}
          placeholder={"Select reviewer"}
        />

        <DatePicker
          label="Due date:"
          sx={inputStyles}
          date={date}
          handleDateChange={(newDate) => {
            setDate(newDate);
            if (setState && newDate) {
              setState({
                ...state,
                due_date: formatDate(newDate.format("YYYY-MM-DD")),
              });
            }
          }}
        />
      </Stack>

      <Typography fontSize={13} fontWeight={400} sx={{ textAlign: "start" }}>
        Implementation details:
      </Typography>
      <Stack
        sx={{
          height: 90,
          borderRadius: theme.shape.borderRadius,
          "& .MuiInputBase-root": {
            height: "90px",
          },
          "& .MuiOutlinedInput-input": {
            padding: "30px",
          },
          marginBottom: theme.spacing(4),
        }}
      >
        {" "}
        <Field
          type="description"
          sx={{
            cursor: "text",
            "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
              {
                height: "73px",
              },
          }}
          value={implementationDetails}
          onChange={(e) => {
            setImplementationDetails(e.target.value);
            if (setState) {
              setState({ ...state, implementation_details: e.target.value });
            }
          }}
        />
      </Stack>
    </Stack>
  );
};

export default DropDowns;
