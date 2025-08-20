/**
 * This file is currently in use
 */

import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useCallback,
  useMemo,
  FC,
  useContext,
} from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { styles } from "./styles";
import {
  getAllEntities,
  postAutoDrivers,
} from "../../../application/repository/entity.repository";
import { ProjectCardProps } from "../../components/ProjectCard";
import {
  Assessments,
  Controls,
} from "../../../application/hooks/useProjectStatus";
import CustomizableSkeleton from "../../vw-v2-components/Skeletons";
import { Card } from "../../components/ProjectCard/styles";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import CreateDemoData from "../../components/CreateDemoData";
import CustomizableButton from "../../vw-v2-components/Buttons";
import NoProject from "../../components/NoProject/NoProject";
import { AlertProps } from "../../../domain/interfaces/iAlert";
import { handleAlert } from "../../../application/tools/alertUtils";

// Lazy load components
const ProjectCard = lazy(() => import("../../components/ProjectCard"));
const Popup = lazy(() => import("../../components/Popup"));
const CreateProjectForm = lazy(
  () => import("../../components/CreateProjectForm")
);
const MetricSection = lazy(() => import("../../components/MetricSection"));
const Alert = lazy(() => import("../../components/Alert"));

// Custom hook for fetching projects
const useProjects = (
  isNewProject: boolean,
  newProjectData: object,
  resetIsNewProject: () => void
) => {
  const [projects, setProjects] = useState<ProjectCardProps[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = ({ controller }: { controller: AbortController }) => {
    if (controller) {
      setIsLoading(true);
      getAllEntities({ routeUrl: "/projects" })
        .then(({ data }) => {
          setProjects(data);
          setError(null);
          resetIsNewProject();
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setError("Failed to fetch projects: " + err.message);
            setProjects(null);
            resetIsNewProject();
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
            resetIsNewProject();
          }
        });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects({ controller });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isNewProject && newProjectData) {
      setProjects((prevProjects) => [
        ...(prevProjects || []),
        ...(Array.isArray(newProjectData) ? newProjectData : [newProjectData]),
      ]);
    }
  }, [isNewProject, newProjectData]);

  const refetchProjects = () => {
    const controller = new AbortController();
    fetchProjects({ controller });
    return () => controller.abort();
  };

  return { projects, error, isLoading, refetchProjects };
};

interface HomeProps {
  onProjectUpdate: () => void;
}

