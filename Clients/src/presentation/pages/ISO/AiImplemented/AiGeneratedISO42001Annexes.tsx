import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import VWISO42001AnnexDrawerDialog from "../../../components/Drawer/AnnexDrawerDialog";
import { ISO42001AnnexList } from "../Annex/annex.structure";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

interface AIAnalysis {
  confidence: number;
  suggestions: string[];
  lastUpdated: Date;
}

const AiGeneratedISO42001Annexes = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, AIAnalysis>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleControlClick = (order: any, annex: any, control: any) => {
    setSelectedOrder(order);
    setSelectedAnnex(annex);
    setSelectedControl(control);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "#C63622";
      case "Draft":
        return "#D68B61";
      case "In Progress":
        return "#D6B971";
      case "Awaiting Review":
        return "#D6B971";
      case "Awaiting Approval":
        return "#D6B971";
      case "Implemented":
        return "#B8D39C";
      case "Audited":
        return "#B8D39C";
      case "Needs Rework":
        return "#800080";
      default:
        return "#666666";
    }
  };

  const simulateAIAnalysis = async (controlId: number) => {
    setIsAnalyzing(true);
    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setAiAnalysis((prev) => ({
      ...prev,
      [controlId]: {
        confidence: Math.random() * 100,
        suggestions: [
          "Consider implementing automated testing",
          "Add documentation for deployment process",
          "Review security measures",
        ],
        lastUpdated: new Date(),
      },
    }));
    setIsAnalyzing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "#4CAF50";
    if (confidence >= 60) return "#FFC107";
    return "#F44336";
  };

  return (
    <Stack className="ai-generated-iso-42001-annexes" sx={{ gap: 3 }}>
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
          <AutoAwesomeIcon /> AI-Generated ISO 42001 Annexes
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
            Analyzing controls with AI...
          </Typography>
        </Box>
      )}

      {ISO42001AnnexList.map((annex) => (
        <motion.div
          key={annex.id}
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
            Annex {annex.order}: {annex.title}
          </Typography>
          {annex.annexes.map((item) => (
            <Stack
              key={item.id}
              sx={{
                maxWidth: "1400px",
                marginTop: "14px",
                gap: "20px",
              }}
            >
              <Accordion
                expanded={expanded === item.id}
                onChange={handleAccordionChange(item.id)}
                sx={{
                  border: "1px solid #eaecf0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform:
                          expanded === item.id
                            ? "rotate(180deg)"
                            : "rotate(270deg)",
                        transition: "transform 0.3s ease-in",
                      }}
                    />
                  }
                  sx={{
                    backgroundColor: "#fafafa",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>
                    {annex.order}.{item.order}: {item.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {item.controls.map((control) => (
                    <Stack
                      key={control.id}
                      onClick={() =>
                        handleControlClick(annex.order, item, control)
                      }
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderBottom: "1px solid #eaecf0",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                        },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>
                          {`${annex.order}.${item.order}.${control.control_no}.${control.control_subSection}: ${control.title}`}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#666" }}>
                          {control.shortDescription}
                        </Typography>
                        {aiAnalysis[control.id] && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={`${Math.round(
                                aiAnalysis[control.id].confidence
                              )}% Confidence`}
                              size="small"
                              sx={{
                                backgroundColor: getConfidenceColor(
                                  aiAnalysis[control.id].confidence
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
                                control.id
                              ].lastUpdated.toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={control.status}
                          sx={{
                            backgroundColor: getStatusColor(control.status),
                            color: "white",
                          }}
                        />
                        <Tooltip title="Analyze with AI">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              simulateAIAnalysis(control.id);
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

      <VWISO42001AnnexDrawerDialog
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={`${selectedOrder}.${selectedAnnex?.order}.${selectedControl?.control_no}.${selectedControl?.control_subSection}: ${selectedControl?.title}`}
        control={selectedControl}
        annex={selectedAnnex}
      />
    </Stack>
  );
};

export default AiGeneratedISO42001Annexes;
