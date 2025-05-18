import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { accordionStyle } from "../style";
import { useState, useEffect } from "react";
import { ISO42001ClauseList } from "./clause.structure";
import VWISO42001ClauseDrawerDialog from "../../../components/Drawer/ClauseDrawerDialog";
import { Project } from "../../../../domain/types/Project";
import { GetClausesByProjectFrameworkId } from "../../../../application/repository/clause_struct_iso.repository";
import { ClauseStructISO } from "../../../../domain/types/ClauseStructISO";
import { SubClauseISO } from "../../../../domain/types/SubClauseISO";
import { SubClauseStructISO } from "../../../../domain/types/SubClauseStructISO";

const ISO42001Clauses = ({
  projectFrameworkId,
}: {
  project: Project;
  framework_id: number;
  projectFrameworkId: number;
}) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubClause, setSelectedSubClause] = useState<any>(null);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [clauses, setClauses] = useState<ClauseStructISO[]>([]);

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const response = await GetClausesByProjectFrameworkId({
          routeUrl: `/iso-42001/clauses/byProjectId/${projectFrameworkId}`,
        });
        setClauses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching clauses:", error);
        setClauses([]);
      }
    };

    fetchClauses();
  }, [projectFrameworkId]);

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
    const normalizedStatus = status?.trim() || "Not Started";
    switch (normalizedStatus.toLowerCase()) {
      case "not started":
        return "#C63622";
      case "draft":
        return "#D68B61";
      case "in review":
        return "#D6B971";
      case "approved":
        return "#52AB43";
      case "implemented":
        return "#B8D39C";
      case "needs rework":
        return "#800080";
      default:
        return "#C63622"; // Default to "Not Started" color
    }
  }

  return (
    <Stack className="iso-42001-clauses">
      {ISO42001ClauseList.map((item) => (
        <>
          <Typography
            key={item.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            {item.title} {" Clauses"}
          </Typography>
          {Array.isArray(clauses) && clauses.length > 0 ? (
            clauses.map((clause: ClauseStructISO) => (
              <Stack
                key={clause.id}
                sx={{
                  maxWidth: "1400px",
                  marginTop: "14px",
                  gap: "20px",
                }}
              >
                <Accordion
                  key={clause.id}
                  expanded={expanded === clause.id}
                  sx={{
                    ...accordionStyle,
                    ".MuiAccordionDetails-root": {
                      padding: 0,
                      margin: 0,
                    },
                  }}
                  onChange={handleAccordionChange(clause.id ?? 0)}
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
                            expanded === clause.id
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
                      {clause.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ padding: 0 }}>
                    {clause.subClauses.map(
                      (
                        subClause: Partial<SubClauseISO & SubClauseStructISO>,
                        index: number
                      ) => (
                        <Stack
                          key={subClause.id}
                          onClick={() =>
                            handleSubClauseClick(clause, subClause)
                          }
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
                            {clause.clause_no + "." + (index + 1)}{" "}
                            {subClause.title ?? "Untitled"}
                          </Typography>
                          <Stack
                            sx={{
                              borderRadius: "4px",
                              padding: "5px",
                              backgroundColor: getStatusColor(
                                subClause.status ?? "Not Started"
                              ),
                              color: "#fff",
                            }}
                          >
                            {subClause.status
                              ? subClause.status.charAt(0).toUpperCase() +
                                subClause.status.slice(1).toLowerCase()
                              : "Not started"}
                          </Stack>
                        </Stack>
                      )
                    )}
                  </AccordionDetails>
                </Accordion>
              </Stack>
            ))
          ) : (
            <Typography>No clauses found.</Typography>
          )}
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
