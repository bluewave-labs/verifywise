import { Typography, Box, useTheme } from "@mui/material";
import Button from '@mui/material/Button';
import { FC } from "react";
import euimg from "../../assets/imgs/eu-ai-act.jpg"
import ProgressBar from "./ProgressBar";
import { Btn, Card, styles, SubtitleValue, Title } from "./styles";

export interface ProjectCardProps {
    id: number,
    name: string,
    owner_name: string,
    last_update: string,
    controls_completed: string,
    requirements_completed: string
}

const ProjectCard: FC<ProjectCardProps> = ({
    name,
    owner_name,
    last_update,
    controls_completed,
    requirements_completed
}) => {
    const theme = useTheme();
    const renderProgressBar = (progress: string, label: string) => (
        <>
            <ProgressBar progress={progress} />
            <Typography sx={styles.progressBarTitle}>
                {progress} {label} completed
            </Typography>
        </>
    );

    return (
        <Card>
            <Title variant="h5">
                {name}
            </Title>
            <Box sx={styles.upperBox}>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
                        Project owner
                    </Typography>
                    <SubtitleValue>{owner_name}</SubtitleValue>
                </Box>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
                        Last updated
                    </Typography>
                    <SubtitleValue>{last_update}</SubtitleValue>
                </Box>
            </Box>
            {renderProgressBar(controls_completed, "controls")}
            {renderProgressBar(requirements_completed, "requirements")}
            <Box sx={styles.lowerBox}>
                <Box sx={{ display: "flex", mb: 1.5 }}>
                    <Box sx={styles.imageBox}>
                        <img src={euimg} alt="EU AI Act" />
                    </Box>
                    <Typography sx={styles.imageTitle}>
                        EU AI Act
                    </Typography>
                </Box>                    
                <Btn variant="outlined" disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}>
                    View project
                </Btn>
            </Box>
        </Card>
    )
}

export default ProjectCard;