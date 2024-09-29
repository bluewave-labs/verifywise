/**
 * Progress bar display component for calculating the status of completed actions in fields.
 *
 * @component
 * @param {ProgressBarProps} props - The properties for the ProgressBar component.
 * @param {string} props.progress - The progress indicator as a fraction.
 *
 * @returns {JSX.Element} The rendered ProgressBar component.
 */

import { Box } from "@mui/material";
import { FC } from "react";

interface ProgressBarProps {
    progress: string
}

const ProgressBar: FC<ProgressBarProps> = ({progress}) => {
    const progressCount = (progressString: string): number => {
        const [completed, total] = progressString.split('/').map(Number);
        if (isNaN(completed) || isNaN(total) || total === 0) {
          console.error(`Invalid progress string: ${progressString}`);
          return 0;
        }
        return completed / total;
      };
    const widthValue = progressCount(progress) * 100;
      
    return (
        <Box sx={{ width: "100%", backgroundColor: "#EAECF0", borderRadius: 2, height: 8, position: "relative" }}>
            <Box sx={{ width: widthValue, height: 8 , backgroundColor: "#4C7DE7", borderRadius: 2, position: "absolute" }} />
        </Box>
    )
}

export default ProgressBar;