import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { accordionStyle } from "../style";
import { useState } from "react";
import { ISO42001ClauseList } from "./clause.structure";
import VWISO42001ClauseDrawerDialog from "../../../components/Drawer/ClauseDrawerDialog";
import { Project } from "../../../../domain/types/Project";

const ISO42001Clauses = ({
  project,
  framework_id,
}: {
  project: Project;
  framework_id: number;
}) => {
  console.log("project", project);
  console.log("framework_id", framework_id);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubClause, setSelectedSubClause] = useState<any>(null);
  const [selectedClause, setSelectedClause] = useState<any>(null);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleSubClauseClick = (clause: any, subClause: any) => {
    setSelectedClause(clause);
    setSelectedSubClause(subClause);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSubClause(null);
    setSelectedClause(null);
  };

  function getStatusColor(status: string) {
    switch (status) {
      case "Not Started":
        return "#C63622";
      case "Draft":
        return "#D68B61";
      case "In Review":
        return "#D6B971";
      case "Approved":
        return "#52AB43";
      case "Implemented":
        return "#B8D39C";
      case "Needs Rework":
        return "#800080";
    }
  }

  return (
    <Stack className="iso-42001-clauses">
      {ISO42001ClauseList.map((clause) => (
        <>
          <Typography
            key={clause.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            {clause.title} {" Clauses"}
          </Typography>
          {clause.clauses.map((clause) => (
            <Stack
              key={clause.number}
              sx={{
                maxWidth: "1400px",
                marginTop: "14px",
                gap: "20px",
              }}
            >
              <Accordion
                key={clause.number}
                expanded={expanded === clause.number}
                sx={{
                  ...accordionStyle,
                  ".MuiAccordionDetails-root": {
                    padding: 0,
                    margin: 0,
                  },
                }}
                onChange={handleAccordionChange(clause.number ?? 0)}
              >
                <AccordionSummary
                  sx={{
                    backgroundColor: "#fafafa",
                    flexDirection: "row-reverse",
                  }}
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform:
                          expanded === clause.number
                            ? "rotate(180deg)"
                            : "rotate(270deg)",
                        transition: "transform 0.5s ease-in",
                      }}
                    />
                  }
                >
                  <Typography
                    sx={{
                      paddingLeft: "2.5px",
                      fontSize: 13,
                    }}
                  >
                    {"Clause "} {clause.number} {" : "} {clause.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {clause.subClauses.map((subClause) => (
                    <Stack
                      key={subClause.number}
                      onClick={() => handleSubClauseClick(clause, subClause)}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: "16px",
                        borderBottom:
                          clause.subClauses.length - 1 ===
                          clause.subClauses.indexOf(subClause)
                            ? "none"
                            : "1px solid #eaecf0",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <Typography>
                        {clause.number + "." + subClause.number}{" "}
                        {subClause.title}
                      </Typography>
                      <Stack
                        sx={{
                          borderRadius: "4px",
                          padding: "5px",
                          backgroundColor: getStatusColor(subClause.status),
                          color: "#fff",
                        }}
                      >
                        {subClause.status}
                      </Stack>
                    </Stack>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Stack>
          ))}
        </>
      ))}
      <VWISO42001ClauseDrawerDialog
        open={drawerOpen}
        onClose={handleDrawerClose}
        subClause={selectedSubClause}
        clause={selectedClause}
      />
    </Stack>
  );
};

export default ISO42001Clauses;
