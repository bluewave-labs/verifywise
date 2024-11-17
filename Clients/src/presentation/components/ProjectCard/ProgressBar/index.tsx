/**
 * Progress bar display component for calculating the status of completed actions in fields.
 *
 * @component
 * @param {ProgressBarProps} props - The properties for the ProgressBar component.
 * @param {string} props.progress - The progress indicator as a fraction.
 *
 * @returns {JSX.Element} The rendered ProgressBar component.
 */

import { Slider, Stack, useTheme } from "@mui/material";
import { FC } from "react";

interface ProgressBarProps {
    progress: string | undefined
}

const ProgressBar: FC<ProgressBarProps> = ({progress = ""}) => {
    const theme = useTheme();
    const progressCount = (progressString: string): number => {
        const [completed, total] = progressString.split('/').map(Number);
        if (Number.isNaN(completed) || Number.isNaN(total) || total === 0) {
            throw new Error(`Invalid progress string: ${progressString}`);
        }
        return completed / total;
    };
    const value = progressCount(progress) * 100;

    return (
        <Stack 
            direction="row" 
            sx={{ 
                "& .MuiSlider-track": { 
                    backgroundColor: "#4C7DE7",
                    display: !value ? "none" : "block"
                }, 
                "& .MuiSlider-thumb": { 
                    display: "none" 
                },
                "& .MuiSlider-rail": {
                    opacity: 1
                },
                "& .MuiSlider-root": {
                    p: 0
                }
            }}
        >
            <Slider value={value} sx={{ 
                cursor: "auto", 
                height: 8, 
                border: "none", 
                color: theme.palette.border.light 
            }}/>
        </Stack>
    )
}

export default ProgressBar;