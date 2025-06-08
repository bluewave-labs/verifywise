import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  Suspense,
} from "react";
import { Box, Stack, Typography, Fade } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import CustomizableButton from "../../vw-v2-components/Buttons";
import { logEngine } from "../../../application/tools/log.engine"; // Assuming this path is correct
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context"; // Assuming this path is correct for context
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
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";

const Alert = React.lazy(
  () => import("../../../presentation/components/Alert")
);

const Training: React.FC = () => {
  const [trainingData, setTrainingData] = useState<IAITraining[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Simulate loading state for the table
  const [isNewTrainingModalOpen, setIsNewTrainingModalOpen] = useState(false); // State for the new training modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<IAITraining | null>(
    null
  );
  const [showAlert, setShowAlert] = useState(false);

  // Context for user roles/permissions, similar to Vendors component
  const { userRoleName } = useContext(VerifyWiseContext);
  // Assuming a similar permission structure for 'training' as 'vendors'
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName); // Example permission check

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

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

  const handleTrainingSuccess = async (formData: any) => {
    try {
      if (selectedTraining) {
        // Update existing training
        await updateEntityById({
          routeUrl: `/training/${selectedTraining.id}`,
          body: formData,
        });
        setAlert({
          variant: "success",
          body: "Training updated successfully!",
        });
      } else {
        // Create new training
        await createTraining("/training", formData);
        setAlert({
          variant: "success",
          body: "New training added successfully!",
        });
      }
      await fetchTrainingData();
      setIsNewTrainingModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedTraining(null);
    } catch (error) {
      setAlert({
        variant: "error",
        body: selectedTraining
          ? "Failed to update training. Please try again."
          : "Failed to add training. Please try again.",
      });
    }
  };

  const handleEditTraining = async (id: string) => {
    try {
      const response = await getEntityById({ routeUrl: `/training/${id}` });
      if (response?.data) {
        setSelectedTraining(response.data);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching training details:", error);
      setAlert({
        variant: "error",
        body: "Failed to load training details. Please try again.",
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

  const handleCloseModal = () => {
    setIsNewTrainingModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTraining(null);
  };

  return (
    <Stack sx={{ maxWidth: 1400, mx: "auto", p: 4 }}>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Fade in={showAlert} timeout={300}>
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
        <Stack>
          <Typography sx={vwhomeHeading}>AI training registry</Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            This registry lists all AI-related training programs available to
            your organization. You can view, add, and manage training details
            here.
          </Typography>
        </Stack>

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
        isOpen={isNewTrainingModalOpen || isEditModalOpen}
        setIsOpen={handleCloseModal}
        onSuccess={handleTrainingSuccess}
        initialData={
          selectedTraining
            ? {
                training_name: selectedTraining.training_name,
                duration: selectedTraining.duration,
                provider: selectedTraining.provider,
                department: selectedTraining.department,
                status: selectedTraining.status,
                numberOfPeople: selectedTraining.people,
                description: "", // This field is not in IAITraining, so we'll set it to empty
              }
            : undefined
        }
        isEdit={!!selectedTraining}
      />
    </Stack>
  );
};

export default Training;
