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
  useTheme,
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

// Mock style for page description, similar to singleTheme.textStyles.pageDescription

const Training: React.FC = () => {
  const theme = useTheme();
  const [trainingData, setTrainingData] = useState<IAITraining[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Simulate loading state for the table
  const [isNewTrainingModalOpen, setIsNewTrainingModalOpen] = useState(false); // State for the new training modal
  const [isSubmitting, setIsSubmitting] = useState(false); // For toast/loading indicator on submission

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
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching training data:", error);
      logEngine({
        type: "error",
        message: `Failed to fetch training data: ${error}`,
      });
      setAlert({ variant: "error", body: "Failed to load training data." });
      setTimeout(() => setAlert(null), 3000);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  const handleNewTrainingClick = () => {
    setIsNewTrainingModalOpen(true);
  };

  const handleTrainingSuccess = () => {
    // This function will be called when a new training is successfully added via the modal
    // You would typically refetch the data here to update the table
    setIsSubmitting(true);
    console.log("New training successfully added, refetching data...");
    fetchTrainingData(); // Refetch data to show the new entry
    setAlert({ variant: "success", body: "New training added successfully!" });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEditTraining = (id: string) => {
    console.log(`Edit training with ID: ${id}`);
    // Implement logic to fetch training by ID and open the modal for editing
    // For simplicity, this example just logs the ID.
    setAlert({ variant: "info", body: `Editing training with ID: ${id}` });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <Box
      className="training-page"
      sx={{ p: theme.spacing(4), maxWidth: 1400, mx: "auto" }}
    >
      <Stack gap={theme.spacing(10)} maxWidth={1400}>
        <Stack>
          <Typography sx={vwhomeHeading}>AI training registry</Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            This registry lists all AI-related training programs available to
            your organization. You can view, add, and manage training details
            here.
          </Typography>
        </Stack>

        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          mb={2}
        >
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

      {/* New Training Modal */}
      <NewTraining
        isOpen={isNewTrainingModalOpen}
        setIsOpen={setIsNewTrainingModalOpen}
        onSuccess={async (formData) => {
          try {
            await createTraining("/training", formData);
            // Optionally refetch data or show a toast
            fetchTrainingData(); // refresh table
            setAlert({
              variant: "success",
              body: "New training added successfully!",
            });
          } catch (error) {
            setAlert({ variant: "error", body: "Failed to add training." });
          }
        }}
      />
    </Box>
  );
};

export default Training;
