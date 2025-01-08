import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet } from "react-router";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getEntityById,
  getAllEntities,
} from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";

const Dashboard = () => {
  const { token, setDashboardValues } = useContext(VerifyWiseContext);
  const [projects, setProjects] = useState([]);
  const [_, setUsers] = useState([]);

  const [shouldRun, setShouldRun] = useState(false);
  //joyride steps
  const steps = [
    // Sidebar steps
    {
      target: '[data-joyride-id="new-project-button"]',
      content:
        "Create your first project. Each project corresponds to an AI activity in your company.",
    },
    {
      target: '[data-joyride-id="select-project"]',
      content: "Select a project. Once created, you can select it here.",
    },
    {
      target: '[data-joyride-id="dashboard-navigation"]',
      content: "Fill in compliance,assessments, risks and vendors. Each project has its own set of questions and documents where you can fill in here.",
    },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getEntityById({ routeUrl: "/projects" });
        setProjects(response.data);
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          projects: response.data,
        }));
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await getAllEntities({ routeUrl: "/users" });
        setUsers(response);
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
const newProjectButton = document.querySelector('[data-joyride-id="new-project-button"]');
const dashboardNav= document.querySelector('[data-joyride-id="dashboard-navigation"]');

if (newProjectButton && dashboardNav) {
setShouldRun(true);
}
};
const timeout = setTimeout(checkTourElements, 1000);
return () => clearTimeout(timeout);

  }, [setDashboardValues]);


  const mappedProjects = projects.map((project: any) => ({
    _id: project.id,
    name: project.project_title,
  }));

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
      <PageTour
        steps={steps}
        run={shouldRun}
        onFinish={() => setShouldRun(false)}
      />
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
