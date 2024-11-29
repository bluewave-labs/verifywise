import "./index.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import {
  complianceMetrics,
  complianceDetails,
} from "../../mocks/compliance.data";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ControlGroups } from "../../structures/ComplianceTracker/controls";
import { useState } from "react";
import BasicTable from "../../components/Table";

const Table_Columns = [
  { id: 1, name: "Icon" },
  { id: 2, name: "Control Name" },
  { id: 3, name: "Owner" },
  { id: 4, name: "# of Subcontrols" },
  { id: 5, name: "Completion" },
];

const NewComplianceTracker = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const renderAccordion = (
    controlGroupIndex: number,
    controlGroupTitle: string
  ) => {
    const controlDetails =
      complianceDetails[controlGroupTitle as keyof typeof complianceDetails];
    console.log("renderAccordion, controlDetails: ", controlDetails);
    return (
      <Stack className="new-compliance-tracker-details" key={controlGroupIndex}>
        <Accordion className="new-compliance-tracker-details-accordion">
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
              {controlGroupTitle}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <BasicTable
              data={{ cols: Table_Columns, rows: [] }}
              table="TableOfSubControllers"
            />
          </AccordionDetails>
        </Accordion>
      </Stack>
    );
  };

  return (
    <Stack className="new-compliance-tracker">
      <Typography className="new-compliance-tracker-title">
        Compliance Tracker
      </Typography>
      <Stack className="new-compliance-tracker-metrics">
        {complianceMetrics.map((metric, metricIndex) => (
          <Stack className="metric-card" key={metricIndex}>
            <Typography className="metric-card-name">{metric.name}</Typography>
            <Typography className="metric-card-amount">
              {metric.amount}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {ControlGroups.map((controlGroup) =>
        renderAccordion(controlGroup.id, controlGroup.controlGroupTitle)
      )}
    </Stack>
  );
};

export default NewComplianceTracker;
