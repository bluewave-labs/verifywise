import "./index.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { complianceMetrics } from "../../mocks/compliance.data";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ControlGroups } from "../../structures/ComplianceTracker/controls";
import { useState } from "react";
import AccordionTable from "../../components/Table/AccordionTable";

const Table_Columns = [
  { id: 1, name: "Icon" },
  { id: 2, name: "Control Name" },
  { id: 3, name: "Owner" },
  { id: 4, name: "# of Subcontrols" },
  { id: 5, name: "Completion" },
];

const NewComplianceTracker = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

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
      <Stack className="new-compliance-tracker-details" key={controlGroupIndex}>
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
            {/* <BasicTable
              data={{ cols: Table_Columns, rows: control }}
              table="TableOfSubControllers"
            /> */}
            <AccordionTable
              id={controlGroupIndex}
              cols={Table_Columns}
              rows={controls}
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
