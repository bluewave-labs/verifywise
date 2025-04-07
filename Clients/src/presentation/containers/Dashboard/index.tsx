import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet, useLocation } from "react-router";
import { useContext, useEffect, useState, FC, useRef} from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getEntityById,
  getAllEntities,
} from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";

interface DashboardProps {
  reloadTrigger: boolean;
}

const Dashboard: FC<DashboardProps> = ({ reloadTrigger }) => {
  const { token, setDashboardValues, projects, setProjects } =
    useContext(VerifyWiseContext);
  const location = useLocation();

  const [runHomeTour, setRunHomeTour] = useState(false);
const newProjectRef = useRef<HTMLDivElement | null>(null);
  const selectProjectRef = useRef<HTMLDivElement | null>(null);
  const dashboardNavRef = useRef<HTMLDivElement | null>(null);
  //joyride steps
  const homeSteps = [
    // Sidebar steps
    {
      target: '[data-joyride-id="new-project-button"]',
      content: (
        <CustomStep
          header="Create your first project"
          body="Each project corresponds to an AI activity in your company."
        />
      ),
    },
    {
      target: '[data-joyride-id="select-project"]',
      content: (
        <CustomStep
          header="Select a project"
          body="Once created, you can select it here."
        />
      ),
    },
    {
      target: '[data-joyride-id="dashboard-navigation"]',
      content: (
        <CustomStep
          header="Fill in compliance,assessments, risks and vendors"
          body="Each project has its own set of questions and documents where you can fill in here."
        />
      ),
    },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getEntityById({ routeUrl: "/projects" });
        if (!response?.data) return;
        setProjects(response.data);
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          projects: response.data,
          selectedProjectId: response.data[0]?.id || "", // Set the first project ID as the default selected one
        }));
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await getAllEntities({ routeUrl: "/users" });
        if (!response?.data) return;
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          users: response.data,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchProjects();
    fetchUsers();
  }, [setDashboardValues, reloadTrigger]);

/**  
 * Waits for Joyride targets to be available in the DOM before starting the tour.
 * Checks up to 10 times every 500ms.
 * If all targets are found, it sets the runHomeTour state to true.
 */
  useEffect(() => {
    const shouldRun = localStorage.getItem("home-tour") !== "true";

    if (!shouldRun) return;

    let attempts = 0;
    const interval = setInterval(() => {
      const newProject = document.querySelector(
        '[data-joyride-id="new-project-button"]'
      );
      const selectProject = document.querySelector(
        '[data-joyride-id="select-project"]'
      );
      const dashboardNav = document.querySelector(
        '[data-joyride-id="dashboard-navigation"]'
      );

      //debug logs
      console.log("New Project Button:", newProject);
      console.log("Select Project:", selectProject);
      console.log("Dashboard Navigation:", dashboardNav);
      console.log("Attempt:", attempts);

      if (newProject && selectProject && dashboardNav) {
        console.log("All Joyride targets found. Starting tour.");
        setRunHomeTour(true);
        clearInterval(interval);
      }

      if (++attempts > 10) {
        console.log("Joyride target check timed out.");
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const mappedProjects =
    projects?.map((project: any) => ({
      _id: project.id,
      name: project.project_title,
    })) || [];

  console.log("This is the token in the dashboard :", token);

  return (
    <Stack
      maxWidth="100%"
      className="home-layout"
      flexDirection="row"
      gap={14}
      sx={{ backgroundColor: "#FCFCFD" }}
    >
      <Sidebar projects={mappedProjects} />

      {/* Joyride */}
      {runHomeTour && (
        <PageTour
          steps={homeSteps}
          run={runHomeTour}
          onFinish={() => {
            localStorage.setItem("home-tour", "true");
            setRunHomeTour(false)}}
          tourKey="home-tour"
        />
      )}
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
