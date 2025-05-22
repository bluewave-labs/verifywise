import { Typography, Box, useTheme } from "@mui/material";
import { FC, memo, useContext } from "react";
import euimg from "../../assets/imgs/eu-ai-act.jpg";
import ProgressBar from "./ProgressBar";
import { Btn, Card, styles, SubtitleValue, Title } from "./styles";
import useNavigateSearch from "../../../application/hooks/useNavigateSearch";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import getProjectData from "../../../application/tools/getProjectData";
import {
  Assessments,
  Controls,
} from "../../../application/hooks/useProjectStatus";
import { formatDate } from "../../tools/isoDateToString";
import { User } from "../../../domain/types/User";

export interface ProjectCardProps {
  id: number;
  project_title: string;
  owner: string;
  assessments: Assessments;
  controls: Controls;
  last_updated: string;
}

const ProgressBarRender: FC<{
  progress: string | null;
  label: string;
  completed: number;
}> = memo(({ progress, label, completed }) => (
  <>
    <ProgressBar progress={progress} />
    <Typography sx={styles.progressBarTitle}>
      {progress} {label}
      {completed > 1 && "s"} completed
    </Typography>
  </>
));

const ProjectCard: FC<ProjectCardProps> = ({
  id,
  project_title,
  owner,
  assessments,
  controls,
  last_updated,
}) => {
  const theme = useTheme();
  const navigate = useNavigateSearch();
  const { users } = useContext(VerifyWiseContext);
  const ownerUser: User = users.find((user: User) => user.id.toString() === owner) ?? ({} as User);

  const {
    controlsProgress,
    requirementsProgress,
    controlsCompleted,
    requirementsCompleted,
  } = getProjectData({ projectId: id, assessments, controls });

  return (
    <Card>
      <Title variant="h5">{project_title}</Title>
      <Box sx={styles.upperBox}>
        <Box>
          <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
            Project owner
          </Typography>
          <SubtitleValue>
            {ownerUser
              ? `${ownerUser.name} ${ownerUser.surname}`
              : "Unknown User"}
          </SubtitleValue>
        </Box>
        <Box>
          <Typography variant="subtitle1" component="span" sx={styles.subtitle}>
            Last updated
          </Typography>
          <SubtitleValue>
            {last_updated ? formatDate(last_updated.toString()) : "NA"}
          </SubtitleValue>
        </Box>
      </Box>
      <ProgressBarRender
        progress={controlsProgress}
        label="control"
        completed={controlsCompleted}
      />
      <ProgressBarRender
        progress={requirementsProgress}
        label="requirement"
        completed={requirementsCompleted}
      />
      <Box sx={styles.lowerBox}>
        <Box sx={{ display: "flex", mb: 1.5 }}>
          <Box sx={styles.imageBox}>
            <img src={euimg} alt="EU AI Act" />
          </Box>
          <Typography sx={styles.imageTitle}>EU AI Act</Typography>
        </Box>
        <Btn
          variant="outlined"
          disableRipple={
            theme.components?.MuiButton?.defaultProps?.disableRipple
          }
          onClick={() =>
            navigate("/test/project-view", { projectId: id.toString() })
          }
        >
          View project
        </Btn>
      </Box>
    </Card>
  );
};

export default ProjectCard;
