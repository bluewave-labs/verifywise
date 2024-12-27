import { Stack, Typography, useTheme, SelectChangeEvent } from "@mui/material";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";
import { Dayjs } from "dayjs";

interface State {
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  owner: string | number;
  reviewer: string | number;
  description: string;
  date: Dayjs | null;
}

const inputStyles = {
  minWidth: 200,
  maxWidth: 400,
  flexGrow: 1,
  height: 34,
};

const DropDowns = ({
  elementId,
  state,
  setState,
}: {
  elementId: string;
  state: State;
  setState: (newState: Partial<State>) => void;
}) => {
  const theme = useTheme();

  const handleSelectChange =
    (field: keyof State) => (event: SelectChangeEvent<string | number>) => {
      setState({ [field]: event.target.value });
    };

  const handleDateChange = (newDate: Dayjs | null) => {
    setState({ date: newDate });
  };

  return (
    <Stack style={{ gap: theme.spacing(8) }}>
      <Stack
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={theme.spacing(15)}
      >
        <Stack sx={{ flexDirection: "row", columnGap: 13, mb: 10 }}>
          <Stack
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: theme.spacing(8.5),
              width: "100%",
              "& > *": {
                minWidth: "200px",
                maxWidth: "324px"
              }
            }}
          >
            <Select
              id={`${elementId}-status`}
              label="Status:"
              value={state.status}
              onChange={handleSelectChange("status")}
              items={[
                { _id: "Choose status", name: "Choose status" },
                { _id: "Waiting", name: "Waiting" },
                { _id: "In progress", name: "In progress" },
                { _id: "Done", name: "Done" },
              ]}
              sx={inputStyles}
            />

            <Select
              id={`${elementId}-approver`}
              label="Approver:"
              value={state.approver}
              onChange={handleSelectChange("approver")}
              items={[
                { _id: "Choose approver", name: "Choose approver" },
                { _id: "approver 1", name: "approver 1" },
                { _id: "approver 2", name: "approver 2" },
                { _id: "approver 3", name: "approver 3" },
              ]}
              sx={inputStyles}
            />

            <Select
              id={`${elementId}-riskReview`}
              label="Risk review:"
              value={state.riskReview}
              onChange={handleSelectChange("riskReview")}
              items={[
                { _id: "Choose risk review", name: "Choose risk review" },
                { _id: "Acceptable risk", name: "Acceptable risk" },
                { _id: "Residual risk", name: "Residual risk" },
                { _id: "Unacceptable risk", name: "Unacceptable risk" },
              ]}
              sx={inputStyles}
            />

            <Select
              id={`${elementId}-owner`}
              label="Owner:"
              value={state.owner}
              onChange={handleSelectChange("owner")}
              items={[
                { _id: "Choose owner", name: "Choose owner" },
                { _id: "owner 1", name: "owner 1" },
                { _id: "owner 2", name: "owner 2" },
                { _id: "owner 3", name: "owner 3" },
              ]}
              sx={inputStyles}
            />

            <Select
              id={`${elementId}-reviewer`}
              label="Reviewer:"
              value={state.reviewer}
              onChange={handleSelectChange("reviewer")}
              items={[
                { _id: "Choose reviewer", name: "Choose reviewer" },
                { _id: "reviewer 1", name: "reviewer 1" },
                { _id: "reviewer 2", name: "reviewer 2" },
                { _id: "reviewer 3", name: "reviewer 3" },
              ]}
              sx={inputStyles}
            />

            <DatePicker
              label="Due date:"
              sx={inputStyles}
              date={state.date}
              handleDateChange={handleDateChange}
            />
          </Stack>
        </Stack>
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
          value={state.description}
          onChange={(e) => setState({ description: e.target.value })}
        />
      </Stack>
    </Stack>
  );
};

export default DropDowns;
