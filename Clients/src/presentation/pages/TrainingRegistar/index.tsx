import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg"
import CustomizableButton from "../../components/Button/CustomizableButton";
import { logEngine } from "../../../application/tools/log.engine"; // Assuming this path is correct
import {
  getAllEntities,
  deleteEntityById,
  getEntityById,
  updateEntityById,
} from "../../../application/repository/entity.repository"; // Assuming this path is correct for data fetching

// Import the table and modal components specific to Training
import TrainingTable, { IAITraining } from "./trainingTable"; // Import IAITraining from TrainingTable
import NewTraining from "../../../presentation/components/Modals/NewTraining"; // Import the NewTraining modal
import { createTraining } from "../../../application/repository/trainingregistar.repository";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import trainingHelpContent from "../../../presentation/helpers/training-help.html?raw";
import { useAuth } from "../../../application/hooks/useAuth";
import PageHeader from "../../components/Layout/PageHeader";

const Alert = React.lazy(
  () => import("../../../presentation/components/Alert")
);

const Training: React.FC = () => {
  const [trainingData, setTrainingData] = useState<IAITraining[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTrainingModalOpen, setIsNewTrainingModalOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(
    null
  );
  const [selectedTraining, setSelectedTraining] = useState<IAITraining | null>(
    null
  );
  const [showAlert, setShowAlert] = useState(false);

  const { userRoleName } = useAuth();
  // Assuming a similar permission structure for 'training' as 'vendors'
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName); // Example permission check

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  // Function to simulate fetching training data
  const fetchTrainingData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch training data
      const response = await getAllEntities({ routeUrl: "/training" });
      if (response?.data) {
        setTrainingData(response.data);
      }
    } catch (error) {
      console.error("Error fetching training data:", error);
      logEngine({
        type: "error",
        message: `Failed to fetch training data: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to load training data. Please try again later.",
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  useEffect(() => {
    if (alert) {
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
        setTimeout(() => setAlert(null), 300); // Wait for fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleNewTrainingClick = () => {
    setIsNewTrainingModalOpen(true);
  };

  const handleEditTraining = (id: string) => {
    setSelectedTrainingId(id);
    setIsNewTrainingModalOpen(true);
  };

  // Fetch training data when modal opens with an ID
  useEffect(() => {
    const fetchTrainingDetails = async () => {
      if (selectedTrainingId && isNewTrainingModalOpen) {
        try {
          const response = await getEntityById({
            routeUrl: `/training/training-id/${selectedTrainingId}`,
          });
          if (response?.data) {
            setSelectedTraining(response.data);
          }
        } catch (error) {
          console.error("Error fetching training details:", error);
          setAlert({
            variant: "error",
            body: "Failed to load training details. Please try again.",
          });
        }
      }
    };

    fetchTrainingDetails();
  }, [selectedTrainingId, isNewTrainingModalOpen]);

  const handleCloseModal = () => {
    setIsNewTrainingModalOpen(false);
    setSelectedTraining(null);
    setSelectedTrainingId(null);
  };

  const handleTrainingSuccess = async (formData: any) => {
    try {
      if (selectedTraining) {
        // Update existing training
        const response = await updateEntityById({
          routeUrl: `/training/${selectedTraining.id}`,
          body: formData,
        });
        if (response.data) {
          setAlert({
            variant: "success",
            body: "Training updated successfully!",
          });
        } else {
          setAlert({
            variant: "error",
            body: "Failed to update training. Please try again.",
          });
        }
      } else {
        // Create new training
        const response = await createTraining("/training", formData);
        if (response.data) {
          setAlert({
            variant: "success",
            body: "Training updated successfully!",
          });
        } else {
          setAlert({
            variant: "error",
            body: "Failed to add training. Please try again.",
          });
        }
      }
      await fetchTrainingData();
      handleCloseModal();
    } catch (error) {
      setAlert({
        variant: "error",
        body: selectedTraining
          ? "Failed to update training. Please try again."
          : "Failed to add training. Please try again.",
      });
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      await deleteEntityById({ routeUrl: `/training/${id}` });
      await fetchTrainingData();
      setAlert({
        variant: "success",
        body: "Training deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting training:", error);
      setAlert({
        variant: "error",
        body: "Failed to delete training. Please try again.",
      });
    }
  };

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={trainingHelpContent}
        pageTitle="Training Registry"
      />
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Fade
            in={showAlert}
            timeout={300}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          >
            <Box mb={2}>
              <Alert
                variant={alert.variant}
                title={alert.title}
                body={alert.body}
                isToast={true}
                onClick={() => {
                  setShowAlert(false);
                  setTimeout(() => setAlert(null), 300);
                }}
              />
            </Box>
          </Fade>
        </Suspense>
      )}

      <Stack gap={4}>

        <PageHeader
               title="AI training registry"
               description=" This registry lists all AI-related training programs available to
               your organization. You can view, add, and manage training details here."
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />

        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <CustomizableButton
            variant="contained"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            text="New training"
            icon={<AddCircleOutlineIcon />}
            onClick={handleNewTrainingClick}
            isDisabled={isCreatingDisabled}
          />
        </Stack>

        <TrainingTable
          data={trainingData}
          isLoading={isLoading}
          onEdit={handleEditTraining}
          onDelete={handleDeleteTraining}
        />
      </Stack>

      <NewTraining
        isOpen={isNewTrainingModalOpen}
        setIsOpen={handleCloseModal}
        onSuccess={handleTrainingSuccess}
        initialData={
          selectedTraining
            ? {
                training_name: selectedTraining.training_name,
                duration: String(selectedTraining.duration || ""),
                provider: selectedTraining.provider,
                department: selectedTraining.department,
                status: selectedTraining.status,
                numberOfPeople: selectedTraining.people,
                description: selectedTraining.description,
              }
            : undefined
        }
        isEdit={!!selectedTraining}
      />
    </Stack>
  );
};

export default Training;
