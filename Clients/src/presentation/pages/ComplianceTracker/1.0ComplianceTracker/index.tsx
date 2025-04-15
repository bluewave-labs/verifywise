import { useEffect, useState, useContext} from "react";
import { Stack, Typography } from "@mui/material";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { ControlCategory as ControlCategoryModel } from "../../../../domain/ControlCategory";
import ControlCategoryTile from "./ControlCategory";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import PageTour from "../../../components/PageTour";
import ComplianceSteps from "./ComplianceSteps";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";

const ComplianceTracker = () => {
  const { currentProjectId } = useContext(VerifyWiseContext);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [controlCategories, setControlCategories] =
    useState<ControlCategoryModel[]>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runComplianceTour, setRunComplianceTour] = useState(false);

  const {refs, allVisible} = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 3,
  });

  useEffect(()=>{
    if (allVisible) {
      setRunComplianceTour(true);
    }
  }, [allVisible]);
 

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
      console.log(
        "ComplianceTracker: allDonesubControls type:",
        typeof response.data.allDonesubControls
      );
      console.log(
        "ComplianceTracker: allsubControls type:",
        typeof response.data.allsubControls
      );
      console.log(
        "ComplianceTracker: allDonesubControls value:",
        response.data.allDonesubControls
      );
      console.log(
        "ComplianceTracker: allsubControls value:",
        response.data.allsubControls
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
        steps={ComplianceSteps}
        onFinish={() => {
          localStorage.setItem("compliance-tour", "true");
          setRunComplianceTour(false);
        }}
        tourKey="compliance-tour"
      />
      <Stack
        ref={refs[0]}
        data-joyride-id="compliance-heading"
        sx={{ position: "relative" }}
      >
        <Typography sx={pageHeadingStyle}>Compliance tracker</Typography>
      </Stack>
      {complianceData && (
        <Stack ref={refs[1]} data-joyride-id="compliance-progress-bar">
          <StatsCard
            completed={complianceData.allDonesubControls}
            total={complianceData.allsubControls}
            title="Subcontrols"
            progressbarColor="#13715B"
          />
        </Stack>
      )}
      {controlCategories &&
        controlCategories
          .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0))
          .map((controlCategory: ControlCategoryModel, index) =>
            index === 0 ? (
              <div
                ref={refs[2]}
                data-joyride-id="control-groups"
                key={controlCategory.id}
              >
                <ControlCategoryTile
                  controlCategory={controlCategory}
                  onComplianceUpdate={fetchComplianceData}
                />
              </div>
            ) : (
              <ControlCategoryTile
                key={controlCategory.id}
                controlCategory={controlCategory}
                onComplianceUpdate={fetchComplianceData}
              />
            )
          )}
    </Stack>
  );
};

export default ComplianceTracker;
