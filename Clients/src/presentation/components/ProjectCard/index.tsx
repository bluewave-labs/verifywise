import { Typography, Box, useTheme } from "@mui/material";
import { FC, memo } from "react";
import euimg from "../../assets/imgs/eu-ai-act.jpg";
import ProgressBar from "./ProgressBar";
import { Btn, Card, styles, SubtitleValue, Title } from "./styles";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../tools/isoDateToString";

export interface ProjectCardProps {
    id: number;
    project_title: string;
    owner: string;
    start_date: string;
    controls_completed: string | null;
    requirements_completed: string | null;
}

const ProgressBarRender: FC<{ progress: string | null; label: string }> = memo(({ progress, label }) => (
    <>
        <ProgressBar progress={progress} />
        <Typography sx={styles.progressBarTitle}>
            {progress} {label} completed
        </Typography>
    </>
));

const ProjectCard: FC<ProjectCardProps> = ({
    project_title,
    owner,
    start_date,
    controls_completed,
    requirements_completed
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Card>
            <Title variant="h5">
                {project_title}
            </Title>
            <Box sx={styles.upperBox}>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
                        Project owner
                    </Typography>
                    <SubtitleValue>{owner}</SubtitleValue>
                </Box>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
                        Last updated
                    </Typography>
                    <SubtitleValue>{formatDate(start_date)}</SubtitleValue>
                </Box>
            </Box>
            <ProgressBarRender progress={controls_completed} label="controls" />
            <ProgressBarRender progress={requirements_completed} label="requirements" />
            <Box sx={styles.lowerBox}>
                <Box sx={{ display: "flex", mb: 1.5 }}>
                    <Box sx={styles.imageBox}>
                        <img src={euimg} alt="EU AI Act" />
                    </Box>
                    <Typography sx={styles.imageTitle}>
                        EU AI Act
                    </Typography>
                </Box>
                <Btn
                    variant="outlined"
                    disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
                    onClick={() => navigate("/project-view")}
                >
                    View project
                </Btn>
            </Box>
        </Card>
    );
};

export default ProjectCard;