import { useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Stack, Typography, Modal, Box } from "@mui/material";
import {
  vwhomeBody,
  vwhomeCreateModalFrame,
  vwhomeHeading,
} from "./style";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import Alert from "../../../components/Alert";
import { FrameworkTypeEnum } from "../../../components/Forms/ProjectForm/constants";
import ProjectForm from "../../../components/Forms/ProjectForm";
import { AlertState } from "../../../../application/interfaces/appStates";
import PageTour from "../../../components/PageTour";
import HomeSteps from "./HomeSteps";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import HelperDrawer from "../../../components/HelperDrawer";
import HelperIcon from "../../../components/HelperIcon";
import { useDashboard } from "../../../../application/hooks/useDashboard";
import { Project } from "../../../../domain/types/Project";
import ProjectList from "../../../components/ProjectsList/ProjectsList";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import allowedRoles from "../../../../application/constants/permissions";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";


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
  const [alertState, setAlertState] = useState<AlertState>();
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] =
    useState<boolean>(false);
  const [refreshProjectsFlag, setRefreshProjectsFlag] =
    useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const { dashboard, fetchDashboard } = useDashboard();

  useEffect(() => {
    if (dashboard) {
      const allProjects = dashboard.projects_list.filter((p) => !p.is_organizational);
      setProjects(allProjects);
      setFilteredProjects(allProjects);
    }
  }, [dashboard]);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

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

  const handleFilterChange = (filtered: Project[], filters: any) => {
    setFilteredProjects(filtered);
  };


  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Dashboard overview"
        description="Your central hub for AI governance management and compliance tracking"
        whatItDoes="Provides a *comprehensive overview* of your *AI governance program*. View *project status*, *compliance metrics*, *pending tasks*, and *recent activities* all in one **centralized dashboard**."
        whyItMatters="A **unified dashboard** ensures you never miss *critical compliance deadlines* or *governance issues*. It provides *executive visibility* into *AI program health* and helps prioritize resources where they're needed most."
        quickActions={[
          {
            label: "Create New Project",
            description: "Start a new AI governance project or compliance initiative",
            primary: true
          },
          {
            label: "View Metrics",
            description: "Check your compliance status and governance metrics"
          }
        ]}
        useCases={[
          "*Daily monitoring* of *governance activities* and *compliance status*",
          "*Executive reporting* with *real-time metrics* and *progress tracking*"
        ]}
        keyFeatures={[
          "**Real-time project status tracking** with *progress indicators*",
          "*Aggregated compliance metrics* across all *governance areas*",
          "*Quick access* to *pending tasks* and *upcoming deadlines*"
        ]}
        tips={[
          "*Check the dashboard daily* to stay on top of *governance activities*",
          "Use *project filters* to focus on *specific initiatives* or teams",
          "Set up *dashboard alerts* for *critical compliance thresholds*"
        ]}
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
            {/* Use Cases Header */}
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1} sx={vwhomeBody}>
          <Typography sx={vwhomeHeading}>Use cases</Typography>
          <HelperIcon
            onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
            size="small"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use case is a real-world scenario describing how an AI system is applied within an organization to achieve a defined purpose or outcome.
        </Typography>
      </Stack>

      {/* Projects List */}
      <ProjectList
        projects={projects}
        onFilterChange={handleFilterChange}
        newProjectButton={
          <Stack direction="row" spacing={2}>
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
                isDisabled={
                  !allowedRoles.projects.create.includes(userRoleName)
                }
              />
            </div>
            </Stack>
        }
      />

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