const Home: FC<HomeProps> = ({ onProjectUpdate }) => {
  const theme = useTheme();
  const [isNewProject, setIsNewProjectCreate] = useState(false);
  const [newProjectData, setNewProjectData] = useState({});
  const { projects, error, isLoading, refetchProjects } = useProjects(
    isNewProject,
    newProjectData,
    () => setIsNewProjectCreate(false)
  );
  const { projectStatus, loadingProjectStatus, errorFetchingProjectStatus } =
    useContext(VerifyWiseContext);

  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [openDemoDataModal, setOpenDemoDataModal] = useState(false);
  const handleOpenOrCloseDemoDataModal = useCallback(() => {
    setOpenDemoDataModal((prev) => !prev);
  }, []);

  const [isCreatingDemoData, setIsCreatingDemoData] = useState(false);

  const createDemoData = useCallback(async () => {
    setIsCreatingDemoData(true);
    try {
      const response = await postAutoDrivers();
      if (response.status === 201) {
        handleAlert({
          variant: "success",
          body: "Demo Data created successfully",
          setAlert,
        });
        setOpenDemoDataModal(false);
      }
    } catch (error) {
      console.error(error);
      handleAlert({
        variant: "error",
        body: "Failed to create Demo Data",
        setAlert,
      });
    } finally {
      setIsCreatingDemoData(false);
      setTimeout(() => {
        refetchProjects();
      }, 500);
    }
  }, []);

  // Later in the component's render/return block:
  <CustomizableButton
    text="Create Demo Data"
    isDisabled={isCreatingDemoData}
    onClick={handleOpenOrCloseDemoDataModal}
  />;

  const newProjectChecker = useCallback(
    (data: { isNewProject: boolean; project: any }) => {
      setIsNewProjectCreate(data.isNewProject);
      setNewProjectData(data.project);

      if (onProjectUpdate) {
        onProjectUpdate();
        handleAlert({
          variant: "success",
          body: "Project created successfully",
          setAlert,
        });
      }
    },
    [onProjectUpdate]
  );

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const handleOpenOrClose = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchor(anchor ? null : event.currentTarget);
    },
    [anchor]
  );

  const NoProjectsMessage = useMemo(() => {
    return (
      <>
        <Stack
          spacing={8}
          direction="row"
          justifyContent="flex-end"
          sx={{
            paddingBottom: theme.spacing(10),
          }}
        >
          <CustomizableButton
            text="Create Demo Data"
            onClick={handleOpenOrCloseDemoDataModal}
          />
          <Suspense fallback={<div>Loading...</div>}>
            <Popup
              popupId="create-project-popup"
              popupContent={
                <CreateProjectForm
                  onNewProject={newProjectChecker}
                  closePopup={() => setAnchor(null)}
                />
              }
              openPopupButtonName="New Project"
              popupTitle="Create new project"
              popupSubtitle="Create a new project from scratch by filling in the following."
              handleOpenOrClose={handleOpenOrClose}
              anchor={anchor}
              key={anchor ? "open" : "closed"}
            />
          </Suspense>
        </Stack>
        <NoProject
          message='You have no projects, yet. Click on the "New Project" button to
            start one.'
        />

        {openDemoDataModal && (
          <CreateDemoData
            handleCancelDemoData={handleOpenOrCloseDemoDataModal}
            handleCreateDemoData={createDemoData}
          />
        )}
      </>
    );
  }, [
    theme,
    newProjectChecker,
    anchor,
    handleOpenOrClose,
    openDemoDataModal,
    createDemoData,
    handleOpenOrCloseDemoDataModal,
  ]);

  const PopupRender = useCallback(() => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Popup
          popupId="create-project-popup"
          popupContent={
            <CreateProjectForm
              onNewProject={newProjectChecker}
              closePopup={() => setAnchor(null)}
            />
          }
          openPopupButtonName="New project"
          popupTitle="Create new project"
          popupSubtitle="Create a new project from scratch by filling in the following."
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
        />
      </Suspense>
    );
  }, [newProjectChecker, handleOpenOrClose, anchor]);

  if (loadingProjectStatus)
    return (
      <CustomizableSkeleton
        variant="rectangular"
        minWidth="200"
        width={"100%"}
        height={"100%"}
        maxWidth="1400"
        minHeight="200"
        maxHeight="100vh"
      />
    );
  if (errorFetchingProjectStatus)
    return (
      <CustomizableSkeleton
        variant="rectangular"
        minWidth="200"
        width={"100%"}
        height={"100%"}
        maxWidth="1400"
        minHeight="200"
        maxHeight="100vh"
      />
    );

  const assessments: Assessments = {
    percentageComplete: projectStatus.assessments.allTotalAssessments
      ? ((projectStatus.assessments.allDoneAssessments ?? 0) * 100) /
        projectStatus.assessments.allTotalAssessments
      : 0,
    allDoneAssessments: projectStatus.assessments.allDoneAssessments,
    allTotalAssessments: projectStatus.assessments.allTotalAssessments,
    // projects: projectStatus.assessments.projects,
  };

  const controls: Controls = {
    percentageComplete: projectStatus.controls.allTotalSubControls
      ? ((projectStatus.controls.allDoneSubControls ?? 0) * 100) /
        projectStatus.controls.allTotalSubControls
      : 0,
    allDoneSubControls: projectStatus.controls.allDoneSubControls,
    allTotalSubControls: projectStatus.controls.allTotalSubControls,
    // projects: projectStatus.controls.projects,
  };

  return (
    <Box>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box sx={{ paddingTop: theme.spacing(2) }}>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
        </Suspense>
      )}

      {projects && projects.length > 0 ? (
        <>
          {(["compliance"] as const).map(
            (
              metricType // "risk" was removed from the array, if we wanna the 'All projects risk status' Section back, we need to add it back to the array
            ) => (
              <Suspense
                key={metricType}
                fallback={
                  <CustomizableSkeleton
                    variant="rectangular"
                    minWidth="200"
                    width={"100%"}
                    height={"100%"}
                    maxWidth="1400"
                    minHeight="200"
                    maxHeight="100vh"
                  />
                }
              >
                <MetricSection
                  title={`All projects ${metricType} status`}
                  metricType={metricType}
                  assessments={assessments}
                  controls={controls}
                />
              </Suspense>
            )
          )}
          <Box sx={styles.projectBox}>
            <Typography variant="h1" component="div" sx={styles.title}>
              Projects overview
            </Typography>
            <PopupRender />
          </Box>
          {isLoading ? (
            <Typography component="div" sx={{ mb: 12 }}>
              Projects are loading...
            </Typography>
          ) : error ? (
            <Typography component="div" sx={{ mb: 12 }}>
              {error}
            </Typography>
          ) : null}
          <Stack
            direction="row"
            justifyContent={
              projects.length <= 3 ? "space-between" : "flex-start"
            }
            flexWrap={projects.length > 3 ? "wrap" : "nowrap"}
            spacing={15}
          >
            <Suspense
              fallback={
                <Card>
                  <CustomizableSkeleton
                    variant="rectangular"
                    minWidth="200"
                    width={"100%"}
                    height={"100%"}
                    maxWidth="1400"
                    minHeight="200"
                    maxHeight="100vh"
                  />
                </Card>
              }
            >
              {projects.length <= 3 ? (
                <>
                  {projects.map((item: ProjectCardProps) => (
                    <Box
                      key={item.id}
                      sx={{ width: projects.length === 1 ? "50%" : "100%" }}
                    >
                      <ProjectCard
                        key={item.id}
                        {...item}
                        id={item.id}
                        assessments={assessments}
                        controls={controls}
                        last_updated={item.last_updated}
                      />
                    </Box>
                  ))}
                </>
              ) : (
                <>
                  <Grid
                    sx={{ width: "100%" }}
                    container
                    spacing={{ xs: 2, md: 3 }}
                    columns={{ xs: 4, sm: 8, md: 12 }}
                  >
                    {projects.map((item: ProjectCardProps) => (
                      <Grid key={item.id} size={{ xs: 4, sm: 8, md: 4 }}>
                        <ProjectCard
                          {...item}
                          id={item.id}
                          assessments={assessments}
                          controls={controls}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Suspense>
          </Stack>
        </>
      ) : (
        NoProjectsMessage
      )}
    </Box>
  );
};

export default Home;
