import { Stack, Button, Typography, useTheme, Paper } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";

const Assessment = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const paperStyle = {
    backgroundColor: theme.palette.background.main,
    ...theme.typography.body2,
    padding: theme.spacing(1),
    border: "1px solid",
    borderColor: theme.palette.border.light,
    boxShadow: "none",
    paddingRight: "150px",
    paddingLeft: "25px",
    paddingTop: "10px",
    paddingBottom: "10px",
    width: "calc(100% - 150px - 25px)",
    minWidth: "300px",
    maxWidth: "80%",
  };

  /**
   * TBD: Handle Go to Assessments button click
   */
  const handleAssessment = () => {
    navigate("/all-assessments");
  };

  return (
    <div className="assessment-page">
      <Stack
        gap={theme.spacing(2)}
        sx={{ backgroundColor: theme.palette.background.alt }}
      >
        <Typography
          variant="h1"
          component={"div"}
          fontWeight={"bold"}
          fontSize={"16px"}
          color={theme.palette.text.primary}
        >
          Assessment tracker
        </Typography>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          display={"flex"}
          gap={theme.spacing(10)}
          sx={{ maxWidth: 1400, marginTop: "20px" }}
        >
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent}>
              Assessment completion
            </Typography>
            <Typography
              fontWeight={"bold"}
              fontSize={"16px"}
              color={theme.palette.text.primary}
            >
              85%
            </Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent}>
              Pending assessments
            </Typography>
            <Typography
              fontWeight={"bold"}
              fontSize={"16px"}
              color={theme.palette.text.primary}
            >
              2
            </Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent}>
              Approved assessments
            </Typography>
            <Typography
              fontWeight={"bold"}
              fontSize={"16px"}
              color={theme.palette.text.primary}
            >
              12
            </Typography>
          </Paper>
        </Stack>
        <Typography
          variant="h5"
          fontWeight={"bold"}
          fontSize={"16px"}
          color={theme.palette.text.primary}
          sx={{ marginTop: "32px" }}
        >
          Ongoing assessments
        </Typography>
        <Typography fontSize={"14px"} color={theme.palette.text.secondary}>
          Those are the assessments you started. Each assessment has a
          completion status on the left hand side of the table.
        </Typography>
        <Stack>
          <Button
            disableRipple={
              theme.components?.MuiButton?.defaultProps?.disableRipple
            }
            variant="contained"
            sx={{
              ...singleTheme.buttons.primary,
              width: "fit-content",
              height: 34,
              marginTop: "20px",
            }}
            onClick={() => {
              handleAssessment();
            }}
          >
            Go to assessments
          </Button>
        </Stack>
      </Stack>
    </div>
  );
};

export default Assessment;
