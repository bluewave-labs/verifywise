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
import { ReactComponent as RightArrowBlack } from "../../../../assets/icons/right-arrow-black.svg";
import { ISO27001GetSubClauseByClauseId } from "../../../../../application/repository/subClause_iso.repository";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";
import VWISO27001ClauseDrawerDialog from "../../../../components/Drawer/ISO27001ClauseDrawerDialog";
import StatsCard from "../../../../components/Cards/StatsCard";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import { useSearchParams } from "react-router-dom";
import StatusDropdown from "../../../../components/StatusDropdown";
import { updateISO27001ClauseStatus } from "../../../../components/StatusDropdown/statusUpdateApi";
import { useAuth } from "../../../../../application/hooks/useAuth";
import allowedRoles from "../../../../../application/constants/permissions";
import { Project } from "../../../../../domain/types/Project";
import { useModalKeyHandling } from "../../../../../application/hooks/useModalKeyHandling";

const ISO27001Clause = ({
  project,
  projectFrameworkId,
  statusFilter,
  initialClauseId,
  initialSubClauseId,
}: {
  project: Project;
  projectFrameworkId: number | string;
  statusFilter?: string;
  initialClauseId?: string | null;
  initialSubClauseId?: string | null;
}) => {
  const { userId, userRoleName } = useAuth();
  const [clauses, setClauses] = useState<ClauseStructISO[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubClause, setSelectedSubClause] = useState<any>(null);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [subClausesMap, setSubClausesMap] = useState<{ [key: number]: any[] }>(
    {},
  );
  const [loadingSubClauses, setLoadingSubClauses] = useState<{
    [key: number]: boolean;
  }>({});
  const [clauseProgress, setClauseProgress] = useState<{
    totalSubclauses: number;
    doneSubclauses: number;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const clauseId = initialClauseId;
  const subClauseId = initialSubClauseId;

  const fetchClauses = useCallback(async () => {
    try {
      const clauseProgressResponse = await getEntityById({
        routeUrl: `/iso-27001/clauses/progress/${projectFrameworkId}`,
      });
      setClauseProgress(clauseProgressResponse.data);

      const response = await Iso27001GetClauseStructByFrameworkID({
        routeUrl: `/iso-27001/clauses/struct/byProjectId/${projectFrameworkId}`,
      });
      setClauses(response.data);
      setSubClausesMap({});
    } catch (error) {
      console.error("Error fetching clauses:", error);
      setClauses([]);
    }
  }, [projectFrameworkId]);

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
        const detailedSubClauses = response.data;

        const mergedSubClauses = detailedSubClauses.map((detailed: any) => {
          const match = clauseSubClausesWithStatus.find(
            (s) => s.id === detailed.id,
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
    [],
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

  const handleSubClauseClick = useCallback(
    (clause: any, subClause: any, index: number) => {
      setSelectedClause(clause);
      setSelectedSubClause(subClause);
      setSelectedIndex(index);
      setDrawerOpen(true);
    },
    [],
  );

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSubClause(null);
    setSelectedClause(null);
    if (clauseId && subClauseId) {
      searchParams.delete("clause27001Id");
      searchParams.delete("subClause27001Id");
      searchParams.delete("framework");
      setSearchParams(searchParams);
    }
  };

  // Add modal key handling for ESC key support
  useModalKeyHandling({
    isOpen: drawerOpen,
    onClose: handleDrawerClose,
  });

  const handleSaveSuccess = async (
    success: boolean,
    message?: string,
    savedSubClauseId?: number,
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

  const handleStatusChange = async (
    subClause: any,
    newStatus: string,
  ): Promise<boolean> => {
    try {
      const success = await updateISO27001ClauseStatus({
        id: subClause.id,
        newStatus,
        projectFrameworkId: Number(projectFrameworkId),
        userId: userId || 1,
        currentData: subClause,
      });

      if (success) {
        handleAlert({
          variant: "success",
          body: "Status updated successfully",
          setAlert,
        });

        setFlashingRowId(subClause.id);
        setTimeout(() => setFlashingRowId(null), 2000);

        setRefreshTrigger((prev) => prev + 1);
      } else {
        handleAlert({
          variant: "error",
          body: "Failed to update status",
          setAlert,
        });
      }

      return success;
    } catch (error) {
      console.error("Error updating status:", error);
      handleAlert({
        variant: "error",
        body: "Error updating status",
        setAlert,
      });
      return false;
    }
  };

  function dynamicSubClauses(clause: any) {
    const subClauses = subClausesMap[clause.id ?? 0] || [];
    const isLoading = loadingSubClauses[clause.id ?? 0];

    const filteredSubClauses =
      statusFilter && statusFilter !== ""
        ? subClauses.filter(
            (sc) => sc.status?.toLowerCase() === statusFilter.toLowerCase(),
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
              onClick={() => {
                handleSubClauseClick(clause, subClause, index);
              }}
              sx={styles.subClauseRow(
                filteredSubClauses.length - 1 === index,
                flashingRowId === subClause.id,
              )}
            >
              <Typography fontSize={13}>
                {clause.arrangement + "." + (index + 1)}{" "}
                {subClause.title ?? "Untitled"}
              </Typography>
              <StatusDropdown
                currentStatus={subClause.status ?? "Not started"}
                onStatusChange={(newStatus) =>
                  handleStatusChange(subClause, newStatus)
                }
                size="small"
                allowedRoles={allowedRoles.frameworks.edit}
                userRole={userRoleName}
              />
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

  useEffect(() => {
    if (clauseId && subClauseId && clauses.length > 0) {
      const clause = clauses.find((c) => c.id === parseInt(clauseId));
      const idx = clause?.subClauses.findIndex(
        (sc: any) => sc.id === parseInt(subClauseId),
      );
      handleSubClauseClick(clause, {id: parseInt(subClauseId)}, idx ?? 0);
    }
  }, [clauseId, subClauseId, initialClauseId, initialSubClauseId, clauses, projectFrameworkId, handleSubClauseClick]);

  return (
    <Stack className="iso-27001-clauses">
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      <StatsCard
        completed={clauseProgress?.doneSubclauses ?? 0}
        total={clauseProgress?.totalSubclauses ?? 0}
        title="Clauses"
        progressbarColor="#13715B"
      />
      <Typography sx={{ ...styles.title, mt: 4 }}>
        {"Management System Clauses"}
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
                <RightArrowBlack
                  style={styles.expandIcon(expanded === clause.id) as React.CSSProperties}
                />
                <Typography sx={{ paddingLeft: "2.5px", fontSize: 13 }}>
                  {clause.arrangement} {clause.title}
                </Typography>
              </AccordionSummary>
              {dynamicSubClauses(clause)}
            </Accordion>
          </Stack>
        ))}
      {drawerOpen && (
        <VWISO27001ClauseDrawerDialog
          open={drawerOpen}
          onClose={(_event?: any, reason?: string) => {
            if (reason === "backdropClick") {
              return; // block closing on backdrop click
            }
            handleDrawerClose();
          }}
          project_id={Number(project.id)}
          subClause={selectedSubClause}
          clause={selectedClause}
          projectFrameworkId={Number(projectFrameworkId)}
          onSaveSuccess={(success, message) =>
            handleSaveSuccess(success, message, selectedSubClause?.id)
          }
          index={selectedIndex}
        />
      )}
    </Stack>
  );
};

export default ISO27001Clause;
