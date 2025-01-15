import { Typography, Box, useTheme } from "@mui/material";
import { FC, memo, useContext } from "react";
import euimg from "../../assets/imgs/eu-ai-act.jpg";
import ProgressBar from "./ProgressBar";
import { Btn, Card, styles, SubtitleValue, Title } from "./styles";
import { formatDate } from "../../tools/isoDateToString";
import useNavigateSearch from "../../../application/hooks/useNavigateSearch";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { User } from "../../../application/hooks/useProjectData";

export interface ProjectCardProps {
    id: number;
    project_title: string;
    owner: string;
    last_updated: string;
    projectAssessments: {
      projectId: number;
      totalAssessments: number;
      doneAssessments: number;
    };
    projectControls: {
      projectId: number;
      totalSubControls: number;
      doneSubControls: number;
    };
}

const ProgressBarRender: FC<{ progress: string | null; label: string, completed: number }> = memo(({ progress, label, completed }) => (
    <>
        <ProgressBar progress={progress} />
        <Typography sx={styles.progressBarTitle}>
            {completed} {label}{completed > 1 && 's'} completed
        </Typography>
    </>
));

const ProjectCard: FC<ProjectCardProps> = ({
    id,
    project_title,
    owner,
    last_updated,
    projectAssessments,
    projectControls,
}) => {
    const theme = useTheme();
    const navigate = useNavigateSearch();
    const { dashboardValues } = useContext(VerifyWiseContext);
    const { users } = dashboardValues;

    const ownerUser: User = users.find((user: User) => user.id === owner) ?? '';

    // The default value '0/1' is been added because the mock data has just one subControl and one assessment and two projects.
    // Once the real data is been used, the default value can be removed.
    const controlsProgress = projectControls?.doneSubControls && projectControls?.totalSubControls ? `${projectControls?.doneSubControls}/${projectControls?.totalSubControls}` : '0/1'
    const requirementsProgress = projectAssessments?.doneAssessments && projectAssessments?.totalAssessments ? `${projectAssessments?.doneAssessments}/${projectAssessments?.totalAssessments}` : '0/1'

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
                    <SubtitleValue>{ownerUser ? `${ownerUser.name} ${ownerUser.surname}` : 'Unknown User'}</SubtitleValue>
                </Box>
                <Box>
                    <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
                        Last updated
                    </Typography>
                    <SubtitleValue>{last_updated !== null && formatDate(last_updated)}</SubtitleValue>
                </Box>
            </Box>
            <ProgressBarRender progress={controlsProgress} label="control" completed={projectControls?.doneSubControls ?? '0'} />
            <ProgressBarRender progress={requirementsProgress} label="requirement" completed={projectAssessments?.doneAssessments ?? '0'} />
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
                    onClick={() => navigate('/project-view', {projectId: id.toString()})}
                >
                    View project
                </Btn>
            </Box>
        </Card>
    );
};

export default ProjectCard;