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

  const [runTour, setRunTour] = useState(false);
  //joyride steps
  const steps = [
    // Sidebar steps
    {
      target: '[data-joyride-id="dashboard"]',
      content:
        "This is the Dashboard section. Click here to view the overview.",
    },
    {
      target: '[data-joyride-id="compliance-tracker"]',
      content: "Track your compliance status here.",
    },
    {
      target: '[data-joyride-id="assessment-tracker"]',
      content: "Track your assessments here.",
    },
    {
      target: '[data-joyride-id="vendors"]',
      content: "Manage your vendors here.",
    },
    {
      target: '[data-joyride-id="file-manager"]',
      content: "Access your files in the File Manager.",
    },
    // Home Page steps
    {
      target: '[data-joyride-id="project-overview"]',
      content: "This section gives you an overview of all your projects.",
    },
    {
      target: '[data-joyride-id="new-project-button"]',
      content: "Click here to create a new project.",
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
  }, [setDashboardValues]);

  useEffect(() => {
    //start tour only after projects load
    if (projects.length > 0) {
      setRunTour(true);
    }
  }, [projects]);

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
        run={runTour}
        onFinish={() => setRunTour(false)}
      />
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
