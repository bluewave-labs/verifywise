import { Stack, Typography, useTheme, SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import { Dayjs } from "dayjs";
import { getAllEntities } from "../../../../application/repository/entity.repository";

// Add interface for user type
export interface User {
  id: number;
  name: string;
  email: string;
}

interface DropDownsProps {
  elementId?: string;
  state?: any;
  setState?: (newState: any) => void;
}

const DropDowns: React.FC<DropDownsProps> = ({ elementId, state = {} }) => {
  const [status, setStatus] = useState<string | number>(state?.status || ""); // Default to empty string
  const [approver, setApprover] = useState<string | number>(
    state?.approver || ""
  ); // Default to empty string
  const [riskReview, setRiskReview] = useState<string | number>(
    state?.riskReview || ""
  ); // Default to empty string
  const [owner, setOwner] = useState<string | number>(state?.owner || ""); // Default to empty string
  const [reviewer, setReviewer] = useState<string | number>(
    state?.reviewer || ""
  ); // Default to empty string
  const [date, setDate] = useState<Dayjs | null>(state?.date || null);
  const theme = useTheme();

  const inputStyles = {
    minWidth: 200,
    maxWidth: 400,
    flexGrow: 1,
    height: 34,
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    setDate(newDate);
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
    console.log(selectedUser);
    setApprover(selectedValue);
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
          onChange={(e) => setStatus(e.target.value)}
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
            _id: user.id,
            name: user.name,
          }))}
          sx={inputStyles}
          placeholder="Select approver"
        />

        <Select
          id="Risk review"
          label="Risk review:"
          value={riskReview}
          onChange={(e) => setRiskReview(e.target.value)}
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
          onChange={(e) => setOwner(e.target.value)}
          items={users.map((user) => ({ _id: user.id, name: user.name }))}
          sx={inputStyles}
          placeholder="Select owner"
        />

        <Select
          id="Reviewer"
          label="Reviewer:"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          items={users.map((user) => ({ _id: user.id, name: user.name }))}
          sx={inputStyles}
          placeholder="Select reviewer"
        />

        <DatePicker
          label="Due date:"
          sx={inputStyles}
          date={date}
          handleDateChange={handleDateChange}
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
        <Field
          type="description"
          sx={{
            cursor: "text",
          }}
        />
      </Stack>
    </Stack>
  );
};

export default DropDowns;
