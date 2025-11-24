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

  const tipCounter = `Tip ${currentTipNumber} of ${totalTips}`;

  return (
    <Box
      sx={{
        marginTop: "8px",
        marginBottom: "8px",
        animation: `${fadeIn} 0.3s ease-out`,
        position: "relative",
      }}
    >
      {tipCounter && (
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: 16,
            backgroundColor: "#F5F5F5",
            border: "1px solid #E5E5E5",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 500,
            color: "#999",
            zIndex: 1,
          }}
        >
          {tipCounter}
        </Box>
      )}
      <InfoBox
        header={currentTip.header}
        message={currentTip.content}
        storageKey={`tip_${entityName}`}
        variant="info"
        onDismiss={dismissTip}
        disableInternalStorage={true}
        backgroundColor="linear-gradient(135deg, #EFF6FF 0%, #F8FBFF 100%)"
        borderColor="#DBEAFE"
      />
    </Box>
  );
};

export default TipBox;
