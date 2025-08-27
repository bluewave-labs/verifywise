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
import { styles } from "../Clause/style";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ISO27001Annex = ({ FrameworkId }: { FrameworkId: string | number }) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [annexesProgress, setAnnexesProgress] = useState<any>({});
  const [annexes, setAnnexes] = useState<any>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const annexProgressResponse = await getEntityById({
          routeUrl: `/iso-27001/annexes/progress/${FrameworkId}`,
        });
        setAnnexesProgress(annexProgressResponse.data);
        console.log("annexesProgress >>> ", annexesProgress);
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-27001/annexes/struct/byProjectId/${FrameworkId}`,
        });
        setAnnexes(response.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };
    fetchClauses();
    console.log("annexes >>> ", annexes);
  }, []);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
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

  return (
    <Stack className="iso-27001-annex">
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
                <ExpandMoreIcon sx={styles.expandIcon(expanded === annex.id)} />
                {annex.arrangement}.{annex.order_no} {annex.title}
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                {annex.annexControls.map((control: any, index: number) => (
                  <Stack
                    key={control.id}
                    onClick={() =>
                      handleControlClick("A", annex, control, index)
                    }
                    sx={styles.controlRow(
                      (annex.annexCategories?.length ?? 0) - 1 === index,
                      flashingRowId === control.id
                    )}
                  >
                    <Stack>
                      <Typography sx={styles.controlTitle}>
                        {annex.arrangement}.{annex.order_no}.{control.order_no}{" "}
                        {control.title}
                      </Typography>
                    </Stack>
                    <Stack sx={styles.statusBadge(control.status || "")}>
                      {control.status
                        ? control.status.charAt(0).toUpperCase() +
                          control.status.slice(1).toLowerCase()
                        : "Not started"}
                    </Stack>
                  </Stack>
                ))}
              </AccordionDetails>
            </Accordion>
          </Stack>
        ))}
    </Stack>
  );
};

export default ISO27001Annex;
