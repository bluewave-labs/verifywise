import { useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Stack, Typography } from "@mui/material";
import { vwhomeBody, vwhomeHeading } from "./style";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { FrameworkTypeEnum } from "../../../components/Forms/ProjectForm/constants";
import ProjectForm from "../../../components/Forms/ProjectForm";
import PageTour from "../../../components/PageTour";
import HomeSteps from "./HomeSteps";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import HelperIcon from "../../../components/HelperIcon";
import { useDashboard } from "../../../../application/hooks/useDashboard";
import { Project } from "../../../../domain/types/Project";
import ProjectList from "../../../components/ProjectsList/ProjectsList";
import { useSubscriptionData } from "../../../../application/hooks/useSubscriptionData";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import allowedRoles from "../../../../application/constants/permissions";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import StandardModal from "../../../components/Modals/StandardModal";
import TipBox from "../../../components/TipBox";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    setDashboardValues,
    componentsVisible,
    changeComponentVisibility,
    refreshUsers,
    userRoleName,
  } = useContext(VerifyWiseContext);
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] =
    useState<boolean>(false);
  const [refreshProjectsFlag, setRefreshProjectsFlag] =
    useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const { dashboard, fetchDashboard } = useDashboard();

  useEffect(() => {
    if (dashboard) {
      setProjects(dashboard.projects_list.filter((p) => !p.is_organizational));
    }
  }, [dashboard]);

  const [runHomeTour, setRunHomeTour] = useState(false);
  const newProjectButtonRef = useRef<HTMLDivElement>(null);
  const { allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });
  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("home", true);
    }
  }, [allVisible]);

  useEffect(() => {
    if (componentsVisible.home && componentsVisible.sidebar) {
      setRunHomeTour(true);
    }
  }, [componentsVisible]);

  useEffect(() => {
    const fetchProgressData = async () => {
      await refreshUsers();

      await fetchDashboard();
    };

    fetchProgressData();
  }, [setDashboardValues, fetchDashboard, refreshProjectsFlag]);

  const submitFormRef = useRef<(() => void) | undefined>();

  // Auto-open create modal when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsProjectFormModalOpen(true);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleProjectFormModalClose = () => {
    setIsProjectFormModalOpen(false);
    setRefreshProjectsFlag((prev) => !prev);
  };

  const { tierFeatures } = useSubscriptionData();

  const isDisabledLogic = () => {    
    if (dashboard?.projects && tierFeatures?.projects) {
      // If tierFeatures.projects is 0, it means unlimited projects
      if (tierFeatures.projects === 0) {
        return !allowedRoles.projects.create.includes(userRoleName);
      }
      // Otherwise, check if current projects count has reached the limit
      return dashboard.projects >= tierFeatures.projects || !allowedRoles.projects.create.includes(userRoleName);
    }
    return !allowedRoles.projects.create.includes(userRoleName);
  }

  // const handleGenerateDemoDataClick = async () => {
  //   setShowToastNotification(true);
  //   try {
  //     const response = await postAutoDrivers();
  //     if (response.status === 201) {
  //       logEngine({
  //         type: "info",
  //         message: "Demo data generated successfully.",
  //       });
  //       setAlertState({
  //         variant: "success",
  //         body: "Demo data generated successfully.",
  //       });
  //       setTimeout(() => {
  //         setAlertState(undefined);
  //       }, 3000);

  //       await fetchDashboard();
  //       setShowToastNotification(false);
  //       window.location.reload();
  //     } else {
  //       logEngine({
  //         type: "error",
  //         message: "Failed to generate demo data.",
  //       });
  //       setAlertState({
  //         variant: "error",
  //         body: "Failed to generate demo data.",
  //       });
  //       setTimeout(() => {
  //         setAlertState(undefined);
  //       }, 3000);
  //     }
  //     setShowToastNotification(false);
  //   } catch (error) {
  //     const errorMessage = (error as Error).message;
  //     logEngine({
  //       type: "error",
  //       message: `An error occurred: ${errorMessage}`,
  //     });
  //     setAlertState({
  //       variant: "error",
  //       body: `An error occurred: ${errorMessage}`,
  //     });
  //     setTimeout(() => {
  //       setAlertState(undefined);
  //     }, 3000);
  //   } finally {
  //     setShowToastNotification(false);
  //     setRefreshProjectsFlag((prev) => !prev);
  //   }
  // };

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
      {/* Use Cases Header */}
      <Stack spacing={2}>
        <Stack sx={vwhomeBody}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={vwhomeHeading}>Use cases</Typography>
            <HelperIcon
              articlePath="reporting/dashboard-analytics"
              size="small"
            />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use case is a real-world scenario describing how an AI system is
          applied within an organization to achieve a defined purpose or
          outcome.
        </Typography>
        <TipBox entityName="overview" />
      </Stack>

      {/* Projects List */}
      <ProjectList
        projects={projects}
        newProjectButton={
          <div data-joyride-id="new-project-button" ref={newProjectButtonRef}>
            <CustomizableButton
              variant="contained"
              text="New use case"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              icon={<AddCircleOutlineIcon size={16} />}
              onClick={() => setIsProjectFormModalOpen(true)}
              isDisabled={isDisabledLogic()}
            />
          </div>
        }
      />
      <StandardModal
        isOpen={isProjectFormModalOpen}
        onClose={async () => {
          setIsProjectFormModalOpen(false);
          setRefreshProjectsFlag((prev) => !prev);
        }}
        title="Create new use case"
        description="Create a new use case by filling in the following details"
        onSubmit={() => {
          if (submitFormRef.current) {
            submitFormRef.current();
          }
        }}
        submitButtonText="Create use case"
        maxWidth="900px"
      >
        <ProjectForm
          defaultFrameworkType={FrameworkTypeEnum.ProjectBased}
          useStandardModal={true}
          onSubmitRef={submitFormRef}
          onClose={handleProjectFormModalClose}
        />
      </StandardModal>
      <PageTour
        steps={HomeSteps}
        run={runHomeTour}
        onFinish={() => {
          setRunHomeTour(false);
        }}
        tourKey="home-tour"
      />
    </Stack>
  );
};

export default Home;
