import { Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { formatDate } from "../../../tools/isoDateToString";

// Add interface for user type
export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
}

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
  const [status, setStatus] = useState(state?.status || "");
  const [approver, setApprover] = useState(state?.approver || "");
  const [riskReview, setRiskReview] = useState(state?.risk_review || "");
  const [owner, setOwner] = useState(state?.owner || "");
  const [reviewer, setReviewer] = useState(state?.reviewer || "");
  const [date, setDate] = useState(state?.due_date || null);
  const [implementationDetails, setImplementationDetails] = useState(
    state?.implementation_details || ""
  );
  const theme = useTheme();

  const inputStyles = {
    minWidth: 200,
    maxWidth: 400,
    flexGrow: 1,
    height: 34,
  };

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getAllEntities({ routeUrl: "/users" });
      setUsers(response.data);
    };
    fetchUsers();
  }, []);

  // Update local state when the state prop changes
  useEffect(() => {
    if (state) {
      setStatus(state?.status);
      setApprover(state?.approver); // Ensure this line is present
      setRiskReview(state?.risk_review);
      setOwner(state?.owner);
      setReviewer(state?.reviewer);
      setDate(state?.due_date);
      setImplementationDetails(state?.implementation_details);
    }
  }, [state]);

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
          value={status || ""}
          onChange={(e) => {
            setStatus(e.target.value);
            console.log("Status: ", e.target.value);
            if (setState) {
              setState({ ...state, status: e.target.value });
            }
          }}
          items={[
            { _id: "Waiting", name: "Waiting" },
            { _id: "In progress", name: "In progress" },
            { _id: "Done", name: "Done" },
          ]}
          sx={inputStyles}
          placeholder={"Select status"}
        />

        <Select
          id="Approver"
          label="Approver:"
          value={approver || ""}
          onChange={(e) => {
            setApprover(e.target.value);
            console.log("Approver: ", e.target.value);
            if (setState) {
              setState({ ...state, approver: e.target.value });
            }
          }}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: `${user.name} ${user.surname}`,
          }))}
          sx={inputStyles}
          placeholder={"Select approver"}
        />

        <Select
          id="Risk review"
          label="Risk review:"
          value={riskReview || ""}
          onChange={(e) => {
            setRiskReview(e.target.value);
            console.log("Risk review: ", e.target.value);
            if (setState) {
              setState({ ...state, risk_review: e.target.value });
            }
          }}
          items={[
            { _id: "Acceptable risk", name: "Acceptable risk" },
            { _id: "Residual risk", name: "Residual risk" },
            { _id: "Unacceptable risk", name: "Unacceptable risk" },
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
          value={owner || ""}
          onChange={(e) => {
            setOwner(e.target.value);
            console.log("Owner: ", e.target.value);
            if (setState) {
              setState({ ...state, owner: e.target.value });
            }
          }}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: `${user.name} ${user.surname}`,
          }))}
          sx={inputStyles}
          placeholder={"Select owner"}
        />

        <Select
          id="Reviewer"
          label="Reviewer:"
          value={reviewer || ""}
          onChange={(e) => {
            setReviewer(e.target.value);
            console.log("Reviewer: ", e.target.value);
            if (setState) {
              setState({ ...state, reviewer: e.target.value });
            }
          }}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: `${user.name} ${user.surname}`,
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
