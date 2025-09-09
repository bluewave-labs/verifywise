import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import { GetAnnexesByProjectFrameworkId } from "../../../../../application/repository/annex_struct_iso.repository";
import { useCallback, useEffect, useState } from "react";
import StatsCard from "../../../../components/Cards/StatsCard";
import { styles } from "../Clause/style";
import { svgStyles } from "../../../ISO/style";
import { ReactComponent as ExpandMoreIcon } from "../../../../assets/icons/down-arrow.svg";
import VWISO27001AnnexDrawerDialog from "../../../../components/Drawer/ISO27001AnnexDrawerDialog";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";
import { AnnexCategoryISO } from "../../../../../domain/types/AnnexCategoryISO";
import { AnnexCategoryStructISO } from "../../../../../domain/types/AnnexCategoryStructISO";
import { GetAnnexCategoriesById } from "../../../../../application/repository/annexCategory_iso.repository";
import Alert from "../../../../components/Alert";
import StatusDropdown from "../../../../components/StatusDropdown";
import { updateISO27001AnnexStatus } from "../../../../components/StatusDropdown/statusUpdateApi";
import { useAuth } from "../../../../../application/hooks/useAuth";
import allowedRoles from "../../../../../application/constants/permissions";

const ISO27001Annex = ({ 
  projectFrameworkId, 
  statusFilter, 
  applicabilityFilter 
}: { 
  projectFrameworkId: string | number;
  statusFilter?: string;
  applicabilityFilter?: string;
}) => {
  const { userId, userRoleName } = useAuth();
  const [expanded, setExpanded] = useState<number | false>(false);
  const [annexesProgress, setAnnexesProgress] = useState<any>({});
  const [annexes, setAnnexes] = useState<any>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [controlsMap, setControlsMap] = useState<{ [key: number]: any[] }>({});

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const annexProgressResponse = await getEntityById({
          routeUrl: `/iso-27001/annexes/progress/${projectFrameworkId}`,
        });
        setAnnexesProgress(annexProgressResponse.data);
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-27001/annexes/struct/byProjectId/${projectFrameworkId}`,
        });
        setAnnexes(response.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };
    fetchClauses();
  }, [refreshTrigger]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      if (isExpanded && !controlsMap[panel]) {
        await fetchControls(panel);
      }
    };

  const handleControlClick = (
    order: any,
    annex: any,
    control: any,
    index: number
  ) => {
    setSelectedOrder(order);
    setSelectedAnnex(annex);
    setSelectedControl(control);
    setSelectedIndex(index);
    setDrawerOpen(true);
  };

  const fetchControls = useCallback(async (annexId: number) => {
    try {
      const response = (await GetAnnexCategoriesById({
        routeUrl: `/iso-42001/annexCategories/byAnnexId/${annexId}`,
      })) as { data: Partial<AnnexCategoryISO & AnnexCategoryStructISO>[] };
      setControlsMap((prev) => ({ ...prev, [annexId]: response.data }));
    } catch (error) {
      console.error("Error fetching controls:", error);
      setControlsMap((prev) => ({ ...prev, [annexId]: [] }));
    }
  }, []);

  const handleSaveSuccess = async (
    success: boolean,
    message?: string,
    savedControlId?: number
  ) => {
    // Show appropriate toast message
    handleAlert({
      variant: success ? "success" : "error",
      body:
        message ||
        (success ? "Changes saved successfully" : "Failed to save changes"),
      setAlert,
    });

    // If save was successful, refresh the data and trigger flash animation
    if (success && savedControlId) {
      // Set the flashing row ID
      setFlashingRowId(savedControlId);
      // Clear the flashing state after animation
      setTimeout(() => {
        setFlashingRowId(null);
      }, 2000); // 2 seconds animation

      // If there's an expanded annex, refresh its controls
      if (expanded !== false) {
        await fetchControls(expanded);
      }
      // Trigger a refresh of the annexes
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleStatusChange = async (control: any, newStatus: string): Promise<boolean> => {
    try {
      const success = await updateISO27001AnnexStatus({
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
        
        if (expanded !== false) {
          await fetchControls(expanded);
        }
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

  return (
    <Stack className="iso-27001-annex">
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      {
        <>
          <StatsCard
            completed={annexesProgress?.doneAnnexControls ?? 0}
            total={annexesProgress?.totalAnnexControls ?? 0}
            title="Annexes"
            progressbarColor="#13715B"
          />
          <Typography sx={{ ...styles.title, mt: 4 }}>
            Annex A : Reference Controls (Statement of Applicability)
          </Typography>
          {annexes &&
            annexes.map((annex: any) => (
              <Stack key={annex.id} sx={styles.container}>
                <Accordion
                  key={annex.id}
                  expanded={expanded === annex.id}
                  onChange={handleAccordionChange(annex.id ?? 0)}
                  sx={styles.accordion}
                >
                  <AccordionSummary sx={styles.accordionSummary}>
                    <ExpandMoreIcon
                      style={svgStyles.expandIcon(expanded === annex.id)}
                    />
                    {annex.arrangement}.{annex.order_no} {annex.title}
                  </AccordionSummary>
                  <AccordionDetails sx={{ padding: 0 }}>
                    {(() => {
                      let filteredControls = annex.annexControls || [];
                      
                      // Apply status filter
                      if (statusFilter && statusFilter !== "") {
                        filteredControls = filteredControls.filter(
                          (control: any) => 
                            control.status?.toLowerCase() === statusFilter.toLowerCase()
                        );
                      }
                      
                      // Apply applicability filter
                      if (applicabilityFilter && applicabilityFilter !== "all" && applicabilityFilter !== "") {
                        const isApplicable = applicabilityFilter === "true";
                        filteredControls = filteredControls.filter(
                          (control: any) => Boolean(control.applicable) === isApplicable
                        );
                      }
                      
                      return filteredControls.length > 0 ? (
                        filteredControls.map((control: any, index: number) => (
                          <Stack
                            key={control.id}
                            onClick={() =>
                              handleControlClick("A", annex, control, index)
                            }
                            sx={styles.controlRow(
                              filteredControls.length - 1 === index,
                              flashingRowId === control.id
                            )}
                          >
                            <Stack>
                              <Typography sx={styles.controlTitle}>
                                {annex.arrangement}.{annex.order_no}.
                                {control.order_no} {control.title}
                              </Typography>
                            </Stack>
                            <StatusDropdown
                              currentStatus={control.status || "Not started"}
                              onStatusChange={(newStatus) => handleStatusChange(control, newStatus)}
                              size="small"
                              allowedRoles={allowedRoles.frameworks.edit}
                              userRole={userRoleName}
                            />
                          </Stack>
                        ))
                      ) : (
                        <Stack sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No matching controls
                          </Typography>
                        </Stack>
                      );
                    })()}
                  </AccordionDetails>
                </Accordion>
              </Stack>
            ))}
          {drawerOpen && (
            <VWISO27001AnnexDrawerDialog
              title={`${selectedOrder}.${selectedAnnex?.order_no}.${
                selectedIndex + 1
              } ${selectedControl?.title}`}
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              control={selectedControl}
              annex={selectedAnnex}
              projectFrameworkId={Number(projectFrameworkId)}
              project_id={0}
              onSaveSuccess={(success, message) =>
                handleSaveSuccess(success, message, selectedControl?.id)
              }
            />
          )}
        </>
      }
    </Stack>
  );
};

export default ISO27001Annex;
