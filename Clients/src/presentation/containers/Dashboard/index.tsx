import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet} from "react-router";
import { useContext, useEffect, useState, FC} from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getEntityById,
  getAllEntities,
} from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import { useJoyrideRef } from "../../../application/contexts/JoyrideRefContext";

interface DashboardProps {
  reloadTrigger: boolean;
}

const Dashboard: FC<DashboardProps> = ({ reloadTrigger }) => {
  const { token, setDashboardValues, projects, setProjects } =
    useContext(VerifyWiseContext);

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

  const {newProjectRef, selectProjectRef, dashboardNavRef,vendorButtonRef } = useJoyrideRef();

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
 * If all targets are found, it sets the runHomeTour and runVendorTour state to true.
 */
  useEffect(() => {
    const shouldRunHomeTour = localStorage.getItem("home-tour") !== "true";
    const shouldRunVendorTour = localStorage.getItem("vendor-tour") !== "true";

    if (!shouldRunHomeTour && !shouldRunVendorTour) return;

    let attempts = 0;
    const interval = setInterval(() => {
      const homeReady =
        newProjectRef.current &&
        selectProjectRef.current &&
        dashboardNavRef.current;

      const vendorReady = vendorButtonRef.current;

      if (shouldRunHomeTour && homeReady) {
        console.log("Home tour refs found");
        setRunHomeTour(true);
      }

      if (shouldRunVendorTour && vendorReady) {
        console.log("Vendor tour ref found");
      }

      if (homeReady && vendorReady) clearInterval(interval);
      if (++attempts > 10) clearInterval(interval);
    }, 1000);

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
