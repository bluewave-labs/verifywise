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

const ISO42001Annex = ({
  project,
  framework_id,
  projectFrameworkId,
}: {
  project: Project;
  framework_id: number;
  projectFrameworkId: number;
}) => {
  console.log("project", project);
  console.log("framework_id", framework_id);
  console.log("projectFrameworkId", projectFrameworkId);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [selectedAnnex, setSelectedAnnex] = useState<any>(null);
  const [annexes, setAnnexes] = useState<any>([]);

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const response = await GetAnnexesByProjectFrameworkId({
          routeUrl: `/iso-42001/annexes/byProjectId/${projectFrameworkId}`,
        });
        setAnnexes(response.data);
        console.log("annexes", annexes);
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

  const handleControlClick = (order: any, annex: any, control: any) => {
    setSelectedOrder(order);
    setSelectedAnnex(annex);
    setSelectedControl(control);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedControl(null);
    setSelectedAnnex(null);
  };

  function getStatusColor(status: string) {
    switch (status) {
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
        return "#B8D39C";
      case "Audited":
        return "#B8D39C";
      case "Needs Rework":
        return "#800080";
    }
  }

  return (
    <Stack className="iso-42001-annex">
      {ISO42001AnnexList.map((annex) => (
        <>
          <Typography
            key={annex.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            Annext {annex.order} : {annex.title}
          </Typography>
          {annex.annexes.map((item) => (
            <Stack
              key={item.id}
              sx={{
                maxWidth: "1400px",
                marginTop: "14px",
                gap: "20px",
              }}
            >
              <Accordion
                key={item.id}
                expanded={expanded === item.id}
                onChange={handleAccordionChange(item.id)}
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
                          expanded === item.id
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
                    {annex.order}.{item.order} : {item.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {item.controls.map((control) => (
                    <Stack
                      key={control.id}
                      onClick={() =>
                        handleControlClick(annex.order, item, control)
                      }
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderBottom:
                          annex.annexes.length - 1 ===
                          annex.annexes.indexOf(item)
                            ? "none"
                            : "1px solid #eaecf0",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <Stack>
                        <Typography fontWeight={600}>
                          {annex.order +
                            "." +
                            item.order +
                            "." +
                            control.control_no +
                            "." +
                            control.control_subSection}{" "}
                          {control.title}
                        </Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          {control.shortDescription}
                        </Typography>
                      </Stack>
                      <Stack
                        sx={{
                          borderRadius: "4px",
                          padding: "5px",
                          backgroundColor: getStatusColor(control.status),
                          color: "#fff",
                          height: "fit-content",
                        }}
                      >
                        {control.status}
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
        title={`${selectedOrder}.${selectedAnnex?.order}.${selectedControl?.control_no}.${selectedControl?.control_subSection}: ${selectedControl?.title}`}
        control={selectedControl}
        annex={selectedAnnex}
      />
    </Stack>
  );
};

export default ISO42001Annex;
