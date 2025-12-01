import React from "react";
import { Box } from "@mui/material";

export interface TagChipProps {
  tag: string;
}

// Define color schemes for official POLICY_TAGS
const getTagStyle = (tag: string) => {
  const tagLower = tag.toLowerCase();

  // Color mapping based on official POLICY_TAGS from backend
  const tagStyles: Record<string, { bg: string; color: string }> = {
    // Ethics & Fairness - Green tones
    "ai ethics": { bg: "#E6F4EA", color: "#138A5E" },
    fairness: { bg: "#E8F5E9", color: "#2E7D32" },
    "bias mitigation": { bg: "#F1F8E9", color: "#558B2F" },

    // Transparency & Explainability - Blue tones
    transparency: { bg: "#E3F2FD", color: "#1565C0" },
    explainability: { bg: "#E1F5FE", color: "#0277BD" },

    // Privacy & Data Governance - Purple tones
    privacy: { bg: "#F3E5F5", color: "#6A1B9A" },
    "data governance": { bg: "#EDE7F6", color: "#4527A0" },

    // Risk & Security - Orange/Red tones
    "model risk": { bg: "#FFE5D0", color: "#E64A19" },
    security: { bg: "#FFECB3", color: "#F57F17" },

    // Accountability & Oversight - Deep Purple
    accountability: { bg: "#EDE7F6", color: "#5E35B1" },
    "human oversight": { bg: "#E8EAF6", color: "#3949AB" },

    // Compliance & Standards - Amber/Brown tones
    "eu ai act": { bg: "#FFF8E1", color: "#F57C00" },
    "iso 42001": { bg: "#FFF3E0", color: "#EF6C00" },
    "nist rmf": { bg: "#FFECB3", color: "#F9A825" },

    // LLM Specific - Cyan
    llm: { bg: "#E0F7FA", color: "#00838F" },
  };

  // Check for exact matches (case-insensitive)
  for (const [key, style] of Object.entries(tagStyles)) {
    if (tagLower === key) {
      return style;
    }
  }

  // Default style for unmatched tags
  return { bg: "#F5F5F5", color: "#616161" };
};

const TagChip: React.FC<TagChipProps> = ({ tag }) => {
  const style = getTagStyle(tag);

  return (
    <Box
      component="span"
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: "4px",
        fontWeight: 500,
        fontSize: 11,
        textTransform: "uppercase",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {tag}
    </Box>
  );
};

export default TagChip;
