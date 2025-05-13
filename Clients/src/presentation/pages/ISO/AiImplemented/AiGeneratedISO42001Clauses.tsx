import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  CircularProgress,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import { accordionStyle } from "../style";
import { ISO42001ClauseList } from "../Clause/clause.structure";
import VWISO42001ClauseDrawerDialog from "../../../components/Drawer/ClauseDrawerDialog";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

interface AIAnalysis {
  confidence: number;
  suggestions: string[];
  lastUpdated: Date;
}

const AiGeneratedISO42001Clauses = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubClause, setSelectedSubClause] = useState<any>(null);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, AIAnalysis>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const simulateAIAnalysis = async (subClauseId: number) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAiAnalysis((prev) => ({
        ...prev,
        [subClauseId]: {
          confidence: Math.random() * 100,
          suggestions: [
            "Consider implementing automated testing",
            "Add documentation for deployment process",
            "Review security measures",
          ],
          lastUpdated: new Date(),
        },
      }));
    } catch (err) {
      console.error("Error during AI analysis:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "#4CAF50";
    if (confidence >= 60) return "#FFC107";
    return "#F44336";
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
    <Stack className="ai-generated-clauses" sx={{ gap: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography
          variant="h5"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AutoAwesomeIcon /> AI-Generated ISO 42001 Clauses
        </Typography>
        <Tooltip title="Refresh AI Analysis">
          <IconButton
            onClick={() => {
              setIsAnalyzing(true);
              // Simulate refreshing all analyses
              setTimeout(() => setIsAnalyzing(false), 2000);
            }}
            disabled={isAnalyzing}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {isAnalyzing && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
          <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
            Analyzing clauses with AI...
          </Typography>
        </Box>
      )}

      {ISO42001ClauseList.map((clause) => (
        <motion.div
          key={clause.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography
            sx={{
              color: "#1A1919",
              fontWeight: 600,
              mb: "12px",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
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
                  border: "1px solid #eaecf0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  "&:before": { display: "none" },
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
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform:
                          expanded === clause.number
                            ? "rotate(180deg)"
                            : "rotate(270deg)",
                        transition: "transform 0.3s ease-in",
                      }}
                    />
                  }
                >
                  <Typography sx={{ fontWeight: 500 }}>
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
                        alignItems: "center",
                        padding: "16px",
                        borderBottom:
                          clause.subClauses.length - 1 ===
                          clause.subClauses.indexOf(subClause)
                            ? "none"
                            : "1px solid #eaecf0",
                        cursor: "pointer",
                        fontSize: 13,
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                        },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Typography>
                          {clause.number + "." + subClause.number}{" "}
                          {subClause.title}
                        </Typography>
                        {aiAnalysis[subClause.number] && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={`${Math.round(
                                aiAnalysis[subClause.number].confidence
                              )}% Confidence`}
                              size="small"
                              sx={{
                                backgroundColor: getConfidenceColor(
                                  aiAnalysis[subClause.number].confidence
                                ),
                                color: "white",
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Last analyzed:{" "}
                              {aiAnalysis[
                                subClause.number
                              ].lastUpdated.toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={subClause.status}
                          sx={{
                            backgroundColor: getStatusColor(subClause.status),
                            color: "white",
                            minWidth: "100px",
                            alignItems: "center",
                          }}
                        />
                        <Tooltip title="Analyze with AI">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              simulateAIAnalysis(subClause.number);
                            }}
                            disabled={isAnalyzing}
                          >
                            <AutoAwesomeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Stack>
          ))}
        </motion.div>
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
