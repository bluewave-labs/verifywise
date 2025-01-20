import { memo, useCallback, useState, useEffect } from "react";
import { Stack, Button, Typography, useTheme, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import singleTheme from "../../themes/v1SingleTheme";
import { Theme } from "@mui/material/styles";
import { SxProps } from "@mui/system";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import { getAllEntities } from "../../../application/repository/entity.repository";

// Define styles outside the component to avoid recreation on each render
const usePaperStyle = (theme: Theme): SxProps<Theme> => ({
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
});

const Assessment = memo(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const paperStyle = usePaperStyle(theme);
  const [runAssessmentTour, setRunAssessmentTour] = useState(false);
  const [assessmentsStatus, setAssessmentsStatus] = useState({
    allAssessments: 0,
    allDoneAssessments: 0,
    AssessmentsCompletion: 0,
  });

  const assessmentSteps = [
    {
      target: '[data-joyride-id="assessment-status"]',
      content: (
        <CustomStep body="Check the status of your assessment tracker here." />
      ),
      placement: "left" as const,
    },
    {
      target: '[data-joyride-id="go-to-assessments"]',
      content: (
        <CustomStep body="Go to your assessments and start filling in the assessment questions for you project." />
      ),
      placement: "bottom" as const,
    },
  ];

  const fetchComplianceTrackerCalculation = async () => {
    try {
      const response = await getAllEntities({
        routeUrl: "/users/1/calculate-progress",
      });

      setAssessmentsStatus({
        allAssessments: response.allTotalAssessments ?? 0,
        allDoneAssessments: response.allDoneAssessments,
        AssessmentsCompletion: Number(
          (
            ((response.allDoneAssessments ?? 0) /
              (response.allTotalAssessments ?? 1)) *
            100
          ).toFixed(2)
        ),
      });

      console.log("Response for fetchComplianceTrackerCalculation:", response);
    } catch (error) {
      console.error("Error fetching compliance tracker:", error);
    }
  };

  useEffect(() => {
    fetchComplianceTrackerCalculation();
    setRunAssessmentTour(true);
  }, []);

  const handleAssessment = useCallback(() => {
    navigate("/all-assessments");
  }, [navigate]);

  return (
    <div className="assessment-page">
      <PageTour
        steps={assessmentSteps}
        run={runAssessmentTour}
        onFinish={() => setRunAssessmentTour(false)}
      />
      <Stack
        gap={theme.spacing(2)}
        sx={{ backgroundColor: theme.palette.background.alt }}
      >
        <Typography
          data-joyride-id="assessment-status"
          variant="h1"
          component="div"
          fontWeight="600"
          fontSize="16px"
          color={theme.palette.text.primary}
          sx={{ ...singleTheme.textStyles.pageTitle, fontFamily: "Inter" }}
          marginBottom={12}
        >
          Assessment tracker
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          display="flex"
          gap={theme.spacing(10)}
          sx={{ maxWidth: 1400, marginTop: "20px" }}
        >
          <Paper sx={paperStyle}>
            <Typography fontSize="12px" color={theme.palette.text.accent}>
              Assessment completion
            </Typography>
            <Typography
              fontWeight="bold"
              fontSize="16px"
              color={theme.palette.text.primary}
            >
              {assessmentsStatus.AssessmentsCompletion} {" %"}
            </Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize="12px" color={theme.palette.text.accent}>
              Total assessments
            </Typography>
            <Typography
              fontWeight="bold"
              fontSize="16px"
              color={theme.palette.text.primary}
            >
              {assessmentsStatus.allAssessments}
            </Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize="12px" color={theme.palette.text.accent}>
              Implemented assessments
            </Typography>
            <Typography
              fontWeight="bold"
              fontSize="16px"
              color={theme.palette.text.primary}
            >
              {assessmentsStatus.allDoneAssessments}
            </Typography>
          </Paper>
        </Stack>
        <Typography
          variant="h5"
          fontWeight="bold"
          fontSize="16px"
          color={theme.palette.text.primary}
          sx={{ marginTop: "32px" }}
        >
          Ongoing assessments
        </Typography>
        <Typography fontSize="14px" color={theme.palette.text.secondary}>
          Those are the assessments you started. Each assessment has a
          completion status on the left hand side of the table.
        </Typography>
        <Stack>
          <Button
            data-joyride-id="go-to-assessments"
            disableRipple={
              theme.components?.MuiButton?.defaultProps?.disableRipple
            }
            variant="contained"
            sx={{
              ...singleTheme.buttons.primary,
              width: "fit-content",
              height: 34,
              marginTop: "20px",
              "&:hover": {
                backgroundColor: "#175CD3 ",
              },
            }}
            onClick={handleAssessment}
          >
            Go to assessments
          </Button>
        </Stack>
      </Stack>
    </div>
  );
});

export default Assessment;
