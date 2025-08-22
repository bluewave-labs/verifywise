import { Accordion, AccordionSummary, Stack, Typography } from "@mui/material";
import { Iso27001GetClauseStructByFrameworkID } from "../../../../../application/repository/clause_struct_iso.repository";
import { ClauseStructISO } from "../../../../../domain/types/ClauseStructISO";
import { useEffect, useState } from "react";
import { styles } from "./style";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ISO27001Clause = ({ FrameworkId }: { FrameworkId: number | string }) => {
  const [clauses, setClauses] = useState<ClauseStructISO[]>([]);
  const [expanded, setExpanded] = useState<number | false>(false);

  const fetchClauses = async () => {
    const response = await Iso27001GetClauseStructByFrameworkID({
      routeUrl: `/iso-27001/clauses/struct/byProjectId/${FrameworkId}`,
    });
    setClauses(response.data);
    console.log("clauses : ==> ", clauses);
  };

  useEffect(() => {
    fetchClauses();
  }, [FrameworkId]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Stack spacing={4}>
      <Typography
        sx={{
          color: "#1A1919",
          fontWeight: 600,
          mb: "6px",
          fontSize: 16,
          mt: 4,
        }}
      >
        Management System Clauses
      </Typography>
      {clauses &&
        clauses.map((clause: any) => (
          <Stack key={clause.id} sx={styles.container}>
            <Accordion
              key={clause.id}
              expanded={expanded === clause.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(clause.id ?? 0)}
            >
              <AccordionSummary sx={styles.accordionSummary}>
                <ExpandMoreIcon
                  sx={styles.expandIcon(expanded === clause.id)}
                />
                <Typography sx={{ paddingLeft: "2.5px", fontSize: 13 }}>
                  {clause.arrangement} {clause.title}
                </Typography>
              </AccordionSummary>
              {/* {dynamicSubClauses(clause)} */}
            </Accordion>
          </Stack>
        ))}
    </Stack>
  );
};

export default ISO27001Clause;
