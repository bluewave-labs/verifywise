import { Box } from "@mui/material";
import { useTipManager } from "../../../application/hooks/useTipManager";
import InfoBox from "../InfoBox";

interface TipBoxProps {
  entityName: string;
}

/**
 * TipBox component that displays entity-specific tips to users.
 * Tips are shown one at a time and dismissed permanently when closed.
 * The next tip appears on the user's next visit to the entity page.
 */
const TipBox = ({ entityName }: TipBoxProps) => {
  const { currentTip, dismissTip } = useTipManager(entityName);

  if (!currentTip) {
    return null;
  }

  return (
    <Box sx={{ marginTop: "16px", marginBottom: "16px" }}>
      <InfoBox
        header={currentTip.header}
        message={currentTip.content}
        storageKey={`tip_${entityName}`}
        variant="info"
        onDismiss={dismissTip}
      />
    </Box>
  );
};

export default TipBox;
