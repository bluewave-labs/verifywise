import { useEffect, useState, useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { ControlCategory as ControlCategoryModel } from "../../../../domain/ControlCategory";
import ControlCategoryTile from "./ControlCategory";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import PageTour from "../../../components/PageTour";
import CustomStep from "../../../components/PageTour/CustomStep";

const ComplianceTracker = () => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId } = dashboardValues;
  const [complianceData, setComplianceData] = useState<any>(null);
  const [controlCategories, setControlCategories] =
    useState<ControlCategoryModel[]>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runComplianceTour, setRunComplianceTour] = useState(false);

  const complianceSteps = [
    {
      target: '[data-joyride-id="compliance-heading"]',
      content: (
        <CustomStep
          body="Here you'll see a list of controls related to the regulation you selected."
        />
      ),
    },
    {
      target: '[data-joyride-id="compliance-progress-bar"]',
      content: (
        <CustomStep
          body="Check the status of your compliance tracker here."
        />
      ),
    },
    {
      target: '[data-joyride-id="control-groups"]',
      content: (
        <CustomStep
          body="Those are the groups where controls and subcontrols reside. As you fill them, your statistics improve."
        />
      ),
    },
  ]

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

  useEffect(()=>{
    setRunComplianceTour(true);
  },[])

  if (loading) {
    return (
      <Stack className="compliance-tracker" sx={{ gap: "16px" }}>
        <Typography sx={pageHeadingStyle}>
        Compliance tracker</Typography>
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
      {/* joyride tour, dont remove!!! */}
      <PageTour
        steps={complianceSteps}
        run={runComplianceTour}
        onFinish={() => {
          localStorage.setItem("compliance-tour", "true");
          setRunComplianceTour(false)}}
        tourKey="compliance-tour"
      />
      <Typography sx={pageHeadingStyle}
      data-joyride-id="compliance-heading">
      Compliance tracker</Typography>
      {complianceData && (
        <Stack
          data-joyride-id="compliance-progress-bar">
        <StatsCard
          completed={complianceData.allDonesubControls}
          total={complianceData.allsubControls}
          title="Subcontrols"
          progressbarColor="#13715B"
        />
        </Stack>
      )}
      <Stack data-joyride-id="control-groups">
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
