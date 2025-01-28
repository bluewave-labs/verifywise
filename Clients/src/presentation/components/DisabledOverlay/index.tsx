import React from "react";
import {Stack, CircularProgress} from "@mui/material";

interface DisabledOverlayProps {
    isActive: boolean;
}

const DisabledOverlay: React.FC<DisabledOverlayProps> = ({isActive}) => {
    return (
        <Stack
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1300,
                display: isActive ? "flex" : "none",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <CircularProgress />
        </Stack>
    );
};  
export default DisabledOverlay;