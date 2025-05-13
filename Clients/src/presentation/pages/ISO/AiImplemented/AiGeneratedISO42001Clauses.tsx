import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { accordionStyle } from "../style";
import { ISO42001ClauseList } from "../Clause/clause.structure";
import VWISO42001ClauseDrawerDialog from "../../../components/Drawer/ClauseDrawerDialog";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";

const AiGeneratedISO42001Clauses = () => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubClause, setSelectedSubClause] = useState<any>(null);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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
      default:
        return "#808080";
    }
  }

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      try {
        // In a real implementation, you would fetch data here
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        console.error("Error loading AI generated clauses:", err);
        setError(err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Stack className="ai-generated-clauses" sx={{ gap: "16px" }}>
        <Typography sx={pageHeadingStyle}>
          AI Generated ISO 42001 Clauses
        </Typography>
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: "400px" }}
        >
          <CircularProgress />
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack className="ai-generated-clauses" sx={{ gap: "16px" }}>
        <Typography sx={pageHeadingStyle}>
          AI Generated ISO 42001 Clauses
        </Typography>
        <Typography color="error">
          Error loading AI generated clauses
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack className="ai-generated-clauses" sx={{ gap: "16px" }}>
      <Typography sx={pageHeadingStyle}>
        AI Generated ISO 42001 Clauses
      </Typography>
      {ISO42001ClauseList.map((clause) => (
        <Stack key={clause.id}>
          <Typography
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
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
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
                          minWidth: "100px",
                          alignItems: "center",
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
        </Stack>
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

export default AiGeneratedISO42001Clauses;
