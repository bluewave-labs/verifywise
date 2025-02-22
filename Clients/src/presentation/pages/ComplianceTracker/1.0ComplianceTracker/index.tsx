import { useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

const ComplianceTracker = () => {
  const [complianceData, setComplianceData] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const storedProjectId = localStorage.getItem("selectedProjectId");
    setProjectId(storedProjectId);
  }, []);

  useEffect(() => {
    const fetchComplianceData = async () => {
      if (!projectId) return;

      try {
        const response = await getEntityById({
          routeUrl: `projects/compliance/progress/${projectId}`,
        });
        setComplianceData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, [projectId]);

  if (loading) {
    return (
      <Stack className="compliance-tracker" sx={{ gap: "16px" }}>
        <Typography sx={pageHeadingStyle}>Compliance tracker</Typography>
        <VWSkeleton
          variant="rectangular"
          minWidth={300}
          width="100%"
          maxHeight={"1400px"}
          minHeight={82}
        />
      </Stack>
    );
  }

  if (error) {
    return <Typography>Error loading compliance data</Typography>;
  }

  return (
    <Stack className="compliance-tracker" sx={{ gap: "16px" }}>
      <Typography sx={pageHeadingStyle}>Compliance tracker</Typography>
      {complianceData && (
        <StatsCard
          completed={complianceData.allDonesubControls}
          total={complianceData.allsubControls}
          title="Subcontrols"
          progressbarColor="#13715B"
        />
      )}
    </Stack>
  );
};

export default ComplianceTracker;
