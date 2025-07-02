/**
 * This file is currently in use
 */

import "./index.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { ControlCategory as ControlCategoryModel } from "../../../../domain/types/ControlCategory";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ControlsTable from "./ControlsTable";

const Table_Columns = [
  { id: 1, name: "Control Name" },
  { id: 2, name: "Owner" },
  { id: 3, name: "# of Subcontrols" },
  { id: 4, name: "Completion" },
];

interface ControlCategoryProps {
  controlCategory: ControlCategoryModel;
  onComplianceUpdate?: () => void;
  projectId: number;
  projectFrameworkId: number;
  statusFilter?: string;
}

const ControlCategoryTile: React.FC<ControlCategoryProps> = ({
  controlCategory,
  onComplianceUpdate,
  projectId,
  projectFrameworkId,
  statusFilter,
}) => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Stack className="control-category">
      <Accordion
        className="control-category-accordion"
        expanded={expanded === controlCategory.id}
        onChange={handleAccordionChange(controlCategory.id ?? 0)}
        sx={{
          marginTop: "9px",
          border: "1px solid #eaecf0",
          width: "100%",
          marginLeft: "1.5px",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
          margin: 0,
          padding: 0,
          boxShadow: "none",
        }}
      >
        <AccordionSummary
          className="control-category-accordion-summary"
          expandIcon={
            <ExpandMoreIcon
              sx={{
                transform:
                  expanded === controlCategory.id
                    ? "rotate(180deg)"
                    : "rotate(270deg)",
                transition: "transform 0.5s ease-in",
              }}
            />
          }
        >
          <Typography
            className="new-compliance-tracker-details-accordion-summary-title"
            fontSize={13}
          >
            {controlCategory.order_no} {controlCategory.title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          className="control-category-accordion-details"
          sx={{ padding: 0 }}
        >
          <ControlsTable
            controlCategoryId={controlCategory.id ?? 1}
            controlCategoryIndex={controlCategory.order_no ?? 1}
            columns={Table_Columns}
            onComplianceUpdate={onComplianceUpdate}
            projectId={projectId}
            projectFrameworkId={projectFrameworkId}
            statusFilter={statusFilter}
          />
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

export default ControlCategoryTile;
