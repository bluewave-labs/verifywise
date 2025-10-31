/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
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
import { usePostHog } from "../../../application/hooks/usePostHog";
// Import the table and modal components specific to ModelInventory
import ModelInventoryTable from "./modelInventoryTable";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";
import NewModelInventory from "../../components/Modals/NewModelInventory";
import ModelRisksTable from "./ModelRisksTable";
import {
  IModelRisk,
  IModelRiskFormData,
} from "../../../domain/interfaces/i.modelRisk";
import NewModelRisk from "../../components/Modals/NewModelRisk";
import ModelInventorySummary from "./ModelInventorySummary";
import ModelRiskSummary from "./ModelRiskSummary";
import MLFlowDataTable from "./MLFlowDataTable";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageTour from "../../components/PageTour";
import ModelInventorySteps from "./ModelInventorySteps";
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
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";
import SelectComponent from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import Tab from "@mui/material/Tab";
import { IconButton, InputBase } from "@mui/material";
import { Search as SearchIcon } from "lucide-react";
import { searchBoxStyle, inputStyle } from "./style";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";

const Alert = React.lazy(() => import("../../components/Alert"));

const ModelInventory: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [selectedModelRiskId, setSelectedModelRiskId] = useState<number | null>(
    null
  );
  const [selectedModelRisk, setSelectedModelRisk] = useState<IModelRisk | null>(
    null
  );
  const [modelRiskCategoryFilter, setModelRiskCategoryFilter] = useState("all");
  const [modelRiskLevelFilter, setModelRiskLevelFilter] = useState("all");
  const [modelRiskStatusFilter, setModelRiskStatusFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const [deletingModelRiskId, setDeletingModelRiskId] = useState<number | null>(
    null
  );
  const [users, setUsers] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const statusFilter = useSelector(
    (state: any) => state.ui?.modelInventory?.statusFilter || "all"
  );

  const { userRoleName } = useAuth();
  const { trackDashboard, trackFilter, trackFeature, trackAIModel } = usePostHog();
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

  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Determine the active tab based on the URL
  const getInitialTab = () => {
    const currentPath = location.pathname;
    if (currentPath.includes("model-risks")) return "model-risks";
    if (currentPath.includes("mlflow")) return "mlflow";
    return "models";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab()); // "models" = Models, "model-risks" = Model Risks, "mlflow" = MLFlow Data

  // Sync activeTab with URL changes (for browser back/forward navigation)
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

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
    let data =
      statusFilter === "all"
        ? modelInventoryData
        : modelInventoryData.filter((item) => item.status === statusFilter);

    if (searchTerm) {
      data = data.filter(
        (item) =>
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
  const fetchModelRisksData = async (showLoading = true, filter = modelRiskStatusFilter) => {
    if (showLoading) {
      setIsModelRisksLoading(true);
    }
    try {
      const response = await getAllEntities({ routeUrl: `/modelRisks?filter=${filter}` });
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
    // Track model inventory page load
    trackDashboard('model_inventory', {
      user_role: userRoleName,
      page_type: 'ai_model_registry',
      has_url_filters: !!searchParams.toString(),
    });

    fetchModelInventoryData();
    fetchModelRisksData();
    fetchUsersData();
  }, [trackDashboard, userRoleName, searchParams]);

  // Refetch model risks when filter changes
  useEffect(() => {
    fetchModelRisksData(true, modelRiskStatusFilter);
  }, [modelRiskStatusFilter]);

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

  // Auto-open create model modal when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsNewModelInventoryModalOpen(true);
      setSelectedModelInventory(null);
      setSelectedModelInventoryId(null);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleNewModelInventoryClick = () => {
    // Track AI model creation start
    trackAIModel('new_model_creation', 'start', {
      user_role: userRoleName,
      total_existing_models: modelInventoryData.length,
      source: 'model_inventory_page',
    });

    trackFeature('model_creation', 'started', {
      form_type: 'ai_model_registration',
      user_role: userRoleName,
    });

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
    if (selectedModelInventory) {
      // Update existing model inventory
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
  };

  const handleModelInventoryError = (error: any) => {
    console.error("Model inventory operation error:", error);
    
    let errorMessage = selectedModelInventory
      ? "Failed to update model inventory. Please try again."
      : "Failed to add model inventory. Please try again.";

    // Check different error structures
    let errorData = null;
    
    // Check if it's an axios error with response.data first
    if (error?.response?.data) {
      errorData = error.response.data;
    }
    // Check if it's a CustomException with response property
    else if (error?.response) {
      errorData = error.response;
    }
    // Check if the error itself has the data structure
    else if (error?.status && error?.errors) {
      errorData = error;
    }

    if (errorData) {
      // Handle validation errors with specific field messages
      if (errorData.status === "error" && errorData.errors && Array.isArray(errorData.errors)) {
        const validationMessages = errorData.errors.map((err: any) => {
          return err.message || "Validation error";
        }).join(", ");
        
        errorMessage = validationMessages;
      } 
      // Handle general error message
      else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }
    
    setAlert({
      variant: "error",
      body: errorMessage,
    });
  };

  const handleDeleteModelInventory = async (
    id: string,
    deleteRisks: boolean = false
  ) => {
    try {
      setDeletingId(id);

      // Optimistically remove the item from the local state for immediate UI feedback
      setModelInventoryData((prevData) => {
        const newData = prevData.filter((item) => item.id?.toString() !== id);
        return newData;
      });

      // If deleting risks, also optimistically remove related risks from the risks table
      if (deleteRisks) {
        setModelRisksData((prevData) =>
          prevData.filter((risk) => risk.model_id?.toString() !== id)
        );
      }

      await deleteEntityById({
        routeUrl: `/modelInventory/${id}${
          deleteRisks ? "?deleteRisks=true" : ""
        }`,
      });

      // Fetch fresh data to ensure consistency with server (without loading state)
      await fetchModelInventoryData(false);

      // If risks were deleted, also refresh the model risks data
      if (deleteRisks) {
        await fetchModelRisksData(false);
      }

      // Force a smooth table re-render after the data update
      setTableKey((prev) => prev + 1);

      setAlert({
        variant: "success",
        body: deleteRisks
          ? "Model inventory and associated risks deleted successfully!"
          : "Model inventory deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting model inventory:", error);

      // If delete failed, revert the optimistic update by fetching fresh data (without loading state)
      await fetchModelInventoryData(false);
      if (deleteRisks) {
        await fetchModelRisksData(false);
      }

      setAlert({
        variant: "error",
        body: "Failed to delete model inventory. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheckModelHasRisks = async (id: string): Promise<boolean> => {
    try {
      // First check local data for immediate response
      const numericId = parseInt(id);
      const hasLocalRisks = modelRisksData.some(
        (risk) => risk.model_id === numericId
      );

      // If local data shows risks, return true immediately
      if (hasLocalRisks) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking model risks:", error);
      return false;
    }
  };

  const handleStatusFilterChange = (event: any) => {
    const newStatusFilter = event.target.value;

    // Track filter usage
    trackFilter('model_status', newStatusFilter, {
      filter_type: 'model_inventory_status',
      previous_filter: statusFilter,
      user_role: userRoleName,
      total_models: modelInventoryData.length,
    });

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
      filtered = filtered.filter(
        (risk) => risk.risk_category === modelRiskCategoryFilter
      );
    }

    if (modelRiskLevelFilter !== "all") {
      filtered = filtered.filter(
        (risk) => risk.risk_level === modelRiskLevelFilter
      );
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

  const handleModelRiskStatusFilterChange = (event: any) => {
    setModelRiskStatusFilter(event.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue); // Immediate UI update for better UX
    if (newValue === "models") {
      navigate("/model-inventory");
    } else if (newValue === "model-risks") {
      navigate("/model-inventory/model-risks");
    } else if (newValue === "mlflow") {
      navigate("/model-inventory/mlflow");
    }
  };

  return (
    <Stack className="vwhome" sx={mainStackStyle}>
      {/* <PageBreadcrumbs /> */}

      <PageBreadcrumbs />

      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Model inventory & risk management"
        description="Track and assess AI models and their associated risks throughout their lifecycle"
        whatItDoes="Maintain a *comprehensive inventory* of AI models including their *metadata*, *approval status*, and *associated risks*. Track basic model information and assess potential risks."
        whyItMatters="Proper **model governance** ensures *regulatory compliance*, *operational reliability*, and *risk mitigation*. It provides *visibility into your AI assets* and helps assess model-related risks."
        quickActions={[
          {
            label: "Add New Model",
            description:
              "Register a new AI model with comprehensive metadata and risk assessment",
            primary: true,
          },
          {
            label: "Assess Model Risk",
            description:
              "Evaluate potential risks for existing models using our assessment framework",
          },
        ]}
        useCases={[
          "*Machine learning models* in production environments requiring *monitoring and governance*",
          "*Pre-trained models* from external vendors that need *risk assessment* and *compliance tracking*",
        ]}
        keyFeatures={[
          "**Model inventory management** with status tracking (Approved, Restricted, Pending, Blocked)",
          "*Risk assessment framework* with categories like Performance, Security, and Bias & Fairness",
          "*Advanced filtering* by status, risk category, risk level, and search functionality",
        ]}
        tips={[
          "Use *status filters* to focus on models that need approval or attention",
          "Categorize *model risks* to better understand different types of potential issues",
          "Set *target dates* for risk mitigation to track resolution progress",
        ]}
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
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          }
        />

        {/* Summary Cards */}
        {activeTab === "models" && (
          <div data-joyride-id="model-summary-cards">
            <ModelInventorySummary summary={summary} />
          </div>
        )}
        {activeTab === "model-risks" && (
          <ModelRiskSummary modelRisks={modelRisksData} />
        )}

        {/* Tab Bar */}
        <TabContext value={activeTab}>
          <Box
            sx={{ borderBottom: 1, borderColor: "divider", marginBottom: 3 }}
          >
            <TabList
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={aiTrustCenterTabListStyle}
              data-joyride-id="model-tabs"
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
              <Tab
                sx={aiTrustCenterTabStyle}
                label="MLFlow data"
                value="mlflow"
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
                <div data-joyride-id="model-status-filter">
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
                </div>

                {/* Expandable Search */}
                <Box sx={searchBoxStyle(isSearchBarVisible)} data-joyride-id="model-search">
                  <IconButton
                    disableRipple
                    disableFocusRipple
                    sx={{ "&:hover": { backgroundColor: "transparent" } }}
                    aria-label="Toggle search"
                    aria-expanded={isSearchBarVisible}
                    onClick={() => setIsSearchBarVisible((prev) => !prev)}
                  >
                    <SearchIcon size={16} />
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
              <div data-joyride-id="add-model-button">
                <CustomizableButton
                  variant="contained"
                  sx={addNewModelButtonStyle}
                  text="Add new model"
                  icon={<AddCircleOutlineIcon size={16} />}
                  onClick={handleNewModelInventoryClick}
                  isDisabled={isCreatingDisabled}
                />
              </div>
            </Stack>

            <ModelInventoryTable
              key={tableKey}
              data={filteredData}
              isLoading={isLoading}
              onEdit={handleEditModelInventory}
              onDelete={handleDeleteModelInventory}
              onCheckModelHasRisks={handleCheckModelHasRisks}
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
                <div data-joyride-id="risk-category-filter">
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
                </div>
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
                <SelectComponent
                  id="risk-status-filter"
                  value={modelRiskStatusFilter}
                  items={[
                    { _id: "active", name: "Active only" },
                    { _id: "all", name: "Active + deleted" },
                    { _id: "deleted", name: "Deleted only" },
                  ]}
                  onChange={handleModelRiskStatusFilterChange}
                  sx={statusFilterSelectStyle}
                  customRenderValue={(value, selectedItem) => {
                    if (value === "active") {
                      return selectedItem.name;
                    }
                    return `Status: ${selectedItem.name.toLowerCase()}`;
                  }}
                />
              </Stack>
              <div data-joyride-id="add-model-risk-button">
                <CustomizableButton
                  variant="contained"
                  sx={addNewModelButtonStyle}
                  text="Add model risk"
                  icon={<AddCircleOutlineIcon size={16} />}
                  onClick={handleNewModelRiskClick}
                  isDisabled={isCreatingDisabled}
                />
              </div>
            </Stack>

            <ModelRisksTable
              data={filteredModelRisks}
              isLoading={isModelRisksLoading}
              onEdit={handleEditModelRisk}
              onDelete={handleDeleteModelRisk}
              deletingId={deletingModelRiskId}
              users={users}
              models={modelInventoryData}
            />
          </>
        )}

        {activeTab === "mlflow" && (
          <MLFlowDataTable />
        )}
      </Stack>

      <NewModelInventory
        isOpen={isNewModelInventoryModalOpen}
        setIsOpen={handleCloseModal}
        onSuccess={handleModelInventorySuccess}
        onError={handleModelInventoryError}
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
                reference_link: selectedModelInventory.reference_link || "",
                biases: selectedModelInventory.biases || "",
                limitations: selectedModelInventory.limitations || "",
                hosting_provider: selectedModelInventory.hosting_provider || "",
                used_in_projects: selectedModelInventory.used_in_projects,
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
                risk_name: selectedModelRisk.risk_name || "",
                risk_category: selectedModelRisk.risk_category,
                risk_level: selectedModelRisk.risk_level,
                status: selectedModelRisk.status,
                owner: selectedModelRisk.owner,
                target_date: selectedModelRisk.target_date
                  ? new Date(selectedModelRisk.target_date)
                      .toISOString()
                      .split("T")[0]
                  : new Date().toISOString().split("T")[0],
                description: selectedModelRisk.description || "",
                mitigation_plan: selectedModelRisk.mitigation_plan || "",
                impact: selectedModelRisk.impact || "",
                model_id: selectedModelRisk.model_id,
              }
            : undefined
        }
        isEdit={!!selectedModelRisk}
      />

      <PageTour steps={ModelInventorySteps} run={true} tourKey="model-inventory-tour" />
    </Stack>
  );
};

export default ModelInventory;
