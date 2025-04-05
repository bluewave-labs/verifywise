import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet, useLocation } from "react-router";
import { useContext, useEffect, useState, FC } from "react";
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

    //check if required DOM elements are ready
    const checkTourElements = () => {
      const newProjectButton = document.querySelector(
        '[data-joyride-id="new-project-button"]'
      );
      const dashboardNav = document.querySelector(
        '[data-joyride-id="dashboard-navigation"]'
      );

      if (location.pathname === "/" && newProjectButton && dashboardNav) {
        setRunHomeTour(true);
      } else {
        setRunHomeTour(false);
      }
    };
    const timeout = setTimeout(checkTourElements, 1000);
    return () => clearTimeout(timeout);
  }, [setDashboardValues, reloadTrigger, location.pathname]);

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
          onFinish={() => setRunHomeTour(false)}
          tourKey="home-tour"
        />
      )}
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
