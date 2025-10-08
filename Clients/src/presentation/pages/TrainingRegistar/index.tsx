import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import {
  Box,
  Stack,
  Fade,
  IconButton,
  InputBase,
} from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
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
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import { useAuth } from "../../../application/hooks/useAuth";
import PageHeader from "../../components/Layout/PageHeader";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import Select from "../../components/Inputs/Select";
import { searchBoxStyle, inputStyle } from "./style";

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

  // ✅ Filter + search state
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  // ✅ Status options
  const statusOptions = [
    { _id: "all", name: "All Trainings" },
    { _id: "Planned", name: "Planned" },
    { _id: "In Progress", name: "In Progress" },
    { _id: "Completed", name: "Completed" },
  ];

  const fetchTrainingData = useCallback(async () => {
    setIsLoading(true);
    try {
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

  // Filtered trainings
  const filteredTraining = useMemo(() => {
    return trainingData.filter((t) => {
      const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;
      const matchesSearch = t.training_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [trainingData, statusFilter, searchTerm]);

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="AI training registry"
        description="Manage and track AI-related training programs and educational resources"
        whatItDoes="Centralize all **AI training programs**, *courses*, and *educational materials* for your organization. Track **completion status**, *certifications*, and **learning progress** across teams."
        whyItMatters="Proper **AI training** ensures your team stays current with *evolving technologies* and maintains necessary skills for **responsible AI development** and deployment. Training records support *compliance* and **competency requirements**."
        quickActions={[
          {
            label: "Add Training Program",
            description: "Register a new AI training course or educational program",
            primary: true
          },
          {
            label: "Track Progress",
            description: "Monitor team completion rates and certification status"
          }
        ]}
        useCases={[
          "**Internal AI ethics** and *governance training programs* for development teams",
          "**External certification courses** for *machine learning* and **data science skills**"
        ]}
        keyFeatures={[
          "**Comprehensive training catalog** with *metadata* and prerequisites",
          "**Progress tracking** and *certification management* for individuals and teams",
          "**Integration** with learning management systems and *HR platforms*"
        ]}
        tips={[
          "Prioritize **ethics and governance training** for all *AI team members*",
          "Set up *automatic reminders* for **certification renewals** and mandatory training",
          "Track **training effectiveness** through *assessments* and real-world application"
        ]}
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

           {/* Filter + Search row */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={4}
            sx={{ width: "100%" }}
          >
            {/* Left side: Dropdown + Search together */}
            <Stack direction="row" spacing={6} alignItems="center">
              {/* Dropdown Filter */}
              <Select
                id="training-status"
                value={statusFilter}
                items={statusOptions}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                sx={{
                  minWidth: "180px",
                  height: "34px",
                  bgcolor: "#fff",
                }}
              />

              {/* Expandable Search */}
              <Box sx={searchBoxStyle(isSearchBarVisible)}>
                <IconButton
                  disableRipple
                  disableFocusRipple
                  sx={{ "&:hover": { backgroundColor: "transparent" } }}
                  aria-label="Toggle training search"
                  aria-expanded={isSearchBarVisible}
                  onClick={() => setIsSearchBarVisible((prev) => !prev)}
                >
                  <SearchIcon />
                </IconButton>

                {isSearchBarVisible && (
                  <InputBase
                    autoFocus
                    placeholder="Search trainings..."
                    inputProps={{ "aria-label": "Search trainings" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={inputStyle(isSearchBarVisible)}
                  />
                )}
              </Box>
            </Stack>

            {/* Right side: Customize Button */}
            <CustomizableButton
                      variant="contained"
                      sx={{
                        backgroundColor: "#13715B",
                        border: "1px solid #13715B",
                        gap: 2,
                      }}
                      text="New training"
                      icon={<AddCircleOutlineIcon size={16} />}
                      onClick={handleNewTrainingClick}
                      isDisabled={isCreatingDisabled}
                    />
          </Stack>

        {/* Table */}
        <Box sx={{ mt: 1 }}>
          <TrainingTable
            data={filteredTraining}
            isLoading={isLoading}
            onEdit={handleEditTraining}
            onDelete={handleDeleteTraining}
          />
        </Box>

      {/* Modal */}
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