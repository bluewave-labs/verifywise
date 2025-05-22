import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { ISO42001AnnexList } from "./annex.structure";
import { useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VWISO42001AnnexDrawerDialog from "../../../components/Drawer/AnnexDrawerDialog";
import { Project } from "../../../../domain/types/Project";
import { GetAnnexesByProjectFrameworkId } from "../../../../application/repository/annex_struct_iso.repository";
import { AnnexStructISO } from "../../../../domain/types/AnnexStructISO";

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

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-42001/annexes/byProjectId/${projectFrameworkId}`,
        });
        setAnnexes(response.data.data);
      } catch (error) {
        console.error("Error fetching annexes:", error);
      }
    };

    fetchClauses();
  }, [projectFrameworkId]);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
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

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
  };

  function getStatusColor(status: string) {
    const normalizedStatus = status?.trim() || "Not Started";
    switch (normalizedStatus.toLowerCase()) {
      case "not started":
        return "#C63622";
      case "draft":
        return "#D68B61";
      case "in progress":
        return "#D6B971";
      case "awaiting review":
        return "#D6B971";
      case "awaiting approval":
        return "#D6B971";
      case "implemented":
        return "#B8D39C";
      case "audited":
        return "#B8D39C";
      case "needs rework":
        return "#800080";
      default:
        return "#C63622"; // Default to "Not Started" color
    }
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
          {annexes.map((annex: AnnexStructISO) => (
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
                onChange={handleAccordionChange(Number(annex.id))}
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
                <AccordionDetails sx={{ padding: 0 }}>
                  {annex.subClauses.map((control, index: number) => (
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
                        borderBottom:
                          annex.subClauses.length - 1 ===
                          annex.subClauses.indexOf(control)
                            ? "none"
                            : "1px solid #eaecf0",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <Stack>
                        <Typography fontWeight={600}>
                          {element.order}.{annex.annex_no}.{index + 1}{" "}
                          {control.title}
                        </Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          {control.description}
                        </Typography>
                      </Stack>
                      <Stack
                        sx={{
                          borderRadius: "4px",
                          padding: "5px",
                          backgroundColor: getStatusColor(control.status || ""),
                          color: "#fff",
                          height: "fit-content",
                        }}
                      >
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
      />
    </Stack>
  );
};

export default ISO42001Annex;
