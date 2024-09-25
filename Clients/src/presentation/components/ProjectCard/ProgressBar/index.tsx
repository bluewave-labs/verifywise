import { Box } from "@mui/material";
import { FC } from "react";

interface ProgressBarProps {
    progress: number
}

const ProgressBar: FC<ProgressBarProps> = ({progress}) => {
    const widthValue = progress * 100;
    return (
        <Box sx={{ width: "100%", backgroundColor: "#EAECF0", borderRadius: 2, height: 8, position: "relative" }}>
            <Box sx={{ width: widthValue, height: 8 , backgroundColor: "#4C7DE7", borderRadius: 2, position: "absolute" }} />
        </Box>
    )
}

export default ProgressBar;