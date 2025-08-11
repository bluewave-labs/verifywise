import React, { useState, useEffect, useContext, Suspense } from "react";
import { Box, Stack, Typography, Fade } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import CustomizableButton from "../../vw-v2-components/Buttons";
import { logEngine } from "../../../application/tools/log.engine";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  getAllEntities,
  deleteEntityById,
  getEntityById,
  updateEntityById,
} from "../../../application/repository/entity.repository";
import { createModelInventory } from "../../../application/repository/modelInventory.repository";

// Import the table and modal components specific to ModelInventory
import ModelInventoryTable from "./modelInventoryTable";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";
import NewModelInventory from "../../components/Modals/NewModelInventory";
import ModelInventorySummary from "./ModelInventorySummary";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import modelInventoryHelpContent from "../../../presentation/helpers/model-inventory-help.html?raw";
import {
  ModelInventoryStatus,
  ModelInventorySummary as Summary,
} from "../../../domain/interfaces/i.modelInventory";
import SelectComponent from "../../components/Inputs/Select";

const Alert = React.lazy(() => import("../../components/Alert"));

const ModelInventory: React.FC = () => {
  const [modelInventoryData, setModelInventoryData] = useState<
    IModelInventory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModelInventoryModalOpen, setIsNewModelInventoryModalOpen] =
    useState(false);
  const [selectedModelInventoryId, setSelectedModelInventoryId] = useState<
    string | null
  >(null);
  const [selectedModelInventory, setSelectedModelInventory] =
    useState<IModelInventory | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Context for user roles/permissions
  const { userRoleName } = useContext(VerifyWiseContext);
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate summary from data
  const summary: Summary = {
    approved: modelInventoryData.filter(
      (item) => item.status === ModelInventoryStatus.APPROVED
    ).length,
    restricted: modelInventoryData.filter(
      (item) => item.status === ModelInventoryStatus.RESTRICTED
    ).length,
    pending: modelInventoryData.filter(
      (item) => item.status === ModelInventoryStatus.PENDING
    ).length,
    blocked: modelInventoryData.filter(
      (item) => item.status === ModelInventoryStatus.BLOCKED
    ).length,
    total: modelInventoryData.length,
  };

  // Filter data based on status
  const filteredData =
    statusFilter === "all"
      ? modelInventoryData
      : modelInventoryData.filter((item) => item.status === statusFilter);

  // Function to fetch model inventory data
  const fetchModelInventoryData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await getAllEntities({ routeUrl: "/modelInventory" });
      if (response?.data) {
        setModelInventoryData(response.data);
        // Only force table re-render if we're not in an optimistic update scenario
        if (showLoading) {
          setTableKey((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching model inventory data:", error);
      logEngine({
        type: "error",
        message: `Failed to fetch model inventory data: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to load model inventory data. Please try again later.",
      });
      setShowAlert(true);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchModelInventoryData();
  }, []);

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

  const handleNewModelInventoryClick = () => {
    setIsNewModelInventoryModalOpen(true);
  };

  const handleEditModelInventory = (id: string) => {
    setSelectedModelInventoryId(id);
    setIsNewModelInventoryModalOpen(true);
  };

  // Fetch model inventory data when modal opens with an ID
  useEffect(() => {
    const fetchModelInventoryDetails = async () => {
      if (selectedModelInventoryId && isNewModelInventoryModalOpen) {
        try {
          const response = await getEntityById({
            routeUrl: `/modelInventory/${selectedModelInventoryId}`,
          });
          console.log("Fetching model inventory details:", response);
          if (response?.data) {
            setSelectedModelInventory(response.data);
          }
        } catch (error) {
          console.error("Error fetching model inventory details:", error);
          setAlert({
            variant: "error",
            body: "Failed to load model inventory details. Please try again.",
          });
        }
      }
    };

    fetchModelInventoryDetails();
  }, [selectedModelInventoryId, isNewModelInventoryModalOpen]);

  const handleCloseModal = () => {
    setIsNewModelInventoryModalOpen(false);
    setSelectedModelInventory(null);
    setSelectedModelInventoryId(null);
  };

  const handleModelInventorySuccess = async (formData: any) => {
    try {
      if (selectedModelInventory) {
        // Update existing model inventory
        console.log("Updating model inventory with data:", formData);
        await updateEntityById({
          routeUrl: `/modelInventory/${selectedModelInventory.id}`,
          body: formData,
        });
        setAlert({
          variant: "success",
          body: "Model inventory updated successfully!",
        });
      } else {
        // Create new model inventory
        await createModelInventory("/modelInventory", formData);
        setAlert({
          variant: "success",
          body: "New model inventory added successfully!",
        });
      }
      await fetchModelInventoryData();
      handleCloseModal();
    } catch (error) {
      setAlert({
        variant: "error",
        body: selectedModelInventory
          ? "Failed to update model inventory. Please try again."
          : "Failed to add model inventory. Please try again.",
      });
    }
  };

  const handleDeleteModelInventory = async (id: string) => {
    try {
      console.log("Deleting model inventory with ID:", id);
      setDeletingId(id);

      // Optimistically remove the item from the local state for immediate UI feedback
      setModelInventoryData((prevData) => {
        const newData = prevData.filter((item) => item.id?.toString() !== id);
        console.log(
          "Optimistic update: removed item",
          id,
          "New data length:",
          newData.length
        );
        return newData;
      });

      // Perform the actual delete operation
      await deleteEntityById({ routeUrl: `/modelInventory/${id}` });
      console.log("Delete API call successful");

      // Fetch fresh data to ensure consistency with server (without loading state)
      await fetchModelInventoryData(false);

      // Force a smooth table re-render after the data update
      setTableKey((prev) => prev + 1);
      console.log("Fresh data fetched, UI updated");

      setAlert({
        variant: "success",
        body: "Model inventory deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting model inventory:", error);

      // If delete failed, revert the optimistic update by fetching fresh data (without loading state)
      await fetchModelInventoryData(false);

      setAlert({
        variant: "error",
        body: "Failed to delete model inventory. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const statusFilterOptions = [
    { _id: "all", name: "All Statuses" },
    { _id: ModelInventoryStatus.APPROVED, name: "Approved" },
    { _id: ModelInventoryStatus.RESTRICTED, name: "Restricted" },
    { _id: ModelInventoryStatus.PENDING, name: "Pending" },
    { _id: ModelInventoryStatus.BLOCKED, name: "Blocked" },
  ];

  return (
    <Stack className="vwhome" gap={"20px"}>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={modelInventoryHelpContent}
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
          <Typography sx={vwhomeHeading}>Model Inventory</Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            This registry lists all AI/LLM models used within your organization
            and their compliance status. You can view, add, and manage model
            details here.
          </Typography>
        </Stack>

        {/* Summary Cards */}
        <ModelInventorySummary summary={summary} />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <SelectComponent
            id="status-filter"
            value={statusFilter}
            items={statusFilterOptions}
            onChange={handleStatusFilterChange}
            sx={{
              width: "200px",
              minHeight: "34px",
            }}
          />
          <CustomizableButton
            variant="contained"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            text="Add new model"
            icon={<AddCircleOutlineIcon />}
            onClick={handleNewModelInventoryClick}
            isDisabled={isCreatingDisabled}
          />
        </Stack>

        <ModelInventoryTable
          key={tableKey}
          data={filteredData}
          isLoading={isLoading}
          onEdit={handleEditModelInventory}
          onDelete={handleDeleteModelInventory}
          deletingId={deletingId}
        />
      </Stack>

      <NewModelInventory
        isOpen={isNewModelInventoryModalOpen}
        setIsOpen={handleCloseModal}
        onSuccess={handleModelInventorySuccess}
        initialData={
          selectedModelInventory
            ? {
                provider_model: selectedModelInventory.provider_model,
                version: selectedModelInventory.version || "",
                approver: selectedModelInventory.approver,
                capabilities: selectedModelInventory.capabilities,
                security_assessment: selectedModelInventory.security_assessment,
                status: selectedModelInventory.status,
                status_date: selectedModelInventory.status_date
                  ? new Date(selectedModelInventory.status_date)
                      .toISOString()
                      .split("T")[0]
                  : new Date().toISOString().split("T")[0],
              }
            : undefined
        }
        isEdit={!!selectedModelInventory}
      />
    </Stack>
  );
};

export default ModelInventory;
