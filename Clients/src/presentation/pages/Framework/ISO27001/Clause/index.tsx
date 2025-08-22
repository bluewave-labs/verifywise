import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Iso27001GetClauseStructByFrameworkID } from "../../../../../application/repository/clause_struct_iso.repository";
import { ClauseStructISO } from "../../../../../domain/types/ClauseStructISO";
import { useCallback, useEffect, useState } from "react";
import { styles } from "./style";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ISO27001GetSubClauseByClauseId } from "../../../../../application/repository/subClause_iso.repository";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";

const ISO27001Clause = ({
  FrameworkId,
  statusFilter,
}: {
  FrameworkId: number | string;
  statusFilter?: string;
}) => {
  const [clauses, setClauses] = useState<ClauseStructISO[]>([]);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [subClausesMap, setSubClausesMap] = useState<{ [key: number]: any[] }>(
    {}
  );
  const [loadingSubClauses, setLoadingSubClauses] = useState<{
    [key: number]: boolean;
  }>({});

  const fetchClauses = useCallback(async () => {
    const response = await Iso27001GetClauseStructByFrameworkID({
      routeUrl: `/iso-27001/clauses/struct/byProjectId/${FrameworkId}`,
    });
    setClauses(response.data);
    console.log("clauses : ==> ", clauses);
    setSubClausesMap({});
  }, [FrameworkId]);

  useEffect(() => {
    fetchClauses();
  }, [fetchClauses, refreshTrigger]);

  const fetchSubClauses = useCallback(
    async (clauseId: number, clauseSubClausesWithStatus: any[]) => {
      setLoadingSubClauses((prev) => ({ ...prev, [clauseId]: true }));
      try {
        const response = await ISO27001GetSubClauseByClauseId({
          routeUrl: `/iso-27001/subClauses/byClauseId/${clauseId}`,
        });
        console.log("subClauses : ==> ", response);
        const detailedSubClauses = response.data;

        const mergedSubClauses = detailedSubClauses.map((detailed: any) => {
          const match = clauseSubClausesWithStatus.find(
            (s) => s.id === detailed.id
          );
          return {
            ...detailed,
            status: match?.status ?? "Not started",
          };
        });
        setSubClausesMap((prev) => ({ ...prev, [clauseId]: mergedSubClauses }));
      } catch (error) {
        console.error("Error fetching detailed subclauses:", error);
        setSubClausesMap((prev) => ({ ...prev, [clauseId]: [] }));
      } finally {
        setLoadingSubClauses((prev) => ({ ...prev, [clauseId]: false }));
      }
    },
    []
  );

  useEffect(() => {
    if (expanded !== false && !subClausesMap[expanded]) {
      const clause = clauses.find((c) => c.id === expanded);
      if (clause) {
        fetchSubClauses(expanded, clause.subClauses);
      }
    }
  }, [clauses, expanded, fetchSubClauses, subClausesMap]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleSaveSuccess = async (
    success: boolean,
    message?: string,
    savedSubClauseId?: number
  ) => {
    handleAlert({
      variant: success ? "success" : "error",
      body:
        message ||
        (success ? "Changes saved successfully" : "Failed to save changes"),
      setAlert,
    });

    if (success && savedSubClauseId) {
      setFlashingRowId(savedSubClauseId);
      setTimeout(() => setFlashingRowId(null), 2000);

      setRefreshTrigger((prev) => prev + 1);
    }
  };

  function dynamicSubClauses(clause: any) {
    const subClauses = subClausesMap[clause.id ?? 0] || [];
    const isLoading = loadingSubClauses[clause.id ?? 0];

    const filteredSubClauses =
      statusFilter && statusFilter !== ""
        ? subClauses.filter(
            (sc) => sc.status?.toLowerCase() === statusFilter.toLowerCase()
          )
        : subClauses;

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {isLoading ? (
          <Stack sx={styles.loadingContainer}>
            <CircularProgress size={24} />
          </Stack>
        ) : filteredSubClauses.length > 0 ? (
          filteredSubClauses.map((subClause: any, index: number) => (
            <Stack
              key={subClause.id}
              onClick={() => {}}
              sx={styles.subClauseRow(
                filteredSubClauses.length - 1 === index,
                flashingRowId === subClause.id
              )}
            >
              <Typography fontSize={13}>
                {clause.arrangement + "." + (index + 1)}{" "}
                {subClause.title ?? "Untitled"}
              </Typography>
              <Stack sx={styles.statusBadge(subClause.status ?? "")}>
                {subClause.status
                  ? subClause.status.charAt(0).toUpperCase() +
                    subClause.status.slice(1).toLowerCase()
                  : "Not started"}
              </Stack>
            </Stack>
          ))
        ) : (
          <Stack sx={styles.noSubClausesContainer}>
            No matching subclauses
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  return (
    <Stack spacing={4}>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      <Typography
        sx={{
          color: "#1A1919",
          fontWeight: 600,
          mb: "6px",
          fontSize: 16,
          mt: 4,
        }}
      >
        Management System Clauses
      </Typography>
      {clauses &&
        clauses.map((clause: any) => (
          <Stack key={clause.id} sx={styles.container}>
            <Accordion
              key={clause.id}
              expanded={expanded === clause.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(clause.id ?? 0)}
            >
              <AccordionSummary sx={styles.accordionSummary}>
                <ExpandMoreIcon
                  sx={styles.expandIcon(expanded === clause.id)}
                />
                <Typography sx={{ paddingLeft: "2.5px", fontSize: 13 }}>
                  {clause.arrangement} {clause.title}
                </Typography>
              </AccordionSummary>
              {dynamicSubClauses(clause)}
            </Accordion>
          </Stack>
        ))}
    </Stack>
  );
};

export default ISO27001Clause;
