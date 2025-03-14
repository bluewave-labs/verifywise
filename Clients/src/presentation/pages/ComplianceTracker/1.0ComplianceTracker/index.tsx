import { useEffect, useState, useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { ControlCategory as ControlCategoryModel } from "../../../../domain/ControlCategory";
import ControlCategoryTile from "./ControlCategory";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

const ComplianceTracker = () => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId } = dashboardValues;
  const [complianceData, setComplianceData] = useState<any>(null);
  const [controlCategories, setControlCategories] =
    useState<ControlCategoryModel[]>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComplianceData = async () => {
    console.log("fetchComplianceData selectedProjectId: ", selectedProjectId);
    if (!selectedProjectId) return;

    try {
      const response = await getEntityById({
        routeUrl: `projects/compliance/progress/${selectedProjectId}`,
      });
      setComplianceData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchControlCategories = async () => {
    console.log(
      "fetchControlCategories selectedProjectId: ",
      selectedProjectId
    );
    if (!selectedProjectId) return;

    try {
      const response = await getEntityById({
        routeUrl: `/controlCategory/byprojectid/${selectedProjectId}`,
      });
      setControlCategories(response);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchComplianceData();
    fetchControlCategories();
  }, [selectedProjectId]);

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
      <Stack>
        {controlCategories &&
          controlCategories.map((controlCategory: ControlCategoryModel) => (
            <ControlCategoryTile
              key={controlCategory.id}
              controlCategory={controlCategory}
              onComplianceUpdate={fetchComplianceData}
            />
          ))}
      </Stack>
    </Stack>
  );
};

export default ComplianceTracker;
