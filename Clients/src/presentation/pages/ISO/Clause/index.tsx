import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { styles } from "./styles";

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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

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

  const handleSubClauseClick = (clause: any, subClause: any, index: number) => {
    setSelectedClause(clause);
    setSelectedSubClause(subClause);
    setSelectedIndex(index);
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

  function dynamicSubClauses(clause: ClauseStructISO) {
    const subClauses = subClausesMap[clause.id ?? 0] || [];
    const isLoading = loadingSubClauses[clause.id ?? 0];

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {isLoading ? (
          <Stack sx={styles.loadingContainer}>
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
                onClick={() => handleSubClauseClick(clause, subClause, index)}
                sx={styles.subClauseRow(
                  subClauses.length - 1 === index,
                  flashingRowId === subClause.id
                )}
              >
                <Typography fontSize={13}>
                  {clause.clause_no + "." + (index + 1)}{" "}
                  {subClause.title ?? "Untitled"}
                </Typography>
                <Stack sx={styles.statusBadge(subClause.status ?? "")}>
                  {subClause.status
                    ? subClause.status.charAt(0).toUpperCase() +
                    subClause.status.slice(1).toLowerCase()
                    : "Not started"}
                </Stack>
              </Stack>
            )
          )
        ) : (
          <Stack sx={styles.noSubClausesContainer}>
            No subclauses found
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  return (
    <Stack className="iso-42001-clauses">
      {alert && <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />}
      <Typography sx={styles.title}>
        {"Management System Clauses"}
      </Typography>
      {clauses &&
        clauses.map((clause: ClauseStructISO) => (
          <Stack key={clause.id} sx={styles.container}>
            <Accordion
              key={clause.id}
              expanded={expanded === clause.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(clause.id ?? 0)}
            >
              <AccordionSummary sx={styles.accordionSummary}>
                <ExpandMoreIcon sx={styles.expandIcon(expanded === clause.id)} />
                <Typography sx={{ paddingLeft: "2.5px", fontSize: 13 }}>
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
          index={selectedIndex}
        />
      )}
    </Stack>
  );
};

export default ISO42001Clauses;
