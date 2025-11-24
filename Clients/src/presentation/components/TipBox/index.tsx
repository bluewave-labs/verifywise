import { Box, keyframes, Typography } from "@mui/material";
import { useTipManager } from "../../../application/hooks/useTipManager";
import InfoBox from "../InfoBox";

interface TipBoxProps {
  entityName: string;
}

// Fade-in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Color options for testing
const TIP_COLORS = [
  { name: "Soft Blue", bg: "#EFF6FF", border: "#DBEAFE" },
  { name: "Mint Green", bg: "#F0FDF4", border: "#DCFCE7" },
  { name: "Light Lavender", bg: "#F5F3FF", border: "#EDE9FE" },
  { name: "Peachy Cream", bg: "#FFF7ED", border: "#FFEDD5" },
  { name: "Soft Pink", bg: "#FDF2F8", border: "#FCE7F3" },
  { name: "Light Cyan", bg: "#ECFEFF", border: "#CFFAFE" },
  { name: "Pale Yellow", bg: "#FEFCE8", border: "#FEF9C3" },
  { name: "Light Rose", bg: "#FFF1F2", border: "#FFE4E6" },
  { name: "Soft Teal", bg: "#F0FDFA", border: "#CCFBF1" },
  { name: "Lavender Mist", bg: "#FAF5FF", border: "#F3E8FF" },
];

// Simple hash function to consistently pick a color based on entity name
const getColorForEntity = (entityName: string) => {
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = entityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TIP_COLORS[Math.abs(hash) % TIP_COLORS.length];
};

/**
 * TipBox component that displays entity-specific tips to users.
 * Tips are shown one at a time and dismissed permanently when closed.
 * The next tip appears on the user's next visit to the entity page.
 */
const TipBox = ({ entityName }: TipBoxProps) => {
  const { currentTip, dismissTip } = useTipManager(entityName);
  const colorScheme = getColorForEntity(entityName);

  if (!currentTip) {
    return null;
  }

  return (
    <Box
      sx={{
        marginTop: "16px",
        marginBottom: "16px",
        animation: `${fadeIn} 0.3s ease-out`,
        position: "relative",
      }}
    >
      {/* Color name label for testing */}
      <Typography
        sx={{
          position: "absolute",
          top: -20,
          right: 0,
          fontSize: 10,
          color: "#999",
          fontWeight: 500,
          letterSpacing: "0.5px",
        }}
      >
        Color: {colorScheme.name}
      </Typography>

      <InfoBox
        header={currentTip.header}
        message={currentTip.content}
        storageKey={`tip_${entityName}`}
        variant="info"
        onDismiss={dismissTip}
        disableInternalStorage={true}
        backgroundColor={colorScheme.bg}
        borderColor={colorScheme.border}
      />
    </Box>
  );
};

export default TipBox;
