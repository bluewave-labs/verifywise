import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  Suspense,
} from "react";
import {
  Box,
  Stack,
  Typography,
  // Included for consistency, though not used in this specific component yet
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import CustomizableButton from "../../vw-v2-components/Buttons";
import { logEngine } from "../../../application/tools/log.engine"; // Assuming this path is correct
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context"; // Assuming this path is correct for context
import { getAllEntities } from "../../../application/repository/entity.repository"; // Assuming this path is correct for data fetching

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  const handleNewTrainingClick = () => {
    setIsNewTrainingModalOpen(true);
  };

  const handleTrainingSuccess = async (formData: any) => {
    try {
      await createTraining("/training", formData);
      await fetchTrainingData();
      setAlert({
        variant: "success",
        body: "New training added successfully!",
      });
      setIsNewTrainingModalOpen(false);
    } catch (error) {
      setAlert({
        variant: "error",
        body: "Failed to add training. Please try again.",
      });
    }
  };

  const handleEditTraining = (id: string) => {
    console.log(`Edit training with ID: ${id}`);
    // Implement logic to fetch training by ID and open the modal for editing
    // For simplicity, this example just logs the ID.
    setAlert({ variant: "info", body: `Editing training with ID: ${id}` });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <Stack sx={{ maxWidth: 1400, mx: "auto", p: 4 }}>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box mb={2}>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
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
        />
      </Stack>

      <NewTraining
        isOpen={isNewTrainingModalOpen}
        setIsOpen={setIsNewTrainingModalOpen}
        onSuccess={handleTrainingSuccess}
      />
    </Stack>
  );
};

export default Training;
