/**
 * FAQTab - Displays frequently asked questions
 * Uses VerifyWise theme variables for consistent styling
 */

import React from "react";
import {
  Stack,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import { FAQTabProps } from "./types";
import {
  colors,
  spacing,
  typography,
  border,
} from "../../UserGuide/styles/theme";

const FAQTab: React.FC<FAQTabProps> = ({ plugin }) => {
  if (!plugin.faq || plugin.faq.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ fontSize: typography.fontSize.md, color: colors.text.muted }}>
          No FAQ available for this plugin.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ gap: spacing.lg }}>
      {plugin.faq.map((item, index) => (
        <Accordion
          key={index}
          elevation={0}
          disableGutters
          sx={{
            border: border.default,
            borderRadius: `${border.radius} !important`,
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          }}
        >
          <AccordionSummary
            expandIcon={<ChevronDown size={16} color={colors.text.muted} />}
            sx={{
              minHeight: 48,
              px: "8px",
              "& .MuiAccordionSummary-content": { my: 1 },
            }}
          >
            <Typography
              sx={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
              }}
            >
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: 2, px: "8px" }}>
            <Typography
              sx={{
                fontSize: typography.fontSize.base,
                color: colors.text.muted,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};

export default FAQTab;
