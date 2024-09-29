/**
 * Progress bar display component for calculating the status of completed actions in fields.
 *
 * @component
 * @param {ProgressBarProps} props - The properties for the ProgressBar component.
 * @param {string} props.progress - The progress indicator as a fraction.
 *
 * @returns {JSX.Element} The rendered ProgressBar component.
 */

import { Slider, Stack } from "@mui/material";
import { FC } from "react";
import "./styles.css";

interface ProgressBarProps {
    progress: string
}

const ProgressBar: FC<ProgressBarProps> = ({progress}) => {
    const progressCount = (progressString: string): number => {
        const [completed, total] = progressString.split('/').map(Number);
        if (Number.isNaN(completed) || Number.isNaN(total) || total === 0) {
            throw new Error(`Invalid progress string: ${progressString}`);
        }
        return completed / total;
      };
    const value = progressCount(progress) * 100;
      
    return (
        <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }}>
            <Slider value={value} sx={{ cursor: "auto", p: 0, height: 8, border: "none" }}/>
        </Stack>
    )
}

export default ProgressBar;