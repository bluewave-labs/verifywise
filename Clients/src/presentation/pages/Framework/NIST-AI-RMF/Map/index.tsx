import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import { useEffect, useState } from "react";
import { styles } from "../../ISO27001/Clause/style";
import { ArrowRight as RightArrowBlack } from "lucide-react";

const NISTAIRMFMap = () => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEntityById({
          routeUrl: `/nist-ai-rmf/categories/MAP`,
        });
        setCategories(response.data || []);
      } catch (err) {
        console.error("Error fetching NIST AI RMF categories:", err);
        setError("Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAccordionChange =
    (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  if (loading) {
    return (
      <Stack sx={{ p: 2 }}>
        <Typography>Loading categories...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Stack>
    );
  }

  return (
    <Stack className="nist-ai-rmf-map">
      <Typography sx={{ ...styles.title, mt: 4 }}>
        {"NIST AI RMF - Map Categories"}
      </Typography>
      {categories &&
        categories.map((category: any) => (
          <Stack key={category.id} sx={styles.container}>
            <Accordion
              key={category.id}
              expanded={expanded === category.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(category.id ?? 0)}
            >
              <AccordionSummary sx={styles.accordionSummary}>
                <RightArrowBlack
                  size={16}
                  style={
                    styles.expandIcon(
                      expanded === category.id
                    ) as React.CSSProperties
                  }
                />
                <Stack sx={{ paddingLeft: "2.5px", width: "100%" }}>
                  <Typography sx={{ fontSize: 13 }}>
                    {category.title}
                    {category.index !== undefined && category.index !== null
                      ? ` ${category.index}`
                      : ""}
                  </Typography>
                  {category.description && (
                    <Typography fontSize={13} sx={{ mt: 0.5 }}>
                      {category.description}
                    </Typography>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}></AccordionDetails>
            </Accordion>
          </Stack>
        ))}
    </Stack>
  );
};

export default NISTAIRMFMap;
