import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import { GetAnnexesByProjectFrameworkId } from "../../../../../application/repository/annex_struct_iso.repository";
import { useEffect, useState } from "react";
import StatsCard from "../../../../components/Cards/StatsCard";
import { styles } from "../../ISO27001/Clause/style";
import { ReactComponent as RightArrowBlack } from "../../../../assets/icons/right-arrow-black.svg";
import VWISO42001AnnexDrawerDialog from "../../../../components/Drawer/AnnexDrawerDialog";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";
import Alert from "../../../../components/Alert";
import StatusDropdown from "../../../../components/StatusDropdown";
import { updateISO42001AnnexStatus } from "../../../../components/StatusDropdown/statusUpdateApi";
import { useAuth } from "../../../../../application/hooks/useAuth";
import allowedRoles from "../../../../../application/constants/permissions";
import { Project } from "../../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";

const ISO42001Annex = ({
  project,
  projectFrameworkId,
  statusFilter,
  applicabilityFilter,
  initialAnnexId,
  initialAnnexCategoryId,
}: {
  project: Project;
  projectFrameworkId: string | number;
  statusFilter?: string;
  applicabilityFilter?: string;
  initialAnnexId?: string | null;
  initialAnnexCategoryId?: string | null;
}) => {
  const { userId, userRoleName } = useAuth();
  const [expanded, setExpanded] = useState<number | false>(false);
  const [annexesProgress, setAnnexesProgress] = useState<any>({});
  const [annexes, setAnnexes] = useState<any>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const annexId = initialAnnexId;
  const annexControlId = initialAnnexCategoryId;

  useEffect(() => {
    const fetchAnnexes = async () => {
      try {
        const annexProgressResponse = await getEntityById({
          routeUrl: `/iso-42001/annexes/progress/${projectFrameworkId}`,
        });
        setAnnexesProgress(annexProgressResponse.data);
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-42001/annexes/struct/byProjectId/${projectFrameworkId}`,
        });
        setAnnexes(response.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };
    fetchAnnexes();
  }, [projectFrameworkId, refreshTrigger]);

  useEffect(() => {
    // Use initialAnnexId/initialAnnexCategoryId props first, fallback to URL params

    if (annexId && annexes && annexes.length > 0) {
      const annex = annexes.find((a: any) => a.id === Number(annexId));
      if (annex) {
        handleAccordionChange(annex.id)(new Event("click") as any, true);
        const annexCategory = annex.annexCategories?.find(
          (ac: any) => ac.id === Number(annexControlId),
        );
        if (annexCategory) handleControlClick(annex, annexCategory);
      }
    }
  }, [annexId, annexes, annexControlId, initialAnnexId, initialAnnexCategoryId]);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleControlClick = (annex: any, control: any) => {
    setSelectedAnnex(annex);
    setSelectedControl(control);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
    if (annexId && annexControlId) {
      searchParams.delete("annexId");
      searchParams.delete("annexControlId");
      searchParams.delete("framework");
      setSearchParams(searchParams);
    }
  };

  const handleSaveSuccess = async (
    success: boolean,
    message?: string,
    savedControlId?: number,
  ) => {
    handleAlert({
      variant: success ? "success" : "error",
      body:
        message ||
        (success ? "Changes saved successfully" : "Failed to save changes"),
      setAlert,
    });

    if (success && savedControlId) {
      setFlashingRowId(savedControlId);
      setTimeout(() => setFlashingRowId(null), 2000);

      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleStatusChange = async (
    control: any,
    newStatus: string,
  ): Promise<boolean> => {
    try {
      const success = await updateISO42001AnnexStatus({
        id: control.id,
        newStatus,
        projectFrameworkId: Number(projectFrameworkId),
        userId: userId || 1,
        currentData: control,
      });

      if (success) {
        handleAlert({
          variant: "success",
          body: "Status updated successfully",
          setAlert,
        });

        setFlashingRowId(control.id);
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

  function dynamicControls(annex: any) {
    const controls = annex.annexCategories || [];

    let filteredControls = controls;

    // Apply status filter
    if (statusFilter && statusFilter !== "") {
      filteredControls = filteredControls.filter(
        (control: any) =>
          control.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply applicability filter
    if (
      applicabilityFilter &&
      applicabilityFilter !== "all" &&
      applicabilityFilter !== ""
    ) {
      const isApplicable = applicabilityFilter === "true";
      filteredControls = filteredControls.filter(
        (control: any) => Boolean(control.is_applicable) === isApplicable,
      );
    }

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {filteredControls.length > 0 ? (
          filteredControls.map((control: any, index: number) => (
            <Stack
              key={control.id}
              onClick={() => {
                handleControlClick(annex, control);
              }}
              sx={styles.controlRow(
                filteredControls.length - 1 === index,
                flashingRowId === control.id,
              )}
            >
              <Stack>
                <Typography sx={styles.controlTitle}>
                  {"A"}.{annex.annex_no}.{control.order_no} {control.title}
                </Typography>
                <Typography fontSize={13}>{control.description}</Typography>
              </Stack>
              <StatusDropdown
                currentStatus={control.status || "Not started"}
                onStatusChange={(newStatus) =>
                  handleStatusChange(control, newStatus)
                }
                size="small"
                allowedRoles={allowedRoles.frameworks.edit}
                userRole={userRoleName}
              />
            </Stack>
          ))
        ) : (
          <Stack sx={styles.noSubClausesContainer}>
            No matching categories
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  return (
    <Stack className="iso-42001-annexes">
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      <StatsCard
        completed={annexesProgress?.doneAnnexcategories ?? 0}
        total={annexesProgress?.totalAnnexcategories ?? 0}
        title="Annexes"
        progressbarColor="#13715B"
      />
      <Typography sx={{ ...styles.title, mt: 4 }}>
        {"Information Security Controls"}
      </Typography>
      {annexes &&
        annexes.map((annex: any) => (
          <Stack key={annex.id} sx={styles.container}>
            <Accordion
              key={annex.id}
              expanded={expanded === annex.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(annex.id ?? 0)}
            >
              <AccordionSummary sx={styles.accordionSummary}>
                <RightArrowBlack
                  style={styles.expandIcon(expanded === annex.id) as React.CSSProperties}
                   />
                <Typography sx={{ paddingLeft: "2.5px", fontSize: 13 }}>
                  {annex.arrangement} {annex.title}
                </Typography>
              </AccordionSummary>
              {dynamicControls(annex)}
            </Accordion>
          </Stack>
        ))}
      {drawerOpen && (
        <VWISO42001AnnexDrawerDialog
          title={selectedControl?.title || ""}
          open={drawerOpen}
          onClose={(_event?: any, reason?: string) => {
            if (reason === "backdropClick") {
              return; // block closing on backdrop click
            }
            handleDrawerClose();
          }}
          annex={selectedAnnex}
          control={selectedControl}
          projectFrameworkId={Number(projectFrameworkId)}
          project_id={Number(project.id)}
          onSaveSuccess={(success, message) =>
            handleSaveSuccess(success, message, selectedControl?.id)
          }
        />
      )}
    </Stack>
  );
};

export default ISO42001Annex;
