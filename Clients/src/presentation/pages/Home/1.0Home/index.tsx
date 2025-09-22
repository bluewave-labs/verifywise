import { useContext, useEffect, useState } from "react";
import { Stack, Typography, Modal, Box } from "@mui/material";
import {
  vwhomeBody,
  vwhomeBodyControls,
  vwhomeCreateModalFrame,
  vwhomeHeading,
} from "./style";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../../assets/icons/plus-circle-white.svg"
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import CustomizableToast from "../../../components/Toast";
import Alert from "../../../components/Alert";
import { FrameworkTypeEnum } from "../../../components/Forms/ProjectForm/constants";
import ProjectForm from "../../../components/Forms/ProjectForm";
import { AlertState } from "../../../../application/interfaces/appStates";
import PageTour from "../../../components/PageTour";
import HomeSteps from "./HomeSteps";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import allowedRoles from "../../../../application/constants/permissions";
import HelperDrawer from "../../../components/Drawer/HelperDrawer";
import HelperIcon from "../../../components/HelperIcon";
import dashboardHelpContent from "../../../../presentation/helpers/dashboard-help.html?raw";
import HeaderCard from "../../../components/Cards/DashboardHeaderCard";
import { useDashboard } from "../../../../application/hooks/useDashboard";
import { Project } from "../../../../domain/types/Project";
import ProjectList from "../../../components/ProjectsList/ProjectsList";
import { useSubscriptionData } from "../../../../application/hooks/useSubscriptionData";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";


const Home = () => {
  const {
    setDashboardValues,
    componentsVisible,
    changeComponentVisibility,
    refreshUsers,
    userRoleName,
  } = useContext(VerifyWiseContext);
  const [alertState, setAlertState] = useState<AlertState>();
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] =
    useState<boolean>(false);
  const [refreshProjectsFlag, setRefreshProjectsFlag] =
    useState<boolean>(false);
  const [showToastNotification, _] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const { dashboard, fetchDashboard } = useDashboard();

  useEffect(() => {
    if (dashboard) {
      setProjects(dashboard.projects_list.filter((p) => !p.is_organizational));
    }
  }, [dashboard]);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const [runHomeTour, setRunHomeTour] = useState(false);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
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
  //       }, 100);

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
  //       }, 100);
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
  //     }, 100);
  //   } finally {
  //     setShowToastNotification(false);
  //     setRefreshProjectsFlag((prev) => !prev);
  //   }
  // };

  return (
    <Stack className="vwhome">
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={dashboardHelpContent}
        pageTitle="VerifyWise Dashboard"
      />
      {alertState && (
        <Alert
          variant={alertState.variant}
          title={alertState.title}
          body={alertState.body}
          isToast={true}
          onClick={() => setAlertState(undefined)}
        />
      )}
      {showToastNotification && (
        <CustomizableToast title="Generating demo data. Please wait, this process may take some time..." />
      )}
      <Stack className="vwhome-body">
        <Stack sx={vwhomeBody}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={vwhomeHeading}>Projects overview</Typography>
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          </Stack>
          <Stack sx={vwhomeBodyControls}>
            {/* {projects.length === 0 && (
              <CustomizableButton
                variant="contained"
                text="Create demo project"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<CloudDownloadIcon />}
                onClick={() => handleGenerateDemoDataClick()}
                isDisabled={
                  !allowedRoles.projects.create.includes(userRoleName)
                }
              />
            )} */}
            <div data-joyride-id="new-project-button" ref={refs[0]}>
              <CustomizableButton
                variant="contained"
                text="New project"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<AddCircleOutlineIcon />}
                onClick={() => setIsProjectFormModalOpen(true)}
                isDisabled={isDisabledLogic()}
              />
            </div>
          </Stack>
        </Stack>
        <Stack sx={vwhomeBody}>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              mt: "16px",
              mb: "16px",
            }}
          >
            <HeaderCard title="Projects" count={dashboard?.projects || 0} />
            <HeaderCard title="Trainings" count={dashboard?.trainings || 0} />
            <HeaderCard title="Models" count={dashboard?.models || 0} />
            <HeaderCard title="Reports" count={dashboard?.reports || 0} />
          </Box>
        </Stack>

        {/* TODO: Add TaskRadar visualization when backend data is ready */}

        <ProjectList projects={projects} />
      </Stack>

      <Modal
        open={isProjectFormModalOpen}
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            handleProjectFormModalClose();
          }
        }}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={vwhomeCreateModalFrame}>
          <ProjectForm
            defaultFrameworkType={FrameworkTypeEnum.ProjectBased}
            onClose={handleProjectFormModalClose}
          />
        </Box>
      </Modal>
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
