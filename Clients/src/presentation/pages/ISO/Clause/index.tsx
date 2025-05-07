import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { accordionStyle } from "../style";
import { useState } from "react";
import { ISO42001ClauseList } from "./clause.structure";

const ISO42001Clauses = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Stack className="iso-42001-clauses">
      {ISO42001ClauseList.map((clause) => (
        <>
          <Typography
            key={clause.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            {clause.title} {" Clauses"}
          </Typography>
          {clause.clauses.map((clause) => (
            <Stack
              key={clause.number}
              sx={{
                maxWidth: "1400px",
                marginTop: "14px",
                gap: "20px",
              }}
            >
              <Accordion
                key={clause.number}
                expanded={expanded === clause.number}
                sx={{
                  ...accordionStyle,
                  ".MuiAccordionDetails-root": {
                    padding: 0,
                    margin: 0,
                  },
                }}
                onChange={handleAccordionChange(clause.number ?? 0)}
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
                          expanded === clause.number
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
                    {"Clause "} {clause.number} {" : "} {clause.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}></AccordionDetails>
              </Accordion>
            </Stack>
          ))}
        </>
      ))}
    </Stack>
  );
};

export default ISO42001Clauses;
