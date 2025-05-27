import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  CircularProgress,
  keyframes,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { accordionStyle } from "../style";
import { useState, useEffect, useCallback } from "react";
import VWISO42001ClauseDrawerDialog from "../../../components/Drawer/ClauseDrawerDialog";
import { Project } from "../../../../domain/types/Project";
import { GetClausesByProjectFrameworkId } from "../../../../application/repository/clause_struct_iso.repository";
import { GetSubClausesById } from "../../../../application/repository/subClause_iso.repository";
import { ClauseStructISO } from "../../../../domain/types/ClauseStructISO";
import { SubClauseISO } from "../../../../domain/types/SubClauseISO";
import { SubClauseStructISO } from "../../../../domain/types/SubClauseStructISO";
import Alert from "../../../components/Alert";
import { AlertProps } from "../../../../domain/interfaces/iAlert";
import { handleAlert } from "../../../../application/tools/alertUtils";

// Define the flash animation
const flashAnimation = keyframes`
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(82, 171, 67, 0.2); // Light green color
  }
  100% {
    background-color: transparent;
  }
`;

const ISO42001Clauses = ({
  project,
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
  const [loadingSubClauses, setLoadingSubClauses] = useState<{
    [key: number]: boolean;
  }>({});
  const [subClausesMap, setSubClausesMap] = useState<{ [key: number]: any[] }>(
    {}
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);

  const fetchClauses = useCallback(async () => {
    try {
      const response = await GetClausesByProjectFrameworkId({
        routeUrl: `/iso-42001/clauses/struct/byProjectId/${projectFrameworkId}`,
      });
      setClauses(response);
    } catch (error) {
      console.error("Error fetching clauses:", error);
      setClauses([]);
    }
  }, [projectFrameworkId]);

  useEffect(() => {
    fetchClauses();
  }, [fetchClauses, refreshTrigger]);

  const fetchSubClauses = useCallback(async (clauseId: number) => {
    setLoadingSubClauses((prev) => ({ ...prev, [clauseId]: true }));
    try {
      const response = await GetSubClausesById({
        routeUrl: `/iso-42001/subClauses/byClauseId/${clauseId}`,
      });
      console.log("/iso-42001/subClauses/byClauseId/ -- > response", response);
      setSubClausesMap((prev) => ({ ...prev, [clauseId]: response.data }));
    } catch (error) {
      console.error("Error fetching subclauses:", error);
      setSubClausesMap((prev) => ({ ...prev, [clauseId]: [] }));
    } finally {
      setLoadingSubClauses((prev) => ({ ...prev, [clauseId]: false }));
    }
  }, []);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      if (isExpanded && !subClausesMap[panel]) {
        await fetchSubClauses(panel);
      }
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

  const handleSaveSuccess = async (success: boolean, message?: string, savedSubClauseId?: number) => {
    // Show appropriate toast message
    handleAlert({
      variant: success ? "success" : "error",
      body: message || (success ? "Changes saved successfully" : "Failed to save changes"),
      setAlert,
    });

    // If save was successful, refresh the data and trigger flash animation
    if (success && savedSubClauseId) {
      // Set the flashing row ID
      setFlashingRowId(savedSubClauseId);
      // Clear the flashing state after animation
      setTimeout(() => {
        setFlashingRowId(null);
      }, 2000); // 2 seconds animation

      // If there's an expanded clause, refresh its subclauses
      if (expanded !== false) {
        await fetchSubClauses(expanded);
      }
      // Trigger a refresh of the clauses
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  function getStatusColor(status: string) {
    const normalizedStatus = status?.trim() || "Not Started";
    switch (
      normalizedStatus.charAt(0).toUpperCase() +
      normalizedStatus.slice(1).toLowerCase()
    ) {
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
        return "#52AB43";
      case "Audited":
        return "#B8D39C";
      case "Needs Rework":
        return "#800080";
      default:
        return "#C63622"; // Default to "Not Started" color
    }
  }

  function dynamicSubClauses(clause: ClauseStructISO) {
    const subClauses = subClausesMap[clause.id ?? 0] || [];
    const isLoading = loadingSubClauses[clause.id ?? 0];

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {isLoading ? (
          <Stack
            sx={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={24} />
          </Stack>
        ) : clause.subClauses.length > 0 ? (
          clause.subClauses.map(
            (
              subClause: Partial<SubClauseISO & SubClauseStructISO>,
              index: number
            ) => (
              <Stack
                key={subClause.id}
                onClick={() => handleSubClauseClick(clause, subClause)}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderBottom:
                    subClauses.length - 1 === index
                      ? "none"
                      : "1px solid #eaecf0",
                  cursor: "pointer",
                  fontSize: 13,
                  animation: flashingRowId === subClause.id ? `${flashAnimation} 2s ease-in-out` : 'none',
                  '&:hover': {
                    backgroundColor: flashingRowId === subClause.id ? 'transparent' : '#f5f5f5',
                  },
                }}
              >
                <Typography fontSize={13}>
                  {clause.clause_no + "." + (index + 1)}{" "}
                  {subClause.title ?? "Untitled"}
                </Typography>
                <Stack
                  sx={{
                    borderRadius: "4px",
                    padding: "5px",
                    backgroundColor: getStatusColor(subClause.status ?? ""),
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
          )
        ) : (
          <Stack
            sx={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
            }}
          >
            No subclauses found
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  return (
    <Stack className="iso-42001-clauses">
      {alert && <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />}
      <Typography
        key="Management-System-Clauses"
        sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
      >
        {"Management System Clauses"}
      </Typography>
      {clauses &&
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
              {dynamicSubClauses(clause)}
            </Accordion>
          </Stack>
        ))}
      {drawerOpen && (
        <VWISO42001ClauseDrawerDialog
          open={drawerOpen}
          onClose={handleDrawerClose}
          subClause={selectedSubClause}
          clause={selectedClause}
          projectFrameworkId={projectFrameworkId}
          project_id={project.id}
          onSaveSuccess={(success, message) => handleSaveSuccess(success, message, selectedSubClause?.id)}
        />
      )}
    </Stack>
  );
};

export default ISO42001Clauses;
