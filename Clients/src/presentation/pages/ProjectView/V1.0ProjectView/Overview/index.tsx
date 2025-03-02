import { Divider, Stack, Typography } from "@mui/material";
import { rowStyle } from "./style";
import StatsCard from "../../../../components/Cards/StatsCard";
import { projectRiskSection } from "../style";
import RisksCard from "../../../../components/Cards/RisksCard";
import InfoCard from "../../../../components/Cards/InfoCard";
import DescriptionCard from "../../../../components/Cards/DescriptionCard";
import TeamCard from "../../../../components/Cards/TeamCard";
import { Project } from "../../../../../domain/Project";
import useProjectData from "../../../../../application/hooks/useProjectData";
import { useSearchParams } from "react-router-dom";
import VWSkeleton from "../../../../vw-v2-components/Skeletons";
import { formatDate } from "../../../../tools/isoDateToString";
import { useContext } from "react";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../../domain/User";

const VWProjectOverview = ({ project }: { project?: Project }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "0";
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;

  const user: User = project
    ? users.find((user: User) => user.id === project.last_updated_by) ??
      ({} as User)
    : ({} as User);

  const { projectOwner } = useProjectData({
    projectId: project?.id.toString() || projectId,
  });

  const projectMembers: string[] = project
    ? users
        .filter((user: User) => project.members.includes(user.id.toString()))
        .map((user: User) => `${user.name} ${user.surname}`)
    : [];

  return (
    <Stack className="vw-project-overview">
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <InfoCard title="Owner" body={projectOwner || "N/A"} />
            <InfoCard
              title="Last updated"
              body={formatDate(project.last_updated.toString())}
            />
            <InfoCard
              title="Last updated by"
              body={`${user.name} ${user.surname}`}
            />
          </>
        ) : (
          <>
            <VWSkeleton variant="text" width="30%" height={32} />
            <VWSkeleton variant="text" width="30%" height={32} />
            <VWSkeleton variant="text" width="30%" height={32} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <DescriptionCard title="Goal" body={project.goal} />
            <TeamCard title="Team members" members={projectMembers} />
          </>
        ) : (
          <>
            <VWSkeleton variant="rectangular" width="60%" height={100} />
            <VWSkeleton variant="rectangular" width="60%" height={100} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <StatsCard
              completed={30}
              total={100}
              title="Subcontrols"
              progressbarColor="#13715B"
            />
            <StatsCard
              completed={70}
              total={100}
              title="assessments"
              progressbarColor="#13715B"
            />
          </>
        ) : (
          <>
            <VWSkeleton variant="rectangular" width="45%" height={100} />
            <VWSkeleton variant="rectangular" width="45%" height={100} />
          </>
        )}
      </Stack>
      <Divider />
      <Stack sx={{ gap: 10 }}>
        {project ? (
          <>
            <Typography sx={projectRiskSection}>Project risks</Typography>
            <RisksCard />
          </>
        ) : (
          <>
            <VWSkeleton variant="text" width="20%" height={32} />
            <VWSkeleton variant="rectangular" width="100%" height={200} />
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default VWProjectOverview;
