import React, { useState, useEffect, useCallback, useContext, Suspense } from "react";
import { Box, Stack, Typography, Fade, Grid, Button, Select, MenuItem, Paper } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// Update the import path to the correct file name, e.g., Button or CustomizableButton
// import CustomizableButton from "../../components/CustomizableButton";
import { logEngine } from "../../../application/tools/log.engine";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getAllEntities,
  deleteEntityById,
  getEntityById,
  updateEntityById,
} from "../../../application/repository/entity.repository";

import InventoryTable from "./modelInventoryTable";
import AddEditNewModel from "../../components/AddEditNewModel";
import singleTheme from "../../themes/v1SingleTheme";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
const Alert = React.lazy(
  () => import("../../../presentation/components/Alert")
);

const statusSummary = [
  { label: "Approved", value: 17 },
  { label: "Restricted", value: 5 },
  { label: "Pending", value: 1 },
  { label: "Blocked", value: 1 },
];

const statusOptions = [
  "All statuses",
  "Approved",
  "Restricted",
  "Pending",
  "Blocked",
];

const ModelInventoryPage: React.FC = () => {
  const [modelData, setModelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const { userRoleName } = useContext(VerifyWiseContext);
  const isCreatingDisabled = !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // Fetch model data
  const fetchModelData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllEntities({ routeUrl: "/model-inventory" });
      if (response?.data) {
        setModelData(response.data);
      }
    } catch (error) {
      logEngine({
        type: "error",
        message: `Failed to fetch model inventory: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to load model inventory. Please try again later.",
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModelData();
  }, [fetchModelData]);

  useEffect(() => {
    if (alert) {
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
        setTimeout(() => setAlert(null), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleNewModelClick = () => {
    setSelectedModel(null); // Ensure it's a new model
    setIsNewModelModalOpen(true);
  };

  const handleEditModel = (id: string) => {
    setSelectedModelId(id);
    setIsNewModelModalOpen(true);
  };

  useEffect(() => {
    const fetchModelDetails = async () => {
      if (selectedModelId && isNewModelModalOpen) {
        try {
          const response = await getEntityById({
            routeUrl: `/model-inventory/model-id/${selectedModelId}`,
          });
          if (response?.data) {
            setSelectedModel(response.data);
          }
        } catch (error) {
          setAlert({
            variant: "error",
            body: "Failed to load model details. Please try again.",
          });
        }
      }
    };
    fetchModelDetails();
  }, [selectedModelId, isNewModelModalOpen]);

  const handleCloseModal = () => {
    setIsNewModelModalOpen(false);
    setSelectedModel(null);
    setSelectedModelId(null);
  };

  const handleModelSuccess = async (formData: any) => {
    try {
      if (selectedModel) {
        await updateEntityById({
          routeUrl: `/model-inventory/${selectedModel.id}`,
          body: formData,
        });
        setAlert({
          variant: "success",
          body: "Model updated successfully!",
        });
      } else {
        await getAllEntities("/model-inventory", formData);
        setAlert({
          variant: "success",
          body: "New model added successfully!",
        });
      }
      await fetchModelData();
      handleCloseModal();
    } catch (error) {
      setAlert({
        variant: "error",
        body: selectedModel
          ? "Failed to update model. Please try again."
          : "Failed to add model. Please try again.",
      });
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteEntityById({ routeUrl: `/model-inventory/${id}` });
      await fetchModelData();
      setAlert({
        variant: "success",
        body: "Model deleted successfully!",
      });
    } catch (error) {
      setAlert({
        variant: "error",
        body: "Failed to delete model. Please try again.",
      });
    }
  };

  // Filtered data for table
  const filteredData =
    statusFilter === "All statuses"
      ? modelData
      : modelData.filter((item) => item.status === statusFilter);

  return (
    <Stack className="vwhome" gap={"20px"}>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={modelHelpContent}
        pageTitle="Model Inventory"
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
        <Stack>
          <Typography sx={{ ...singleTheme.textStyles.pageTitle, mb: 1 }}>
            Model inventory
          </Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            A model inventory is a single, authoritative list of every AI or LLM model your company builds, buys, or uses. It tells you what the model is, who owns it, where it runs, how risky it is, and whether it is approved to be used. It is the first thing auditors and regulators ask for, and it is the easiest way to kill shadow AI.
          </Typography>
        </Stack>

        <Grid container spacing={3} mb={3}>
          {statusSummary.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid #EAECF0",
                  borderRadius: 2,
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  background: "#fff",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "capitalize", mb: 0.5 }}
                >
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              minWidth: 180,
              background: "#fff",
              borderRadius: 1,
              fontSize: 14,
              border: "1px solid #EAECF0",
              "& .MuiSelect-select": { py: 1.2, px: 2 },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem value={option} key={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#3366FF",
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "none",
              gap: 1,
              "&:hover": { background: "#254EDB" },
              display: "flex",
              alignItems: "center",
            }}
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleNewModelClick}
            disabled={isCreatingDisabled}
          >
            Add new model
          </Button>
        </Stack>

        <InventoryTable
          data={filteredData}
          isLoading={isLoading}
          onEdit={handleEditModel}
          onDelete={handleDeleteModel}
        />
      </Stack>

      <AddEditNewModel
        open={isNewModelModalOpen}
        onClose={handleCloseModal}
        onSave={handleModelSuccess}
        initialData={selectedModel ? { ...selectedModel } : undefined}
        approverOptions={[
          "John McAllen",
          "Jessica Parker",
          "Emily Chen",
          "David Lee",
          "Sarah Jones",
          "Mike Brown",
          "Jane Foster",
          "Tom Evans",
          "Laura White",
        ]}
      />
    </Stack>
  );
};

export default ModelInventoryPage;