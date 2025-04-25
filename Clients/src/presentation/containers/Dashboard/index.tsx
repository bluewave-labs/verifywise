import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet, useLocation } from "react-router";
import { useContext, useEffect, FC } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getEntityById,
  getAllEntities,
} from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import DemoAppBanner from "../../components/DemoBanner/DemoAppBanner";

interface DashboardProps {
  reloadTrigger: boolean;
}

const Dashboard: FC<DashboardProps> = ({ reloadTrigger }) => {
  const {
    token,
    setDashboardValues,
    projects,
    setProjects,
  } = useContext(VerifyWiseContext);
  const location = useLocation();

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
      <Stack spacing={3}>      
        <DemoAppBanner />                      

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
    </Stack>
  );
};

export default Dashboard;
