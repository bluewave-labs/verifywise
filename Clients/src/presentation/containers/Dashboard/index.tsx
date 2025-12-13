import { Stack, Typography, Box } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet, useLocation } from "react-router";
import { useContext, useEffect, FC, useState } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import DemoAppBanner from "../../components/DemoBanner/DemoAppBanner";
import { getAllProjects } from "../../../application/repository/project.repository";
import {
  postAutoDrivers,
  deleteAutoDrivers,
} from "../../../application/repository/entity.repository";
import { logEngine } from "../../../application/tools/log.engine";
import StandardModal from "../../components/Modals/StandardModal";
import CustomizableToast from "../../components/Toast";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Alert from "../../components/Alert";
import { AlertState } from "../../../application/interfaces/appStates";
import { useDashboard } from "../../../application/hooks/useDashboard";

interface DashboardProps {
  reloadTrigger: boolean;
}

const Dashboard: FC<DashboardProps> = ({ reloadTrigger }) => {
  const { setDashboardValues, setProjects } = useContext(VerifyWiseContext);
  const location = useLocation();

  // Demo data state
  const [showToastNotification, setShowToastNotification] =
    useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>(
    "Generating demo data. Please wait, this process may take some time..."
  );
  const [openDemoDataModal, setOpenDemoDataModal] = useState<boolean>(false);
  const [openDeleteDemoDataModal, setOpenDeleteDemoDataModal] =
    useState<boolean>(false);
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<AlertState>();
  const [refreshProjectsFlag, setRefreshProjectsFlag] =
    useState<boolean>(false);

  const { dashboard, fetchDashboard } = useDashboard();

  // Check for demo data existence
  useEffect(() => {
    if (dashboard?.projects_list) {
      const demoProjectTitles = [
        "AI Recruitment Screening Platform",
        // Legacy demo project names for backwards compatibility
        "AI Compliance Checker",
        "Information Security & AI Governance Framework",
      ];
      const hasDemoProjects = dashboard.projects_list.some((project) =>
        demoProjectTitles.includes(project.project_title)
      );
      setHasDemoData(hasDemoProjects);
    }
  }, [dashboard, refreshProjectsFlag]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getAllProjects();
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

    fetchProjects();
  }, [
    setDashboardValues,
    reloadTrigger,
    location.pathname,
    refreshProjectsFlag,
  ]);

  // Handle create demo data
  const handleCreateDemoData = async () => {
    setOpenDemoDataModal(false);
    setToastMessage(
      "Generating demo data. Please wait, this process may take some time..."
    );
    setShowToastNotification(true);

    const startTime = Date.now();
    const minDisplayTime = 3500;

    try {
      const response = await postAutoDrivers();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (response.status === 201) {
        logEngine({
          type: "info",
          message: "Demo data generated successfully.",
        });

        // Refresh dashboard and projects data
        await Promise.all([
          fetchDashboard(),
          getAllProjects().then((projectsResponse) => {
            if (projectsResponse?.data) {
              setProjects(projectsResponse.data);
              setDashboardValues((prevValues: any) => ({
                ...prevValues,
                projects: projectsResponse.data,
                selectedProjectId: projectsResponse.data[0]?.id || "",
              }));
            }
          }),
        ]);

        // Force refresh projects flag to trigger updates in child components
        setRefreshProjectsFlag((prev) => !prev);

        setShowToastNotification(false);

        setAlertState({
          variant: "success",
          body: "Demo data generated successfully.",
        });
        setTimeout(() => {
          setAlertState(undefined);
          // Refresh the page to ensure all components reflect the changes
          window.location.reload();
        }, 500);
      } else {
        setShowToastNotification(false);
        logEngine({
          type: "error",
          message: "Failed to generate demo data.",
        });
        setAlertState({
          variant: "error",
          body: "Failed to generate demo data.",
        });
        setTimeout(() => {
          setAlertState(undefined);
        }, 3000);
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setShowToastNotification(false);
      const errorMessage = (error as Error).message;
      logEngine({
        type: "error",
        message: `An error occurred: ${errorMessage}`,
      });
      setAlertState({
        variant: "error",
        body: `An error occurred: ${errorMessage}`,
      });
      setTimeout(() => {
        setAlertState(undefined);
      }, 3000);
    }
  };

  // Handle delete demo data
  const handleDeleteDemoData = async () => {
    setOpenDeleteDemoDataModal(false);
    setToastMessage("Deleting demo data. Please wait...");
    setShowToastNotification(true);

    const startTime = Date.now();
    const minDisplayTime = 3500;

    try {
      const response = await deleteAutoDrivers();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (response.status === 200 || response.status === 204) {
        logEngine({
          type: "info",
          message: "Demo data deleted successfully.",
        });

        // Refresh dashboard and projects data
        await Promise.all([
          fetchDashboard(),
          getAllProjects().then((projectsResponse) => {
            if (projectsResponse?.data) {
              setProjects(projectsResponse.data);
              setDashboardValues((prevValues: any) => ({
                ...prevValues,
                projects: projectsResponse.data,
                selectedProjectId: projectsResponse.data[0]?.id || "",
              }));
            }
          }),
        ]);

        // Force refresh projects flag to trigger updates in child components
        setRefreshProjectsFlag((prev) => !prev);

        setShowToastNotification(false);

        setAlertState({
          variant: "success",
          body: "Demo data deleted successfully.",
        });
        setTimeout(() => {
          setAlertState(undefined);
          // Refresh the page to ensure all components reflect the changes
          window.location.reload();
        }, 500);
      } else {
        setShowToastNotification(false);
        logEngine({
          type: "error",
          message: "Failed to delete demo data.",
        });
        setAlertState({
          variant: "error",
          body: "Failed to delete demo data.",
        });
        setTimeout(() => {
          setAlertState(undefined);
        }, 3000);
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setShowToastNotification(false);
      const errorMessage = (error as Error).message;
      logEngine({
        type: "error",
        message: `An error occurred: ${errorMessage}`,
      });
      setAlertState({
        variant: "error",
        body: `An error occurred: ${errorMessage}`,
      });
      setTimeout(() => {
        setAlertState(undefined);
      }, 3000);
    }
  };

  return (
    <Stack
      maxWidth="100%"
      className="home-layout"
      flexDirection="row"
      gap={0}
      sx={{ backgroundColor: "#FCFCFD" }}
    >
      <Sidebar
        onOpenCreateDemoData={() => setOpenDemoDataModal(true)}
        onOpenDeleteDemoData={() => setOpenDeleteDemoDataModal(true)}
        hasDemoData={hasDemoData}
      />
      <Stack>
        <DemoAppBanner />
        {alertState && (
          <Alert
            variant={alertState.variant}
            title={alertState.title}
            body={alertState.body}
            isToast={true}
            onClick={() => setAlertState(undefined)}
          />
        )}
        {showToastNotification && <CustomizableToast title={toastMessage} />}
        <Outlet />
      </Stack>

      {/* Demo Data Modals */}
      <StandardModal
        isOpen={openDemoDataModal}
        onClose={() => setOpenDemoDataModal(false)}
        title="Create demo data"
        description="Generate sample data to explore VerifyWise features"
        submitButtonText="Create demo data"
        onSubmit={handleCreateDemoData}
        isSubmitting={showToastNotification}
      >
        <Stack gap="16px">
          <Box
            sx={{
              padding: "12px 16px",
              backgroundColor: "#F5F7F6",
              borderRadius: "4px",
              border: "1px solid #D9E0DD",
            }}
          >
            <Typography variant="body2" sx={{ color: "rgba(0, 0, 0, 0.87)" }}>
              This will generate demo (mock) data for you, allowing you to
              explore and get a hands-on understanding of how VerifyWise works.
              We highly recommend this option.
            </Typography>
          </Box>

          <Stack gap="8px">
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              What will be created:
            </Typography>
            <Stack gap="4px" sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • A sample use case:
              </Typography>
              <Stack gap="2px" sx={{ pl: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontSize: "13px" }}
                >
                  - "AI Recruitment Screening Platform" with EU AI Act framework
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 1 }}
              >
                • Sample risks and vendors with realistic compliance scenarios
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            Note: You can remove this demo data at any time.
          </Typography>
        </Stack>
      </StandardModal>

      <StandardModal
        isOpen={openDeleteDemoDataModal}
        onClose={() => setOpenDeleteDemoDataModal(false)}
        title="Delete demo data"
        description="Remove all demo data from your workspace"
        customFooter={
          <>
            <CustomizableButton
              variant="outlined"
              text="Cancel"
              onClick={() => setOpenDeleteDemoDataModal(false)}
              sx={{
                minWidth: "80px",
                height: "34px",
                border: "1px solid #D0D5DD",
                color: "#344054",
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #D0D5DD",
                },
              }}
            />
            <CustomizableButton
              variant="contained"
              text="Delete demo data"
              onClick={handleDeleteDemoData}
              isDisabled={showToastNotification}
              sx={{
                minWidth: "80px",
                height: "34px",
                backgroundColor: "#D32F2F",
                "&:hover:not(.Mui-disabled)": {
                  backgroundColor: "#B71C1C",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#E5E7EB",
                  color: "#9CA3AF",
                  cursor: "not-allowed",
                },
              }}
            />
          </>
        }
      >
        <Stack gap="16px">
          <Box
            sx={{
              padding: "12px 16px",
              backgroundColor: "#FEEDED",
              borderRadius: "4px",
              border: "1px solid #F5C2C2",
            }}
          >
            <Typography variant="body2" sx={{ color: "rgba(0, 0, 0, 0.87)" }}>
              This action will permanently delete all demo data from your
              workspace. This cannot be undone.
            </Typography>
          </Box>

          <Stack gap="8px">
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              What will be deleted:
            </Typography>
            <Stack gap="4px" sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • All demo use cases and frameworks
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • All associated demo risks and vendors
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            Note: Only demo data will be removed. Your real data will remain
            untouched.
          </Typography>
        </Stack>
      </StandardModal>
    </Stack>
  );
};

export default Dashboard;
