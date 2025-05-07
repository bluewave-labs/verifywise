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

const ISO42001ClauseList = [
  {
    id: 1,
    title: "Management System",
    clauses: [
      {
        number: 4,
        title: "Context of the Organization",
      },
      {
        number: 5,
        title: "Leadership",
      },
      {
        number: 6,
        title: "Planning",
      },
      {
        number: 7,
        title: "Support",
      },
      {
        number: 8,
        title: "Operation",
      },
      {
        number: 9,
        title: "Performance Evaluation",
      },
      {
        number: 10,
        title: "Improvement",
      },
    ],
  },
];

const ISO42001Clauses = () => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Stack
      className="iso-42001-clauses"
      sx={{
        maxWidth: "1400px",
        marginTop: "14px",
        gap: "20px",
      }}
    >
      {ISO42001ClauseList.map((clause) => (
        <>
          <Typography
            key={clause.id}
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            {clause.title} {" Clauses"}
          </Typography>
          {clause.clauses.map((clause) => (
            <Stack key={clause.number}>
              <Accordion
                key={clause.number}
                expanded={true}
                sx={accordionStyle}
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
