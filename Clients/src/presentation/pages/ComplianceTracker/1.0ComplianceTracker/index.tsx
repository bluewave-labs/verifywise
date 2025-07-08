import { useContext, useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { pageHeadingStyle } from "../../Assessment/1.0AssessmentTracker/index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import CustomizableSkeleton from "../../../vw-v2-components/Skeletons";
import { ControlCategory as ControlCategoryModel } from "../../../../domain/types/ControlCategory";
import ControlCategoryTile from "./ControlCategory";
import PageTour from "../../../components/PageTour";
import ComplianceSteps from "./ComplianceSteps";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { ComplianceData } from "../../../../domain/interfaces/iCompliance";
import { Project } from "../../../../domain/types/Project";

const ComplianceTracker = ({
  project,
  statusFilter,
}: {
  project: Project;
  statusFilter?: string;
}) => {
  const currentProjectId = project?.id;
  const currentProjectFramework = project.framework.filter(
    (p) => p.framework_id === 1
  )[0]?.project_framework_id;
  const [complianceData, setComplianceData] = useState<ComplianceData>();
  const [controlCategories, setControlCategories] =
    useState<ControlCategoryModel[]>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { componentsVisible, changeComponentVisibility } =
    useContext(VerifyWiseContext);
  const [runComplianceTour, setRunComplianceTour] = useState(false);

  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 2,
  });

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("compliance", true);
    }
  }, [allVisible]);

  useEffect(() => {
    if (componentsVisible.compliance && componentsVisible.projectFrameworks) {
      setRunComplianceTour(true);
    }
  }, [componentsVisible]);

  // Reset state when project changes
  useEffect(() => {
    setComplianceData(undefined);
    setControlCategories(undefined);
    setError(null);
    setLoading(true);
  }, [currentProjectId]);

  const fetchComplianceData = async () => {
    if (!currentProjectId || !currentProjectFramework) return;

    try {
      const response = await getEntityById({
        routeUrl: `/eu-ai-act/compliances/progress/${currentProjectFramework}`,
      });
      setComplianceData(response.data);
    } catch (err) {
      console.error("ComplianceTracker: Error fetching compliance data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchControlCategories = async () => {
    if (!currentProjectId) return;

    try {
      const response = await getEntityById({
        routeUrl: `/eu-ai-act/controlCategories`,
      });
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
        <CustomizableSkeleton
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
      <Typography sx={pageHeadingStyle}>Compliance status overview</Typography>
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
                  projectId={currentProjectId}
                  projectFrameworkId={currentProjectFramework}
                  statusFilter={statusFilter}
                />
              </div>
            ) : (
              <ControlCategoryTile
                key={controlCategory.id}
                controlCategory={controlCategory}
                onComplianceUpdate={fetchComplianceData}
                projectId={currentProjectId}
                projectFrameworkId={currentProjectFramework}
                statusFilter={statusFilter}
              />
            )
          )}
    </Stack>
  );
};

export default ComplianceTracker;
