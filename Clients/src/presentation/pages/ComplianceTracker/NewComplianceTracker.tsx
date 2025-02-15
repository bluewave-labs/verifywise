import "./index.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useContext, useEffect, useState } from "react";
import AccordionTable from "../../components/Table/AccordionTable";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getAllEntities,
  getEntityById,
} from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import NoProject from "../../components/NoProject/NoProject";

const Table_Columns = [
  { id: 1, name: "Control Name" },
  { id: 2, name: "Owner" },
  { id: 3, name: "# of Subcontrols" },
  { id: 4, name: "Completion" },
];

const NewComplianceTracker = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const [runComplianceTour, setRunComplianceTour] = useState(false);
  const { setDashboardValues, dashboardValues } = useContext(VerifyWiseContext);
  const { projects } = dashboardValues;
  const [complianceStatus, setComplianceStatus] = useState({
    allTotalSubControls: 0,
    allDoneSubControls: 0,
    complianceStatus: 0,
  });

  const [fetchedControlCategories, setFetchedControlCategories] = useState<
    any[]
  >([]);

  const fetchControlCategoriesByProjectId = async (projectId: number) => {
    try {
      const response = await getEntityById({
        routeUrl: `/projects/complainces/${projectId}`,
      });
      setFetchedControlCategories(response.data);
      console.log(
        "Filtered control categories by project ID:",
        fetchedControlCategories
      );
    } catch (error) {
      console.error("Error fetching control categories by project ID:", error);
    }
  };

  useEffect(() => {
    const selectedProjectId = localStorage.getItem("selectedProjectId");
    if (selectedProjectId) {
      console.log("Selected project ID from localStorage:", selectedProjectId);
      const projectId = parseInt(selectedProjectId, 10); // Convert string to number
      fetchControlCategoriesByProjectId(projectId);
    }
  }, []);

  const complianceSteps = [
    {
      target: '[data-joyride-id="compliance-title"]',
      content: (
        <CustomStep body="Here you'll see a list of controls related to the regulation you selected." />
      ),
      placement: "left" as const,
    },
    {
      target: '[data-joyride-id="compliance-metrics"]',
      content: (
        <CustomStep body="Check the status of your compliance tracker here." />
      ),
      placement: "bottom" as const,
    },
    {
      target: '[data-joyride-id="compliance-accordion"]',
      content: (
        <CustomStep body="Those are the groups where controls and subcontrols reside. As you fill them, your statistics will improve." />
      ),
      placement: "bottom" as const,
    },
  ];

  const fetchComplianceTracker = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/controls" });
      console.log("Response:", response);
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        compliance: response.data,
      }));
    } catch (error) {
      console.error("Error fetching compliance tracker:", error);
    }
  };

  const fetchComplianceTrackerCalculation = async () => {
    try {
      const response = await getAllEntities({
        routeUrl: "/users/1/calculate-progress",
      });

      setComplianceStatus({
        allTotalSubControls: response.allTotalSubControls,
        allDoneSubControls: response.allDoneSubControls,
        complianceStatus: Number(
          (
            ((response.allDoneSubControls ?? 0) /
              (response.allTotalSubControls ?? 1)) *
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
    fetchComplianceTracker();
    setRunComplianceTour(true);
  }, []);

  const handleAccordionChange = (panel: number) => {
    return (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  };

  const renderAccordion = (
    controlGroupId: number,
    controlGroupIndex: number,
    controlGroupTitle: string,
    controls: any
  ) => {
    return (
      <Stack
        data-joyride-id="compliance-accordion"
        className="new-compliance-tracker-details"
        key={controlGroupIndex}
      >
        <Accordion
          className="new-compliance-tracker-details-accordion"
          onChange={handleAccordionChange(controlGroupId)}
        >
          <AccordionSummary
            className="new-compliance-tracker-details-accordion-summary"
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  transform:
                    expanded === controlGroupId
                      ? "rotate(180deg)"
                      : "rotate(270deg)",
                  transition: "transform 0.5s ease-in",
                }}
              />
            }
          >
            <Typography className="new-compliance-tracker-details-accordion-summary-title">
              {controlGroupIndex} {controlGroupTitle}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AccordionTable
              id={controlGroupId}
              cols={Table_Columns}
              rows={controls}
              controlCategoryId={controlGroupIndex.toString()}
            />
          </AccordionDetails>
        </Accordion>
      </Stack>
    );
  };

  return (
    <Stack className="new-compliance-tracker">
      <PageTour
        steps={complianceSteps}
        run={runComplianceTour}
        onFinish={() => setRunComplianceTour(false)}
      />
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
        Compliance tracker
      </Typography>

      {projects?.length > 0 ? (
        <>
          <Stack
            className="new-compliance-tracker-metrics"
            data-joyride-id="compliance-metrics"
          >
            <Stack className="metric-card">
              <Typography className="metric-card-name">
                Compliance Status
              </Typography>
              <Typography className="metric-card-amount">
                {`${complianceStatus.complianceStatus}%`}
              </Typography>
            </Stack>

            <Stack className="metric-card">
              <Typography className="metric-card-name">
                Total number of subcontrols
              </Typography>
              <Typography className="metric-card-amount">
                {complianceStatus.allTotalSubControls}
              </Typography>
            </Stack>

            <Stack className="metric-card">
              <Typography className="metric-card-name">
                Implemented subcontrols
              </Typography>
              <Typography className="metric-card-amount">
                {complianceStatus.allDoneSubControls} {" %"}
              </Typography>
            </Stack>
          </Stack>

          {fetchedControlCategories.map((controlGroup) => {
            return renderAccordion(
              controlGroup.id,
              controlGroup.order_no,
              controlGroup.title,
              controlGroup.controls
            );
          })}
        </>
      ) : (
        <NoProject message="You have no projects. First create a project on the main dashboard to see the Compliance Tracker." />
      )}
    </Stack>
  );
};

export default NewComplianceTracker;
