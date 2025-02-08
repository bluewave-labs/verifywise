import { Stack, Typography, useTheme, SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import { Dayjs } from "dayjs";
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
  isControl: boolean;
}

const DropDowns: React.FC<DropDownsProps> = ({
  elementId,
  state = {},
  setState,
  isControl,
}) => {
  const [status, setStatus] = useState<string | number>(state?.status || "");
  const [approver, setApprover] = useState(state?.approver || "");
  const [riskReview, setRiskReview] = useState(state?.riskReview || "");
  const [owner, setOwner] = useState(state?.owner || "");
  const [reviewer, setReviewer] = useState(state?.reviewer || "");
  const [date, setDate] = useState<Dayjs | null>(state?.date || null);
  const [controlDescription, setControlDescription] = useState(
    state?.controlDescription || ""
  );
  const [subControlDescription, setsubControlDescription] = useState(
    state?.subControlDescription || ""
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

  const handleChange = (e: SelectChangeEvent<string | number>) => {
    const selectedValue = e.target.value;
    const selectedUser = users.find((user) => user.id === selectedValue);
    console.log("selectedUser : ", selectedUser);
    setApprover(selectedValue);

    // Update the state in the parent component
    if (setState) {
      setState({ ...state, approver: selectedValue });
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
          onChange={(e) => {
            setStatus(e.target.value);
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
          placeholder="Select status"
        />

        <Select
          id="Approver"
          label="Approver:"
          value={approver || ""}
          onChange={handleChange}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: user.name,
          }))}
          sx={inputStyles}
          placeholder="Select approver"
        />

        <Select
          id="Risk review"
          label="Risk review:"
          value={riskReview}
          onChange={(e) => {
            setRiskReview(e.target.value);
            if (setState) {
              setState({ ...state, riskReview: e.target.value });
            }
          }}
          items={[
            { _id: "Acceptable risk", name: "Acceptable risk" },
            { _id: "Residual risk", name: "Residual risk" },
            { _id: "Unacceptable risk", name: "Unacceptable risk" },
          ]}
          sx={inputStyles}
          placeholder="Select risk review"
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
          onChange={(e) => {
            setOwner(e.target.value);
            if (setState) {
              setState({ ...state, owner: e.target.value });
            }
          }}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: user.name,
          }))}
          sx={inputStyles}
          placeholder="Select owner"
        />

        <Select
          id="Reviewer"
          label="Reviewer:"
          value={reviewer}
          onChange={(e) => {
            setReviewer(e.target.value);
            if (setState) {
              setState({ ...state, reviewer: e.target.value });
            }
          }}
          items={users.map((user) => ({
            _id: `${user.name} ${user.surname}`,
            name: user.name,
          }))}
          sx={inputStyles}
          placeholder="Select reviewer"
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
                date: formatDate(newDate.format("YYYY-MM-DD")),
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
          height: 73,
          borderRadius: theme.shape.borderRadius,
          "& .MuiInputBase-root": {
            height: "73px",
          },
          "& .MuiOutlinedInput-input": {
            paddingTop: "20px",
          },
          marginBottom: theme.spacing(4),
        }}
      >
        {" "}
        {isControl ? (
          <Field
            type="description"
            sx={{
              cursor: "text",
            }}
            value={controlDescription}
            onChange={(e) => {
              setControlDescription(e.target.value);
              if (setState) {
                setState({ ...state, description: e.target.value });
              }
            }}
          />
        ) : (
          <Field
            type="description"
            sx={{
              cursor: "text",
            }}
            value={subControlDescription}
            onChange={(e) => {
              setsubControlDescription(e.target.value);
              if (setState) {
                setState({ ...state, subControlDescription: e.target.value });
              }
            }}
          />
        )}
      </Stack>
    </Stack>
  );
};

export default DropDowns;
