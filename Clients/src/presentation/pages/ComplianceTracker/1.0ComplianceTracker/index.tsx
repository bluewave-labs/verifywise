import { useEffect, useState, useContext, useRef } from "react";
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
  const { currentProjectId } = useContext(VerifyWiseContext);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [controlCategories, setControlCategories] =
    useState<ControlCategoryModel[]>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runComplianceTour, setRunComplianceTour] = useState(false);

  const titleRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  const complianceSteps =[
    {
      target: '[data-tour="compliance-heading"]',
      content:(
        <CustomStep
        body="Here youll see a list of controls related to the regulation you selected."
        />
      )
    },
    {
      target:'[data-tour="compliance-progress-bar"]',
      content:(
        <CustomStep 
        body="Check th status of your compliance tracker here."
        />)
    },
    {
      target:'[data-tour="control-groups"]',
      content:(
        <CustomStep
        body="Those are the groups where controls and subcontrols reside. As you fill them, your statistics improve."
        />
      )
    }
  ]
useEffect(()=>{
  const shouldRun = localStorage.getItem("compliance-tour") !== "true";
if (!shouldRun) return;
  if (titleRef.current && progressRef.current && controlsRef.current) {
    setRunComplianceTour(true);
  }
},[titleRef.current, progressRef.current, controlsRef.current]);


  // Reset state when project changes
  useEffect(() => {
    console.log("ComplianceTracker: Project changed to:", currentProjectId);
    setComplianceData(null);
    setControlCategories(undefined);
    setError(null);
    setLoading(true);
  }, [currentProjectId]);

  const fetchComplianceData = async () => {
    console.log(
      "ComplianceTracker: Fetching compliance data for project:",
      currentProjectId
    );
    if (!currentProjectId) return;

    try {
      const response = await getEntityById({
        routeUrl: `projects/compliance/progress/${currentProjectId}`,
      });
      console.log(
        "ComplianceTracker: Received compliance data:",
        response.data
      );
      setComplianceData(response.data);
    } catch (err) {
      console.error("ComplianceTracker: Error fetching compliance data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchControlCategories = async () => {
    console.log(
      "ComplianceTracker: Fetching control categories for project:",
      currentProjectId
    );
    if (!currentProjectId) return;

    try {
      const response = await getEntityById({
        routeUrl: `/controlCategory/byprojectid/${currentProjectId}`,
      });
      console.log("ComplianceTracker: Received control categories:", response);
      setControlCategories(response);
    } catch (err) {
      console.error(
        "ComplianceTracker: Error fetching control categories:",
        err
      );
      setError(err);
    }
  };

  useEffect(() => {
    if (currentProjectId) {
      fetchComplianceData();
      fetchControlCategories();
    }
  }, [currentProjectId]);

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

  if (!currentProjectId) {
    return (
      <Stack className="compliance-tracker" sx={{ gap: "16px" }}>
        <Typography sx={pageHeadingStyle}>Compliance tracker</Typography>
        <Typography>Please select a project to view compliance data</Typography>
      </Stack>
    );
  }

  return (
    <Stack className="compliance-tracker" sx={{ gap: "16px" }}>
      <PageTour
        run={runComplianceTour}
        steps={complianceSteps}
        onFinish={()=>{
          localStorage.setItem("compliance-tour", "true");
          setRunComplianceTour(false);
        }} 
        tourKey="compliance-tour"
        />
      <Typography ref={titleRef} data-joyride-id="compliance-heading" sx={pageHeadingStyle}>Compliance tracker</Typography>
      {complianceData && (
        <Stack ref={progressRef} data-joyride-id="compliance-progress-bar" sx={{ display:"inline-block" }}>
        <StatsCard
          completed={complianceData.allDonesubControls}
          total={complianceData.allsubControls}
          title="Subcontrols"
          progressbarColor="#13715B"
        />
        </Stack>
      )}
      <Stack
        ref={controlsRef}
        data-joyride-id="control-groups">
        {controlCategories &&
          controlCategories
            .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0))
            .map((controlCategory: ControlCategoryModel) => (
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
