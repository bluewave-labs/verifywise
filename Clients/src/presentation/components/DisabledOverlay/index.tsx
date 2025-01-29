import React from "react";
import { Stack} from "@mui/material";

interface DisabledOverlayProps {
  isActive: boolean;
}

const DisabledOverlay: React.FC<DisabledOverlayProps> = ({ isActive }) => {
    console.log("disabled overlay", isActive);
  if (!isActive) {
    return null;
  }
  return (
    <Stack
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 3000,
        pointerEvents:"all",
    
      }}
    />
    
  );
};
export default DisabledOverlay;
