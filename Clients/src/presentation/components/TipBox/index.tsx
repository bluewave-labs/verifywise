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

/**
 * TipBox component that displays entity-specific tips to users.
 * Tips are shown one at a time and dismissed permanently when closed.
 * The next tip appears on the user's next visit to the entity page.
 */
const TipBox = ({ entityName }: TipBoxProps) => {
  const { currentTip, dismissTip, currentTipNumber, totalTips } = useTipManager(entityName);

  if (!currentTip) {
    return null;
  }

  return (
    <Box
      sx={{
        marginTop: "16px",
        marginBottom: "16px",
        animation: `${fadeIn} 0.3s ease-out`,
      }}
    >
      <InfoBox
        header={currentTip.header}
        message={currentTip.content}
        storageKey={`tip_${entityName}`}
        variant="info"
        onDismiss={dismissTip}
        disableInternalStorage={true}
        backgroundColor="#EFF6FF"
        borderColor="#DBEAFE"
        tipCounter={`Tip ${currentTipNumber} of ${totalTips}`}
      />
    </Box>
  );
};

export default TipBox;
