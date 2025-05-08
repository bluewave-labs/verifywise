import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { ISO42001AnnexList } from "./annex.structure";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ISO42001Annex = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
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
                    }}
                  >
                    {annex.order}.{item.order} : {item.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {item.controls.map((control) => (
                    <Stack
                      key={control.id}
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
    </Stack>
  );
};

export default ISO42001Annex;
