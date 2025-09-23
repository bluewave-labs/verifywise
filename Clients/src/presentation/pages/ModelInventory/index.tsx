import React, { useState, useEffect, Suspense, useMemo } from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg"
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setModelInventoryStatusFilter } from "../../../application/redux/ui/uiSlice";

import CustomizableButton from "../../components/Button/CustomizableButton";
import { logEngine } from "../../../application/tools/log.engine";
import {
  getAllEntities,
  deleteEntityById,
  getEntityById,
  updateEntityById,
  createNewUser,
} from "../../../application/repository/entity.repository";
import { createModelInventory } from "../../../application/repository/modelInventory.repository";
import { useAuth } from "../../../application/hooks/useAuth";
// Import the table and modal components specific to ModelInventory
import ModelInventoryTable from "./modelInventoryTable";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";
import NewModelInventory from "../../components/Modals/NewModelInventory";
import ModelRisksTable from "./ModelRisksTable";
import { IModelRisk, IModelRiskFormData } from "../../../domain/interfaces/i.modelRisk";
import NewModelRisk from "../../components/Modals/NewModelRisk";
import ModelInventorySummary from "./ModelInventorySummary";
import ModelRiskSummary from "./ModelRiskSummary";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import modelInventoryHelpContent from "../../../presentation/helpers/model-inventory-help.html?raw";
import {
  mainStackStyle,
  filterButtonRowStyle,
  toastFadeStyle,
  statusFilterSelectStyle,
  addNewModelButtonStyle,
} from "./style";
import {
  aiTrustCenterTabStyle,
  aiTrustCenterTabListStyle,
} from "../AITrustCenter/styles";
import {
  ModelInventoryStatus,
  ModelInventorySummary as Summary,
} from "../../../domain/interfaces/i.modelInventory";
import SelectComponent from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import Tab from "@mui/material/Tab";
import { IconButton, InputBase } from "@mui/material";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { searchBoxStyle, inputStyle } from "./style";

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

  // Model Risks state
  const [modelRisksData, setModelRisksData] = useState<IModelRisk[]>([]);
  const [isModelRisksLoading, setIsModelRisksLoading] = useState(false);
  const [isNewModelRiskModalOpen, setIsNewModelRiskModalOpen] = useState(false);
  const [selectedModelRiskId, setSelectedModelRiskId] = useState<number | null>(null);
  const [selectedModelRisk, setSelectedModelRisk] = useState<IModelRisk | null>(null);
  const [modelRiskCategoryFilter, setModelRiskCategoryFilter] = useState("all");
  const [modelRiskLevelFilter, setModelRiskLevelFilter] = useState("all");
  const [deletingModelRiskId, setDeletingModelRiskId] = useState<number | null>(null);
  const [users, setUsers] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const statusFilter = useSelector(
    (state: any) => state.ui?.modelInventory?.statusFilter || "all"
  );

  const { userRoleName } = useAuth();
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
  const [activeTab, setActiveTab] = useState("models"); // "models" = Models, "model-risks" = Model Risks

  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


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
  const filteredData = useMemo(() => {
    let data = statusFilter === "all"
      ? modelInventoryData
      : modelInventoryData.filter((item) => item.status === statusFilter);
  
    if (searchTerm) {
      data = data.filter((item) =>
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.version?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return data;
  }, [modelInventoryData, statusFilter, searchTerm]);
  

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

  // Function to fetch model risks data
  const fetchModelRisksData = async (showLoading = true) => {
    if (showLoading) {
      setIsModelRisksLoading(true);
    }
    try {
      const response = await getAllEntities({ routeUrl: "/modelRisks" });
      // Handle both direct array and {message, data} format
      let modelRisksData = [];
      if (Array.isArray(response)) {
        modelRisksData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        modelRisksData = response.data;
      } else if (response?.data) {
        modelRisksData = response.data;
      } else {
        console.warn("Unexpected model risks data format:", response);
        modelRisksData = [];
      }
      setModelRisksData(modelRisksData);
    } catch (error) {
      console.error("Error fetching model risks data:", error);
      logEngine({
        type: "error",
        message: `Failed to fetch model risks data: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to load model risks data. Please try again later.",
      });
      setShowAlert(true);
    } finally {
      if (showLoading) {
        setIsModelRisksLoading(false);
      }
    }
  };

  // Function to fetch users data
  const fetchUsersData = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/users" });
      // Handle both direct array and {message, data} format
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response?.data) {
        usersData = response.data;
      } else {
        console.warn("Unexpected users data format:", response);
        usersData = [];
      }
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };

  useEffect(() => {
    fetchModelInventoryData();
    fetchModelRisksData();
    fetchUsersData();
  }, []);

  // Initialize and sync status filter with URL parameters
  useEffect(() => {
    const urlStatusFilter = searchParams.get("statusFilter");

    if (urlStatusFilter) {
      dispatch(setModelInventoryStatusFilter(urlStatusFilter));
    } else {
      dispatch(setModelInventoryStatusFilter("all"));
    }
  }, [searchParams, dispatch]);

  // Force table re-render when status filter changes
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [statusFilter]);

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

  // Fetch model risk data when modal opens with an ID
  useEffect(() => {
    const fetchModelRiskDetails = async () => {
      if (selectedModelRiskId && isNewModelRiskModalOpen) {
        try {
          const response = await getEntityById({
            routeUrl: `/modelRisks/${selectedModelRiskId}`,
          });
          console.log("Fetching model risk details:", response);
          if (response?.data) {
            setSelectedModelRisk(response.data);
          }
        } catch (error) {
          console.error("Error fetching model risk details:", error);
          setAlert({
            variant: "error",
            body: "Failed to load model risk details. Please try again.",
          });
        }
      }
    };

    fetchModelRiskDetails();
  }, [selectedModelRiskId, isNewModelRiskModalOpen]);

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
    const newStatusFilter = event.target.value;
    dispatch(setModelInventoryStatusFilter(newStatusFilter));

    // Update URL search params to persist the filter
    if (newStatusFilter === "all") {
      searchParams.delete("statusFilter");
    } else {
      searchParams.set("statusFilter", newStatusFilter);
    }
    setSearchParams(searchParams);
  };

  const statusFilterOptions = [
    { _id: "all", name: "All statuses" },
    { _id: ModelInventoryStatus.APPROVED, name: "Approved" },
    { _id: ModelInventoryStatus.RESTRICTED, name: "Restricted" },
    { _id: ModelInventoryStatus.PENDING, name: "Pending" },
    { _id: ModelInventoryStatus.BLOCKED, name: "Blocked" },
  ];

  // Filter model risks based on category and level
  const filteredModelRisks = useMemo(() => {
    let filtered = modelRisksData;

    if (modelRiskCategoryFilter !== "all") {
      filtered = filtered.filter((risk) => risk.riskCategory === modelRiskCategoryFilter);
    }

    if (modelRiskLevelFilter !== "all") {
      filtered = filtered.filter((risk) => risk.riskLevel === modelRiskLevelFilter);
    }

    return filtered;
  }, [modelRisksData, modelRiskCategoryFilter, modelRiskLevelFilter]);

  // Model Risk handlers
  const handleNewModelRiskClick = () => {
    setIsNewModelRiskModalOpen(true);
  };

  const handleEditModelRisk = (id: number) => {
    setSelectedModelRiskId(id);
    setIsNewModelRiskModalOpen(true);
  };

  const handleCloseModelRiskModal = () => {
    setIsNewModelRiskModalOpen(false);
    setSelectedModelRisk(null);
    setSelectedModelRiskId(null);
  };

  const handleModelRiskSuccess = async (formData: IModelRiskFormData) => {
    try {
      if (selectedModelRisk) {
        // Update existing model risk
        await updateEntityById({
          routeUrl: `/modelRisks/${selectedModelRisk.id}`,
          body: formData,
        });
        setAlert({
          variant: "success",
          body: "Model risk updated successfully!",
        });
      } else {
        // Create new model risk using apiServices
        await createNewUser({
          routeUrl: "/modelRisks",
          body: formData,
        });
        setAlert({
          variant: "success",
          body: "New model risk added successfully!",
        });
      }
      await fetchModelRisksData();
      handleCloseModelRiskModal();
    } catch (error) {
      setAlert({
        variant: "error",
        body: selectedModelRisk
          ? "Failed to update model risk. Please try again."
          : "Failed to add model risk. Please try again.",
      });
    }
  };

  const handleDeleteModelRisk = async (id: number) => {
    try {
      setDeletingModelRiskId(id);

      // Optimistically remove the item from the local state
      setModelRisksData((prevData) =>
        prevData.filter((item) => item.id !== id)
      );

      // Perform the actual delete operation
      await deleteEntityById({ routeUrl: `/modelRisks/${id}` });

      // Fetch fresh data to ensure consistency
      await fetchModelRisksData(false);

      setAlert({
        variant: "success",
        body: "Model risk deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting model risk:", error);

      // If delete failed, revert the optimistic update
      await fetchModelRisksData(false);

      setAlert({
        variant: "error",
        body: "Failed to delete model risk. Please try again.",
      });
    } finally {
      setDeletingModelRiskId(null);
    }
  };

  const handleModelRiskCategoryFilterChange = (event: any) => {
    setModelRiskCategoryFilter(event.target.value);
  };

  const handleModelRiskLevelFilterChange = (event: any) => {
    setModelRiskLevelFilter(event.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Stack className="vwhome" sx={mainStackStyle}>
      {/* <PageBreadcrumbs /> */}

      <PageBreadcrumbs />

      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={modelInventoryHelpContent}
        pageTitle="Model Inventory"
      />
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Fade in={showAlert} timeout={300} style={toastFadeStyle}>
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

      <Stack sx={mainStackStyle}>
            <PageHeader
               title="Model Inventory"
               description="This registry manages all AI/LLM models and their associated risks within your organization. You can view, add, and manage model details and track model-specific risks and mitigation plans."
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />

        {/* Summary Cards */}
        {activeTab === "models" && <ModelInventorySummary summary={summary} />}
        {activeTab === "model-risks" && <ModelRiskSummary modelRisks={modelRisksData} />}

        {/* Tab Bar */}
        <TabContext value={activeTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", marginBottom: 3 }}>
            <TabList
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={aiTrustCenterTabListStyle}
            >
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Models"
                value="models"
                disableRipple
              />
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Model risks"
                value="model-risks"
                disableRipple
              />
            </TabList>
          </Box>
        </TabContext>

        {activeTab === "models" && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={filterButtonRowStyle}
            >
              {/* Left side: Status dropdown + Search */}
              <Stack direction="row" spacing={4} alignItems="center">
                <SelectComponent
                  id="status-filter"
                  value={statusFilter}
                  items={statusFilterOptions}
                  onChange={handleStatusFilterChange}
                  sx={statusFilterSelectStyle}
                  customRenderValue={(value, selectedItem) => {
                    if (value === "all") {
                      return selectedItem.name;
                    }
                    return `Status: ${selectedItem.name.toLowerCase()}`;
                  }}
                />

                {/* Expandable Search */}
                <Box sx={searchBoxStyle(isSearchBarVisible)}>
                  <IconButton
                    disableRipple
                    disableFocusRipple
                    sx={{ "&:hover": { backgroundColor: "transparent" } }}
                    aria-label="Toggle search"
                    aria-expanded={isSearchBarVisible}
                    onClick={() => setIsSearchBarVisible((prev) => !prev)}
                  >
                    <SearchIcon/>
                  </IconButton>

                  {isSearchBarVisible && (
                    <InputBase
                      autoFocus
                      placeholder="Search models..."
                      inputProps={{ "aria-label": "Search models" }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={inputStyle(isSearchBarVisible)}
                    />
                  )}
                </Box>
              </Stack>

              {/* Right side: Add Model button */}
              <CustomizableButton
                variant="contained"
                sx={addNewModelButtonStyle}
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
          </>
        )}

        {activeTab === "model-risks" && (
          <>
            {/* Model Risks Tab Content */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={filterButtonRowStyle}
            >
              <Stack direction="row" gap={2}>
                <SelectComponent
                  id="risk-category-filter"
                  value={modelRiskCategoryFilter}
                  items={[
                    { _id: "all", name: "All categories" },
                    { _id: "Performance", name: "Performance" },
                    { _id: "Bias & Fairness", name: "Bias & Fairness" },
                    { _id: "Security", name: "Security" },
                    { _id: "Data Quality", name: "Data Quality" },
                    { _id: "Compliance", name: "Compliance" },
                  ]}
                  onChange={handleModelRiskCategoryFilterChange}
                  sx={statusFilterSelectStyle}
                  customRenderValue={(value, selectedItem) => {
                    if (value === "all") {
                      return selectedItem.name;
                    }
                    return `Category: ${selectedItem.name.toLowerCase()}`;
                  }}
                />
                <SelectComponent
                  id="risk-level-filter"
                  value={modelRiskLevelFilter}
                  items={[
                    { _id: "all", name: "All risk levels" },
                    { _id: "Low", name: "Low" },
                    { _id: "Medium", name: "Medium" },
                    { _id: "High", name: "High" },
                    { _id: "Critical", name: "Critical" },
                  ]}
                  onChange={handleModelRiskLevelFilterChange}
                  sx={statusFilterSelectStyle}
                  customRenderValue={(value, selectedItem) => {
                    if (value === "all") {
                      return selectedItem.name;
                    }
                    return `Risk level: ${selectedItem.name.toLowerCase()}`;
                  }}
                />
              </Stack>
              <CustomizableButton
                variant="contained"
                sx={addNewModelButtonStyle}
                text="Add model risk"
                icon={<AddCircleOutlineIcon />}
                onClick={handleNewModelRiskClick}
                isDisabled={isCreatingDisabled}
              />
            </Stack>

            <ModelRisksTable
              data={filteredModelRisks}
              isLoading={isModelRisksLoading}
              onEdit={handleEditModelRisk}
              onDelete={handleDeleteModelRisk}
              deletingId={deletingModelRiskId}
              users={users}
            />
          </>
        )}
      </Stack>

      <NewModelInventory
        isOpen={isNewModelInventoryModalOpen}
        setIsOpen={handleCloseModal}
        onSuccess={handleModelInventorySuccess}
        initialData={
          selectedModelInventory
            ? {
                provider_model: selectedModelInventory.provider_model || "",
                provider: selectedModelInventory.provider || "",
                model: selectedModelInventory.model || "",
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

      <NewModelRisk
        isOpen={isNewModelRiskModalOpen}
        setIsOpen={handleCloseModelRiskModal}
        onSuccess={handleModelRiskSuccess}
        initialData={
          selectedModelRisk
            ? {
                riskName: selectedModelRisk.riskName || "",
                riskCategory: selectedModelRisk.riskCategory,
                riskLevel: selectedModelRisk.riskLevel,
                status: selectedModelRisk.status,
                owner: selectedModelRisk.owner,
                targetDate: selectedModelRisk.targetDate
                  ? new Date(selectedModelRisk.targetDate)
                      .toISOString()
                      .split("T")[0]
                  : new Date().toISOString().split("T")[0],
                description: selectedModelRisk.description || "",
                mitigationPlan: selectedModelRisk.mitigationPlan || "",
                impact: selectedModelRisk.impact || "",
                modelId: selectedModelRisk.modelId,
              }
            : undefined
        }
        isEdit={!!selectedModelRisk}
      />
    </Stack>
  );
};

export default ModelInventory;
