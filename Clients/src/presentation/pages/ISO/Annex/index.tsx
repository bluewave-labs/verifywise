import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ISO42001AnnexList } from "./annex.structure";
import { useCallback, useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VWISO42001AnnexDrawerDialog from "../../../components/Drawer/AnnexDrawerDialog";
import { Project } from "../../../../domain/types/Project";
import { GetAnnexesByProjectFrameworkId } from "../../../../application/repository/annex_struct_iso.repository";
import { AnnexStructISO } from "../../../../domain/types/AnnexStructISO";
import { GetAnnexCategoriesById } from "../../../../application/repository/annexCategory_iso.repository";
import { AnnexCategoryStructISO } from "../../../../domain/types/AnnexCategoryStructISO";
import { AnnexCategoryISO } from "../../../../domain/types/AnnexCategoryISO";

const ISO42001Annex = ({
  project,
  projectFrameworkId,
}: {
  project: Project;
  framework_id: number;
  projectFrameworkId: number;
}) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [annexes, setAnnexes] = useState<AnnexStructISO[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [controlsMap, setControlsMap] = useState<{ [key: number]: any[] }>({});
  const [loadingControls, setLoadingControls] = useState<{
    [key: number]: boolean;
  }>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-42001/annexes/struct/byProjectId/${projectFrameworkId}`,
        });
        setAnnexes(response.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };

    fetchClauses();
  }, [projectFrameworkId, refreshTrigger]);

  const fetchControls = useCallback(async (annexId: number) => {
    setLoadingControls((prev) => ({ ...prev, [annexId]: true }));
    try {
      const response = (await GetAnnexCategoriesById({
        routeUrl: `/iso-42001/annexCategories/byAnnexId/${annexId}`,
      })) as { data: Partial<AnnexCategoryISO & AnnexCategoryStructISO>[] };
      setControlsMap((prev) => ({ ...prev, [annexId]: response.data }));
    } catch (error) {
      console.error("Error fetching controls:", error);
      setControlsMap((prev) => ({ ...prev, [annexId]: [] }));
    } finally {
      setLoadingControls((prev) => ({ ...prev, [annexId]: false }));
    }
  }, []);

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
    console.log("annex ===> ", annex);
    setSelectedControl(control);
    console.log("control ===> ", control);
    setSelectedIndex(index);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
  };

  const handleSaveSuccess = async () => {
    // If there's an expanded annex, refresh its controls
    if (expanded !== false) {
      await fetchControls(expanded);
    }
    // Trigger a refresh of the annexes
    setRefreshTrigger((prev) => prev + 1);
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

  function dynamicAnnexes(
    annex: AnnexStructISO,
    element: {
      id: number;
      order: string;
      title: string;
      annexes: {
        id: number;
        order: number;
        title: string;
        controls: {
          id: number;
          control_no: number;
          control_subSection: number;
          title: string;
          shortDescription: string;
          guidance: string;
          status: string;
        }[];
      }[];
    }
  ) {
    const isLoading = loadingControls[annex.id ?? 0];

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
        ) : annex.annexcategories.length > 0 ? (
          annex.annexcategories.map(
            (
              control: Partial<AnnexCategoryISO & AnnexCategoryStructISO>,
              index: number
            ) => {
              const isLastControl = index === annex.annexcategories.length - 1;

              return (
                <Stack
                  key={control.id}
                  onClick={() =>
                    handleControlClick(element.order, annex, control, index)
                  }
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    borderBottom: isLastControl ? "none" : "1px solid #eaecf0",
                    cursor: "pointer",
                    fontSize: 13,
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                    },
                  }}
                >
                  <Stack sx={{ gap: "4px" }}>
                    <Typography fontWeight={600}>
                      {element.order}.{annex.annex_no}.{index + 1}{" "}
                      {control.title}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#666" }}>
                      {control.description}
                    </Typography>
                  </Stack>
                  <Stack
                    sx={{
                      borderRadius: "4px",
                      padding: "5px 10px",
                      backgroundColor: getStatusColor(control.status ?? ""),
                      color: "#fff",
                      height: "fit-content",
                      minWidth: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {control.status
                      ? control.status.charAt(0).toUpperCase() +
                        control.status.slice(1).toLowerCase()
                      : "Not started"}
                  </Stack>
                </Stack>
              );
            }
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
    <Stack className="iso-42001-annex">
      {ISO42001AnnexList.map((element) => (
        <>
          <Typography
            key={element.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            Annex {element.order} : {element.title}
          </Typography>
          {annexes &&
            annexes.map((annex: AnnexStructISO) => (
              <Stack
                key={annex.id}
                sx={{
                  maxWidth: "1400px",
                  marginTop: "14px",
                  gap: "20px",
                }}
              >
                <Accordion
                  key={annex.id}
                  expanded={expanded === annex.id}
                  onChange={handleAccordionChange(annex.id ?? 0)}
                  sx={{
                    marginTop: "9px",
                    border: "1px solid #eaecf0",
                    width: "100%",
                    marginLeft: "1.5px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
                    margin: 0,
                    padding: 0,
                    boxShadow: "none",
                    ".MuiAccordionDetails-root": {
                      padding: 0,
                      margin: 0,
                    },
                  }}
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
                            expanded === annex.id
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
                      {annex.title}
                    </Typography>
                  </AccordionSummary>
                  {dynamicAnnexes(annex, element)}
                </Accordion>
              </Stack>
            ))}
        </>
      ))}
      <VWISO42001AnnexDrawerDialog
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={`${selectedOrder}.${selectedAnnex?.annex_no}.${
          selectedIndex + 1
        } ${selectedControl?.title}`}
        control={selectedControl}
        annex={selectedAnnex}
        projectFrameworkId={projectFrameworkId}
        project_id={project.id}
        onSaveSuccess={handleSaveSuccess}
      />
    </Stack>
  );
};

export default ISO42001Annex;
