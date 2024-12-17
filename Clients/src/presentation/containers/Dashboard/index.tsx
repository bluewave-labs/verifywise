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

const Dashboard = () => {
  const { token, setDashboardValues } = useContext(VerifyWiseContext);
  const [projects, setProjects] = useState([]);
  const [_, setUsers] = useState([]);

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
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
