import { memo, useState, useEffect, useRef } from "react";
import { Stack, Typography, useTheme, Paper, Divider } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import { Theme } from "@mui/material/styles";
import { SxProps } from "@mui/system";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import { getAllEntities } from "../../../application/repository/entity.repository";
import AllAssessment from "./NewAssessment/AllAssessments";

// Define styles outside the component to avoid recreation on each render
const usePaperStyle = (theme: Theme): SxProps<Theme> => ({
  backgroundColor: theme.palette.background.main,
  ...theme.typography.body2,
  padding: theme.spacing(1),
  border: "1px solid",
  borderColor: theme.palette.border.light,
  boxShadow: "none",
  paddingRight: "100px",
  paddingLeft: "25px",
  paddingTop: "10px",
  paddingBottom: "10px",
  width: "calc(100% - 150px - 25px)",
  minWidth: "300px",
  maxWidth: "80%",
});

const Assessment = memo(() => {
  const theme = useTheme();
  const paperStyle = usePaperStyle(theme);
  const [runAssessmentTour, setRunAssessmentTour] = useState(false);
  const [assessmentsStatus, setAssessmentsStatus] = useState({
    allAssessments: 0,
    allDoneAssessments: 0,
    AssessmentsCompletion: 0,
  });
  const hasScrolledRef = useRef(false);

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
    if (!hasScrolledRef.current) {
      window.scrollTo(0, 0);
      hasScrolledRef.current = true;
    }
  }, []);

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
        variant="h2"
        component="div"
        sx={{
          pb: 8.5,
          color: "#1A1919",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Assessment tracker
      </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          display="flex"
          gap={theme.spacing(10)}
          sx={{ maxWidth: 1400, marginTop: "10px" }}
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
        <Divider sx={{ marginY: 10 }} />
        <AllAssessment />
      </Stack>
    </div>
  );
});

export default Assessment;
