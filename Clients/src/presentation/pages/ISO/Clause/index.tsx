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
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import { useSearchParams } from "react-router-dom";
import Select from "../../../components/Inputs/Select";
import { updateEntityById } from "../../../../application/repository/entity.repository";

const ISO42001Clauses = ({
  project,
  projectFrameworkId,
  statusFilter,
}: {
  project: Project;
  framework_id: number;
  projectFrameworkId: number;
  statusFilter?: string;
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
  const [clauseProgress, setClauseProgress] = useState<{
    totalSubclauses: number;
    doneSubclauses: number;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const clauseId = searchParams.get("clauseId");
  const subClauseId = searchParams.get("subClauseId");
  const [selectedStatus, setSelectedStatus] = useState<string>("0"); // default = Not started


  const statusIdMap = new Map<string, string>([
    ["0", "Not started"],
    ["1", "Draft"],
    ["2", "In progress"],
    ["3", "Awaiting review"],
    ["4", "Awaiting approval"],
    ["5", "Implemented"],
    ["6", "Audited"],
    ["7", "Needs rework"],
  ]);

  const updateSubClauseStatus = async (
    subClauseId: number,
    newStatusId: string
  ) => {
    const formDataToSend = new FormData();
    formDataToSend.append("status", statusIdMap.get(newStatusId) || "Not started");
    formDataToSend.append("project_id", project.id.toString());


    return await updateEntityById({
      routeUrl: `/iso-42001/saveClauses/${subClauseId}`,
      body: formDataToSend,
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const fetchClauses = useCallback(async () => {
    try {
      const clauseProgressResponse = await getEntityById({
        routeUrl: `/iso-42001/clauses/progress/${projectFrameworkId}`,
      });
      setClauseProgress(clauseProgressResponse.data);

      const response = await GetClausesByProjectFrameworkId({
        routeUrl: `/iso-42001/clauses/struct/byProjectId/${projectFrameworkId}`,
      });
      setClauses(response);
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
        const response = await GetSubClausesById({
          routeUrl: `/iso-42001/subClauses/byClauseId/${clauseId}`,
        });

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

  const handleSubClauseClick = useCallback((clause: any, subClause: any, index: number) => {
    setSelectedClause(clause);
    setSelectedSubClause(subClause);
    setSelectedIndex(index);
    setDrawerOpen(true);

    // Initialize drawer status from subClause
    const subClauseStatusId = [...statusIdMap.entries()].find(
      ([, label]) => label === subClause.status
    )?.[0] || "0";
    setSelectedStatus(subClauseStatusId);
  }, []);

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSubClause(null);
    setSelectedClause(null);
    if (clauseId && subClauseId) {
      searchParams.delete("clauseId");
      searchParams.delete("subClauseId");
      setSearchParams(searchParams);
    }
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

  function dynamicSubClauses(clause: ClauseStructISO) {
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
          filteredSubClauses.map(
            (
              subClause: Partial<SubClauseISO & SubClauseStructISO>,
              index: number
            ) => (
              <Stack
                key={subClause.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={styles.subClauseRow(
                  filteredSubClauses.length - 1 === index,
                  flashingRowId === subClause.id
                )}
              >
                {/* Left side clickable area */}
                <Stack
                  onClick={() => handleSubClauseClick(clause, subClause, index)}
                  sx={{ flex: 1, cursor: "pointer" }}
                >
                  <Typography fontSize={13}>
                    {clause.clause_no + "." + (index + 1)}{" "}
                    {subClause.title ?? "Untitled"}
                  </Typography>
                </Stack>

                {/* Inline status dropdown */}
                <Stack>
                    <Select
                      sx={{
                        ...styles.statusBadge(subClause.status ?? "Not started"),
                        ...styles.statusDropdownFix,
                      }}
                      id={`status-${subClause.id}`}
                      value={
                        [...statusIdMap.entries()].find(([_, label]) => label === subClause.status)?.[0] || "0"
                      }
                      onChange={async (e: any) => {
                        const newStatusId = e.target.value;
                        try {
                          await updateSubClauseStatus(subClause.id!, newStatusId);

                          // Update local subClause status in the list
                          (subClause as any).status = statusIdMap.get(newStatusId) || "Not started";

                          // If the drawer is open for this subClause, update the drawer state
                          if (drawerOpen && selectedSubClause?.id === subClause.id) {
                            setSelectedStatus(newStatusId);
                            setSelectedSubClause({
                              ...selectedSubClause,
                              status: statusIdMap.get(newStatusId),
                            });
                          }

                          setRefreshTrigger((prev) => prev + 1);
                        } catch (err) {
                          console.error("Failed to update status inline", err);
                          handleAlert({
                            variant: "error",
                            body: "Failed to update subclause status",
                            setAlert,
                          });
                        }
                      }}
                      items={[...statusIdMap.entries()].map(([id, label]) => ({
                        _id: id,
                        name: label,
                      }))}
                    />
                </Stack>
              </Stack>
            )
          )
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
      async function fetchSubClause() {
        try {
          const response = await getEntityById({
            routeUrl: `/iso-42001/subClause/byId/${clauseId}?projectFrameworkId=${projectFrameworkId}`,
          });
          setSelectedSubClause({ ...response.data, id: response.data.clause_id });
          setSelectedStatus(
            [...statusIdMap.entries()].find(([_, label]) => label === response.data.status)?.[0] || "0"
          );
          if (clause && clauseId) {
            handleSubClauseClick(
              clause,
              { ...response.data, id: response.data.clause_id },
              parseInt(clauseId)
            );
          }
        } catch (error) {
          console.error("Error fetching subclause:", error);
        }
      }
      fetchSubClause();
    }
  }, [clauseId, subClauseId, clauses]);

  useEffect(() => {
    if (!drawerOpen || !selectedSubClause) return;

    const clauseId = selectedSubClause.clause_id;
    const clauseSubClauses = subClausesMap[clauseId] || [];

    const newStatus = statusIdMap.get(selectedStatus) || "Not started";

    const needsUpdate =
      selectedSubClause.status !== newStatus ||
      clauseSubClauses.some(
        (sc) => sc.id === selectedSubClause.id && sc.status !== newStatus
      );

    if (!needsUpdate) return;

    const updatedSubClauses = clauseSubClauses.map((sc) =>
      sc.id === selectedSubClause.id ? { ...sc, status: newStatus } : sc
    );

    setSubClausesMap((prev) => ({
      ...prev,
      [clauseId]: updatedSubClauses,
    }));

    setSelectedSubClause((prev: any) =>
      prev ? { ...prev, status: newStatus } : prev
    );
  }, [selectedStatus, drawerOpen, selectedSubClause, subClausesMap]);


  return (
    <Stack className="iso-42001-clauses">
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
        clauses.map((clause: ClauseStructISO) => (
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
          onSaveSuccess={(success, message) =>
            handleSaveSuccess(success, message, selectedSubClause?.id)
          }
          index={selectedIndex}
          status={selectedStatus}
          onStatusChange={(newStatus) => setSelectedStatus(newStatus)}
          statusIdMap={statusIdMap}
        />
      )}
    </Stack>
  );
};

export default ISO42001Clauses;
