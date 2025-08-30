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
import { styles } from "../../ISO27001/Clause/style";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VWISO42001AnnexDrawerDialog from "../../../../components/Drawer/AnnexDrawerDialog";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";
import { AnnexStructISO } from "../../../../../domain/types/AnnexStructISO";
import { GetAnnexCategoriesById } from "../../../../../application/repository/annexCategory_iso.repository";
import Alert from "../../../../components/Alert";

const ISO42001Annex = ({ 
  FrameworkId, 
  statusFilter, 
  applicabilityFilter 
}: { 
  FrameworkId: string | number;
  statusFilter?: string;
  applicabilityFilter?: string;
}) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [annexesProgress, setAnnexesProgress] = useState<any>({});
  const [annexes, setAnnexes] = useState<AnnexStructISO[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [controlsMap, setControlsMap] = useState<{ [key: number]: any[] }>({});

  useEffect(() => {
    const fetchAnnexes = async () => {
      try {
        const annexProgressResponse = await getEntityById({
          routeUrl: `/iso-42001/annexes/progress/${FrameworkId}`,
        });
        setAnnexesProgress(annexProgressResponse.data);
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-42001/annexes/struct/byProjectId/${FrameworkId}`,
        });
        setAnnexes(response.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };
    fetchAnnexes();
  }, [refreshTrigger]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      if (isExpanded && !controlsMap[panel]) {
        await fetchControls(panel);
      }
    };

  const fetchControls = useCallback(async (annexId: number) => {
    try {
      const response = await GetAnnexCategoriesById({
        routeUrl: `/iso-42001/annexCategories/byAnnexId/${annexId}`,
      }) as { data: any[] };

      setControlsMap((prev) => ({ ...prev, [annexId]: response.data }));
    } catch (error) {
      console.error("Error fetching controls:", error);
      setControlsMap((prev) => ({ ...prev, [annexId]: [] }));
    }
  }, []);

  const handleControlClick = (
    annex: any,
    control: any
  ) => {
    setSelectedAnnex(annex);
    setSelectedControl(control);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
  };

  const handleSaveSuccess = async (
    success: boolean,
    message?: string,
    savedControlId?: number
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

  function dynamicControls(annex: any) {
    const controls = controlsMap[annex.id ?? 0] || [];

    const filteredControls = controls.filter((control) => {
      const statusMatch =
        !statusFilter ||
        statusFilter === "" ||
        control.status?.toLowerCase() === statusFilter.toLowerCase();

      const applicabilityMatch =
        !applicabilityFilter ||
        applicabilityFilter === "" ||
        control.applicability?.toLowerCase() === applicabilityFilter.toLowerCase();

      return statusMatch && applicabilityMatch;
    });

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {filteredControls.length > 0 ? (
          filteredControls.map((control: any, index: number) => (
            <Stack
              key={control.id}
              onClick={() => {
                handleControlClick(
                  annex,
                  control
                );
              }}
              sx={styles.subClauseRow(
                filteredControls.length - 1 === index,
                flashingRowId === control.id
              )}
            >
              <Typography fontSize={13}>
                {annex.arrangement + "." + control.arrangement}{" "}
                {control.title ?? "Untitled"}
              </Typography>
              <Stack sx={styles.statusBadge(control.status ?? "")}>
                {control.status
                  ? control.status.charAt(0).toUpperCase() +
                    control.status.slice(1).toLowerCase()
                  : "Not started"}
              </Stack>
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
                <ExpandMoreIcon
                  sx={styles.expandIcon(expanded === annex.id)}
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
          onClose={handleDrawerClose}
          annex={selectedAnnex}
          control={selectedControl}
          projectFrameworkId={Number(FrameworkId)}
          project_id={0}
          onSaveSuccess={(success, message) =>
            handleSaveSuccess(success, message, selectedControl?.id)
          }
        />
      )}
    </Stack>
  );
};

export default ISO42001Annex;