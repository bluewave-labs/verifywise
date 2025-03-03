import { useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { Project } from "../../../../../domain/Project";
import { useSearchParams } from "react-router-dom";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";
import RisksCard from "../../../../components/Cards/RisksCard";
import { rowStyle } from "./style";
import VWButton from "../../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import VWProjectRisksTable from "../../../../vw-v2-components/Table";

const TITLE_OF_COLUMNS = [
  "RISK NAME",
  "IMPACT",
  "OWNER",
  "SEVERITY",
  "LIKELIHOOD",
  "RISK LEVEL",
  "MITIGATION",
  "FINAL RISK LEVEL",
  "",
];

const VWProjectRisks = ({ project }: { project?: Project }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || project?.id;
  const { projectRisksSummary } = useProjectRisks({
    projectId: projectId?.toString(),
  });
  const [projectRisks, setProjectRisks] = useState([]);

  useEffect(() => {
    const fetchProjectRisks = async () => {
      try {
        const response = await getEntityById({
          routeUrl: `/projectRisks/by-projid/${projectId}`,
        });
        setProjectRisks(response.data);
      } catch (error) {
        console.error("Error fetching project risks:", error);
      }
    };

    if (projectId) {
      fetchProjectRisks();
    }
  }, [projectId]);

  return (
    <Stack className="vw-project-risks">
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <RisksCard projectRisksSummary={projectRisksSummary} />
      </Stack>
      <br />
      <Stack
        className="vw-project-risks-row"
        sx={{
          gap: 10,
          mb: 10,
        }}
      >
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
        <VWProjectRisksTable columns={TITLE_OF_COLUMNS} rows={projectRisks} />
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
