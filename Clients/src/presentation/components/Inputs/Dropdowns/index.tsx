import { Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import dayjs, { Dayjs } from "dayjs";

const DropDowns = () => {
  const [status, setStatus] = useState<string | number>("");
  const [approver, setApprover] = useState<string | number>("");
  const [riskReview, setRiskReview] = useState<string | number>("");
  const [owner, setOwner] = useState<string | number>("");
  const [reviewer, setReviewer] = useState<string | number>("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const theme = useTheme();

  const inputStyles = {
    minWidth: 200,
    maxWidth: 400,
    flexGrow: 1,
    height: 34,
  };

  const handleDateChange = (date: Dayjs | null) => {
    setDueDate(date);
  };

  return (
    <Stack
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
            { _id: 10, name: "Waiting" },
            { _id: 20, name: "In progress" },
            { _id: 30, name: "Done" },
          ]}
          sx={inputStyles}
        />

        <Select
          id="Approver"
          label="Approver:"
          value={approver}
          onChange={(e) => setApprover(e.target.value)}
          items={[
            { _id: 10, name: "Option 1" },
            { _id: 20, name: "Option 2" },
            { _id: 30, name: "Option 3" },
          ]}
          sx={inputStyles}
        />

        <Select
          id="Risk review"
          label="Risk review:"
          value={riskReview}
          onChange={(e) => setRiskReview(e.target.value)}
          items={[
            { _id: 10, name: "Acceptable risk" },
            { _id: 20, name: "Residual risk" },
            { _id: 30, name: "Unacceptable risk" },
          ]}
          sx={inputStyles}
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
          items={[
            { _id: 10, name: "Option 1" },
            { _id: 20, name: "Option 2" },
            { _id: 30, name: "Option 3" },
          ]}
          sx={inputStyles}
        />

        <Select
          id="Reviewer"
          label="Reviewer:"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          items={[
            { _id: 10, name: "Option 1" },
            { _id: 20, name: "Option 2" },
            { _id: 30, name: "Option 3" },
          ]}
          sx={inputStyles}
        />

        <DatePicker label="Due date:" sx={inputStyles} date={dueDate} handleDateChange={handleDateChange} />
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
        <Field type="description" />
      </Stack>
    </Stack>
  );
};

export default DropDowns;
