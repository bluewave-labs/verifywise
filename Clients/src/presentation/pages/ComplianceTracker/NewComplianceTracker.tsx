import "./index.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ControlGroups } from "../../structures/ComplianceTracker/controls";
import { useContext, useEffect, useState } from "react";
import AccordionTable from "../../components/Table/AccordionTable";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { getAllEntities } from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import { Theme } from "@mui/material/styles";
import { SxProps } from "@mui/system";

const Table_Columns = [
  { id: 1, name: "Icon" },
  { id: 2, name: "Control Name" },
  { id: 3, name: "Owner" },
  { id: 4, name: "# of Subcontrols" },
  { id: 5, name: "Completion" },
];

const NewComplianceTracker = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<number | false>(false);

  const [runComplianceTour, setRunComplianceTour] = useState(false);
  const { setDashboardValues } = useContext(VerifyWiseContext);
  const [complianceStatus, setComplianceStatus] = useState({
    allTotalSubControls: 0,
    allDoneSubControls: 0,
    complianceStatus: 0,
  });

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
          onChange={handleAccordionChange(controlGroupIndex)}
        >
          <AccordionSummary
            className="new-compliance-tracker-details-accordion-summary"
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  transform:
                    expanded === controlGroupIndex
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
              id={controlGroupIndex}
              cols={Table_Columns}
              rows={controls}
              controlCategory={controlGroupTitle}
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
      <Stack
        className="new-compliance-tracker-metrics"
        data-joyride-id="compliance-metrics"
      >
        <Stack className="metric-card">
          <Typography className="metric-card-name">
            Compliance Status
          </Typography>
          <Typography className="metric-card-amount">
            {complianceStatus.complianceStatus}
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
      {ControlGroups.map((controlGroup) =>
        renderAccordion(
          controlGroup.id,
          controlGroup.controlGroupTitle,
          controlGroup.control.controls
        )
      )}
    </Stack>
  );
};

export default NewComplianceTracker;
