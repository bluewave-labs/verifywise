import { Stack, Typography, useTheme } from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import Field from "../../../components/Inputs/Field";

const VWProjectForm = () => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        width: 800,
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
      }}
    >
      <Stack
        className="vwproject-form-header"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Stack className="vwproject-form-header-text">
          <Typography
            sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
          >
            Create new project
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            Create a new project from scratch by filling in the following.
          </Typography>
        </Stack>
        <ClearIcon sx={{ color: "#98A2B3" }} />
      </Stack>
      <Stack className="vwproject-form-body">
        <Stack className="vwproject-form-body-start">
          <Field
            id="project-title-input"
            label="Project title"
            width="350px"
            sx={{
              backgroundColor: theme.palette.background.main,
              "& input": {
                padding: "0 14px",
              },
            }}
            isRequired
          />
        </Stack>
        <Stack className="vwproject-form-body-end"></Stack>
      </Stack>
    </Stack>
  );
};

export default VWProjectForm;
