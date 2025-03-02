import { Stack, Typography } from "@mui/material";
import { Project } from "../../../../../domain/Project";
import { useSearchParams } from "react-router-dom";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";
import RisksCard from "../../../../components/Cards/RisksCard";
import { rowStyle } from "./style";
import VWButton from "../../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const VWProjectRisks = ({ project }: { project?: Project }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || project?.id;
  const { projectRisksSummary } = useProjectRisks({
    projectId: projectId?.toString(),
  });

  return (
    <Stack className="vw-project-risks">
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <RisksCard projectRisksSummary={projectRisksSummary} />
      </Stack>
      <br />
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <Stack
          sx={{
            width: "100%",
            maxWidth: 1400,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>
            Project risks
          </Typography>

          <VWButton
            variant="contained"
            text="Add new risk"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            icon={<AddCircleOutlineIcon />}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
