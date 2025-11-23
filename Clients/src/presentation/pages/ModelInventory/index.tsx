/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { CirclePlus as AddCircleOutlineIcon, TrendingUp } from "lucide-react";
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
import { apiServices } from "../../../infrastructure/api/networkServices";
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
import AnalyticsDrawer from "../../components/AnalyticsDrawer";
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
  evidenceTypeFilterSelectStyle,
} from "./style";
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";
import SelectComponent from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import TabContext from "@mui/lab/TabContext";
import { SearchBox } from "../../components/Search";
import TabBar from "../../components/TabBar";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";
import { EvidenceType } from "../../../domain/enums/evidenceHub.enum";
import { EvidenceHubModel } from "../../../domain/models/Common/evidenceHub/evidenceHub.model";
import NewEvidenceHub from "../../components/Modals/EvidenceHub";
import { createEvidenceHub } from "../../../application/repository/evidenceHub.repository";
import EvidenceHubTable from "./evidenceHubTable";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";

const Alert = React.lazy(() => import("../../components/Alert"));

// Constants
const REDIRECT_DELAY_MS = 2000;

const ModelInventory: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [modelInventoryData, setModelInventoryData] = useState<
    IModelInventory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModelInventoryModalOpen, setIsNewModelInventoryModalOpen] =
    useState(false);
 
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


  // MLFlow data state
  const [mlflowData, setMlflowData] = useState<any[]>([]);
  const [isMlflowLoading, setIsMlflowLoading] = useState(false);
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
  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // GroupBy state - models tab
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  // GroupBy state - model risks tab
  const { groupBy: groupByRisk, groupSortOrder: groupSortOrderRisk, handleGroupChange: handleGroupChangeRisk } = useGroupByState();

  // GroupBy state - evidence hub tab
  const { groupBy: groupByEvidence, groupSortOrder: groupSortOrderEvidence, handleGroupChange: handleGroupChangeEvidence } = useGroupByState();

    const [evidenceHubData, setEvidenceHubData] = useState<EvidenceHubModel[]>([]);

    // Selected row for View/Edit modal
    const [selectedEvidenceHub, setSelectedEvidenceHub] = useState<EvidenceHubModel | null>(null);

    // Modal open/close flag
    const [isEvidenceHubModalOpen, setIsEvidenceHubModalOpen] = useState(false);

    // Filters
    const [evidenceTypeFilter, setEvidenceTypeFilter] = useState("all");
    const [searchTypeTerm, setSearchTypeTerm] = useState("");

    const [isEvidenceLoading, setEvidenceLoading] = useState(false);

    const [ deletingEvidenceId, setDeletingEvidenceId] = useState<number | null>(
      null
    );

  // Determine the active tab based on the URL
  const getInitialTab = () => {
    const currentPath = location.pathname;
    if (currentPath.includes("model-risks")) return "model-risks";
    if (currentPath.includes("mlflow")) return "mlflow";
    if (currentPath.includes("evidence-hub")) return "evidence-hub";
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

  // Define how to get the group key for each model
  const getModelInventoryGroupKey = (model: IModelInventory, field: string): string | string[] => {
    switch (field) {
      case 'provider':
        return model.provider || 'Unknown Provider';
      case 'status':
        return model.status || 'Unknown Status';
      case 'security_assessment':
        return model.security_assessment ? 'Assessed' : 'Not Assessed';
      case 'hosting_provider':
        return model.hosting_provider || 'Unknown Hosting';
      case 'approver':
        if (model.approver) {
          const user = users.find((u: any) => u.id === Number(model.approver));
          return user ? `${user.name} ${user.surname}`.trim() : 'Unknown';
        }
        return 'No Approver';
      default:
        return 'Other';
    }
  };

  // Apply grouping to filtered data
  const groupedModelInventory = useTableGrouping({
    data: filteredData,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getModelInventoryGroupKey,
  });

   // Function to fetch evidence data
   const fetchEvidenceData = async (showLoading = true) => {
    if (showLoading) {
      setEvidenceLoading(true);
    }
    try {
      const response = await getAllEntities({ routeUrl: "/evidenceHub" });
      if (response?.data) {
        setEvidenceHubData(response.data);
        if (showLoading) {
          setTableKey((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching evidence data:", error);
      logEngine({
        type: "error",
        message: `Failed to fetch evidence data: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to load evidence data. Please try again later.",
      });
      setShowAlert(true);
    } finally {
      if (showLoading) {
        setEvidenceLoading(false);
      }
    }
  };

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

  // Function to fetch MLFlow data
  const fetchMLFlowData = async () => {
    setIsMlflowLoading(true);
    try {
      const response = await apiServices.get<any[]>("/integrations/mlflow/models");
      if (response.data && Array.isArray(response.data)) {
        setMlflowData(response.data);
      } else {
        setMlflowData([]);
      }
    } catch (error) {
      console.error("Error fetching MLFlow data:", error);
      setMlflowData([]);
    } finally {
      setIsMlflowLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInventoryData();
    fetchModelRisksData();
    fetchMLFlowData();
    fetchUsersData();
    fetchEvidenceData();
  }, []);

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
    // if (location.state?.openCreateModal) {
    //   setIsNewModelInventoryModalOpen(true);
    //   setSelectedModelInventory(null);
    if (location.state?.openCreateModal && !isLoading) {
      // Check if we're on the model-risks tab
      if (activeTab === "model-risks") {
        // Check if there are any models
        if (modelInventoryData.length === 0) {
          setAlert({
            variant: "info",
            title: "No models available",
            body: "Please create a model first before adding model risks. Redirecting to models tab...",
          });
          // Redirect to models tab
          setTimeout(() => {
            navigate("/model-inventory");
            setIsNewModelInventoryModalOpen(true);
            setSelectedModelInventory(null);
            // setSelectedModelInventoryId(null);
          }, REDIRECT_DELAY_MS);
        } else {
          setIsNewModelRiskModalOpen(true);
        }
      } else {
        setIsNewModelInventoryModalOpen(true);
        setSelectedModelInventory(null);
        // setSelectedModelInventoryId(null);
      }

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Dependencies: location.state triggers the effect when openCreateModal is passed via navigation
    // navigate, location.pathname are needed for state clearing
    // activeTab, modelInventoryData.length, isLoading determine which modal to open or if validation is needed
  }, [location.state, navigate, location.pathname, activeTab, modelInventoryData.length, isLoading]);

  const handleNewModelInventoryClick = () => {
    setSelectedModelInventory(null);
    setIsNewModelInventoryModalOpen(true);
  };

  const handleNewUploadEvidenceClick = () => {
    setIsEvidenceHubModalOpen(true);
    setSelectedEvidenceHub(null);
  };

  const handleAddEvidence = () => {
    setIsEvidenceHubModalOpen(true);
    setSelectedEvidenceHub(null);
  };

  const handleEditModelInventory = async (id: string) => {
    try {
      // Fetch the model inventory data first
      const response = await getEntityById({
        routeUrl: `/modelInventory/${id}`,
      });
      if (response?.data) {
        setSelectedModelInventory(response.data);
        // Only open modal after data is loaded
        setIsNewModelInventoryModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching model inventory details:", error);
      setAlert({
        variant: "error",
        body: "Failed to load model inventory details. Please try again.",
      });
    }
  };

  const handleEditEvidence = async (id: number) => {
    try {
      // Fetch the model inventory data first
      const response = await getEntityById({
        routeUrl: `/evidenceHub/${id}`,
      });
      if (response?.data) {
        setSelectedEvidenceHub(response.data || null); // if row provided = edit, else new
       setIsEvidenceHubModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching evidence model details:", error);
      setAlert({
        variant: "error",
        body: "Failed to load evidence model details. Please try again.",
      });
    }
  };

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
  };

  const handleClosEvidenceModal = () => {
    setSelectedEvidenceHub(null);
    setIsEvidenceHubModalOpen(false);
  };

  const handleModelInventorySuccess = async (formData: any) => {
    if (selectedModelInventory) {
      // Update existing model inventory
      // Check if projects or frameworks are being deleted
      const oldProjects = selectedModelInventory.projects || [];
      const newProjects = formData.projects || [];
      const oldFrameworks = selectedModelInventory.frameworks || [];
      const newFrameworks = formData.frameworks || [];

      const deleteProjects = oldProjects.length > 0 && newProjects.length === 0;
      const deleteFrameworks = oldFrameworks.length > 0 && newFrameworks.length === 0;

      await updateEntityById({
        routeUrl: `/modelInventory/${selectedModelInventory.id}`,
        body: {
          ...formData,
          deleteProjects,
          deleteFrameworks,
        },
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

  const handleEvidenceUploadModalError = (error: any) => {
    console.error("Evidence operation error:", error);
  
    let errorMessage = selectedEvidenceHub
      ? "Failed to update evidence. Please try again."
      : "Failed to add new evidence. Please try again.";
  
    let errorData = null;
  
    if (error?.response?.data) {
      errorData = error.response.data;
    } else if (error?.response) {
      errorData = error.response;
    } else if (error?.status && error?.errors) {
      errorData = error;
    }
  
    if (errorData) {
      if (errorData.status === "error" && Array.isArray(errorData.errors)) {
        const validationMessages = errorData.errors
          .map((err: any) => err.message || "Validation error")
          .join(", ");
        errorMessage = validationMessages;
      } else if (errorData.message) {
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

  const handleDeleteEvidence = async (
    id: number
  ) => {
    try {
      setDeletingEvidenceId(id);

      // Optimistically remove the item from the local state
      setEvidenceHubData((prevData) =>
        prevData.filter((item) => item.id !== id)
      );

      // Perform the actual delete operation
      await deleteEntityById({ routeUrl: `/evidenceHub/${id}` });

      // Fetch fresh data to ensure consistency
      await fetchEvidenceData(false);

      setAlert({
        variant: "success",
        body: "Evidence deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting evidence:", error);

      // If delete failed, revert the optimistic update
      await fetchEvidenceData(false);

      setAlert({
        variant: "error",
        body: "Failed to delete evidence. Please try again.",
      });
    } finally {
      setDeletingEvidenceId(null);
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

  const evidenceTypeOptions = [
    { _id: "all", name: "All evidence type" },
    { _id: EvidenceType.MODEL_CARD, name: "Model Card" },
    { _id: EvidenceType.RISK_ASSESSMENT_REPORT, name: "Risk Assessment Report" },
    { _id: EvidenceType.BIAS_AND_FAIRNESS_REPORT, name: "Bias and Fairness Report" },
    { _id: EvidenceType.SECURITY_ASSESSMENT_REPORT, name: "Security Assessment Report" },
    { _id: EvidenceType.DATA_PROTECTION_IMPACT_ASSESSMENT, name: "Data Protection Impact Assessment" },
    { _id: EvidenceType.ROBUSTNESS_AND_STRESS_TEST_REPORT, name: "Robustness and Stress Test Report" },
    { _id: EvidenceType.EVALUATION_METRICS_SUMMARY, name: "Evaluation Metrics Summary" },
    { _id: EvidenceType.HUMAN_OVERSIGHT_PLAN, name: "Human Oversight Plan" },
    { _id: EvidenceType.POST_MARKET_MONITORING_PLAN, name: "Post-Market Monitoring Plan" },
    { _id: EvidenceType.VERSION_CHANGE_LOG, name: "Version Change Log" },
    { _id: EvidenceType.THIRD_PARTY_AUDIT_REPORT, name: "Third-Party Audit Report" },
    { _id: EvidenceType.CONFORMITY_ASSESSMENT_REPORT, name: "Conformity Assessment Report" },
    { _id: EvidenceType.TECHNICAL_FILE, name: "Technical File / CE Documentation" },
    { _id: EvidenceType.VENDOR_MODEL_DOCUMENTATION, name: "Vendor Model Documentation" },
    { _id: EvidenceType.INTERNAL_APPROVAL_RECORD, name: "Internal Approval Record" },
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

  // Define how to get the group key for each model risk
  const getModelRiskGroupKey = (risk: any, field: string): string | string[] => {
    switch (field) {
      case 'risk_category':
        return risk.risk_category || 'Unknown';
      case 'risk_level':
        return risk.risk_level || 'Unknown';
      case 'status':
        return risk.status || 'Unknown';
      case 'owner':
        if (risk.owner) {
          const user = users.find((u) => u.id == risk.owner);
          return user ? `${user.name} ${user.surname}`.trim() : 'Unknown';
        }
        return 'Unassigned';
      case 'model_name':
        if (risk.model_id) {
          const model = modelInventoryData.find((m) => m.id == risk.model_id);
          return model?.model || 'Unknown Model';
        }
        return 'No Model';
      default:
        return 'Other';
    }
  };

  // Apply grouping to filtered model risks
  const groupedModelRisks = useTableGrouping({
    data: filteredModelRisks,
    groupByField: groupByRisk,
    sortOrder: groupSortOrderRisk,
    getGroupKey: getModelRiskGroupKey,
  });

  const filteredEvidenceHub = useMemo(() => {
    let filtered = evidenceHubData;
  
    if (evidenceTypeFilter && evidenceTypeFilter !== "all") {
      filtered = filtered.filter(
        (e) => e.evidence_type === evidenceTypeFilter
      );
    }
  
    if (searchTypeTerm?.trim()) {
      const lower = searchTypeTerm.toLowerCase();
      filtered = filtered.filter((e) =>
        e.evidence_name?.toLowerCase().includes(lower)
      );
    }
  
    return filtered;
  }, [evidenceHubData, evidenceTypeFilter, searchTypeTerm]);

  // Define how to get the group key for each evidence
  const getEvidenceGroupKey = (evidence: any, field: string): string | string[] => {
    switch (field) {
      case 'evidence_type':
        return evidence.evidence_type || 'Unknown';
      case 'uploaded_by':
        if (evidence.uploaded_by) {
          const user = users.find((u) => u.id == evidence.uploaded_by);
          return user ? `${user.name} ${user.surname}`.trim() : 'Unknown';
        }
        return 'Unknown';
      case 'model':
        if (evidence.model_id) {
          const model = modelInventoryData.find((m) => m.id == evidence.model_id);
          return model?.model || 'Unknown Model';
        }
        return 'No Model';
      default:
        return 'Other';
    }
  };

  // Apply grouping to filtered evidence hub
  const groupedEvidenceHub = useTableGrouping({
    data: filteredEvidenceHub,
    groupByField: groupByEvidence,
    sortOrder: groupSortOrderEvidence,
    getGroupKey: getEvidenceGroupKey,
  });

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

  const handleEvidenceUploadModalSuccess = async (formData: EvidenceHubModel) => {
    try {
      if (selectedEvidenceHub) {
        // Update existing Evidence
        await updateEntityById({
          routeUrl: `/evidenceHub/${selectedEvidenceHub.id}`,
          body: formData,
        });
  
        setEvidenceHubData((prev) =>
          prev.map((item) =>
            item.id === selectedEvidenceHub.id ? formData : item
          )
        );
  
        setAlert({
          variant: "success",
          body: "Evidence updated successfully!",
        });
      } else {

        // Create new Evidence
        const response = await createEvidenceHub("/evidenceHub", formData);
        console.log("response", response)

        if (response?.data) {
          setEvidenceHubData((prev) => [...prev, response.data]);
        } else {
          setEvidenceHubData((prev) => [...prev, formData]);
        }

        await fetchEvidenceData();
  
        setAlert({
          variant: "success",
          body: "New evidence added successfully!",
        });
      }
  
      // Close the modal and clear selected evidence
      setSelectedEvidenceHub(null);
      setIsEvidenceHubModalOpen(false);
    } catch (error) {
  
      setAlert({
        variant: "error",
        body: selectedEvidenceHub
          ? "Failed to update evidence. Please try again."
          : "Failed to add new evidence. Please try again.",
      });
    }
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

  const handleEvidenceTypeFilterChange = (event: any) => {
    setEvidenceTypeFilter(event.target.value);
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
    } else if (newValue === "evidence-hub") {
      navigate("/model-inventory/evidence-hub");
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
                          onClick={() =>
                              setIsHelperDrawerOpen(!isHelperDrawerOpen)
                          }
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
                  <Box sx={{ marginBottom: 3 }}>
                      <TabBar
                          tabs={[
                              {
                                  label: "Models",
                                  value: "models",
                                  icon: "Box",
                                  count: modelInventoryData.length,
                                  isLoading: isLoading,
                              },
                              {
                                  label: "Model risks",
                                  value: "model-risks",
                                  icon: "AlertTriangle",
                                  count: modelRisksData.length,
                                  isLoading: isModelRisksLoading,
                              },
                              {
                                  label: "MLFlow data",
                                  value: "mlflow",
                                  icon: "Database",
                                  count: mlflowData.length,
                                  isLoading: isMlflowLoading,
                              },
                              {
                                  label: "Evidence hub",
                                  value: "evidence-hub",
                                  icon: "Database",
                                  count: evidenceHubData.length,
                                  isLoading: isEvidenceLoading,
                              },
                          ]}
                          activeTab={activeTab}
                          onChange={handleTabChange}
                          dataJoyrideId="model-tabs"
                      />
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
                          <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                          >
                              <div data-joyride-id="model-status-filter">
                                  <SelectComponent
                                      id="status-filter"
                                      value={statusFilter}
                                      items={statusFilterOptions}
                                      onChange={handleStatusFilterChange}
                                      sx={statusFilterSelectStyle}
                                      customRenderValue={(
                                          value,
                                          selectedItem
                                      ) => {
                                          if (value === "all") {
                                              return selectedItem.name;
                                          }
                                          return `Status: ${selectedItem.name.toLowerCase()}`;
                                      }}
                                  />
                              </div>

                              {/* Search */}
                              <Box
                                  sx={{ width: 300 }}
                                  data-joyride-id="model-search"
                              >
                                  <SearchBox
                                      placeholder="Search models..."
                                      value={searchTerm}
                                      onChange={setSearchTerm}
                                      inputProps={{
                                          "aria-label": "Search models",
                                      }}
                                  />
                              </Box>

                              <GroupBy
                                  options={[
                                      { id: 'provider', label: 'Provider' },
                                      { id: 'status', label: 'Status' },
                                      { id: 'security_assessment', label: 'Security Assessment' },
                                      { id: 'hosting_provider', label: 'Hosting Provider' },
                                      { id: 'approver', label: 'Approver' },
                                  ]}
                                  onGroupChange={handleGroupChange}
                              />
                          </Stack>

                          {/* Right side: Analytics & Add Model buttons */}
                          <Stack direction="row" spacing={2}>
                              <CustomizableButton
                                  variant="contained"
                                  onClick={() => setIsAnalyticsDrawerOpen(true)}
                                  sx={addNewModelButtonStyle}
                                  icon={<TrendingUp size={16} />}
                                  text="Analytics"
                              />
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
                      </Stack>

                      <GroupedTableView
                          groupedData={groupedModelInventory}
                          ungroupedData={filteredData}
                          renderTable={(data, options) => (
                              <ModelInventoryTable
                                  key={tableKey}
                                  data={data}
                                  isLoading={isLoading}
                                  onEdit={handleEditModelInventory}
                                  onDelete={handleDeleteModelInventory}
                                  onCheckModelHasRisks={handleCheckModelHasRisks}
                                  deletingId={deletingId}
                                  hidePagination={options?.hidePagination}
                              />
                          )}
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
                                          {
                                              _id: "all",
                                              name: "All categories",
                                          },
                                          {
                                              _id: "Performance",
                                              name: "Performance",
                                          },
                                          {
                                              _id: "Bias & Fairness",
                                              name: "Bias & Fairness",
                                          },
                                          { _id: "Security", name: "Security" },
                                          {
                                              _id: "Data Quality",
                                              name: "Data Quality",
                                          },
                                          {
                                              _id: "Compliance",
                                              name: "Compliance",
                                          },
                                      ]}
                                      onChange={
                                          handleModelRiskCategoryFilterChange
                                      }
                                      sx={statusFilterSelectStyle}
                                      customRenderValue={(
                                          value,
                                          selectedItem
                                      ) => {
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
                              <GroupBy
                                  options={[
                                      { id: 'risk_category', label: 'Category' },
                                      { id: 'risk_level', label: 'Risk level' },
                                      { id: 'status', label: 'Status' },
                                      { id: 'model_name', label: 'Model' },
                                      { id: 'owner', label: 'Owner' },
                                  ]}
                                  onGroupChange={handleGroupChangeRisk}
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

                      <GroupedTableView
                          groupedData={groupedModelRisks}
                          ungroupedData={filteredModelRisks}
                          renderTable={(data, options) => (
                              <ModelRisksTable
                                  data={data}
                                  isLoading={isModelRisksLoading}
                                  onEdit={handleEditModelRisk}
                                  onDelete={handleDeleteModelRisk}
                                  deletingId={deletingModelRiskId}
                                  users={users}
                                  models={modelInventoryData}
                                  hidePagination={options?.hidePagination}
                              />
                          )}
                      />
                  </>
              )}

              {activeTab === "mlflow" && <MLFlowDataTable />}

              {activeTab === "evidence-hub" && (
                  <>
                      <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={filterButtonRowStyle}
                      >
                          {/* Left side: Search + evidence Type Filter */}
                          <Stack
                              direction="row"
                              spacing={6}
                              alignItems="center"
                          >
                              {/* Search */}
                              <Box
                                  sx={{ width: 300 }}
                                  data-joyride-id="evidence-search"
                              >
                                  <SearchBox
                                      placeholder="Search evidence..."
                                      value={searchTypeTerm}
                                      onChange={setSearchTypeTerm}
                                      inputProps={{
                                          "aria-label": "Search evidence",
                                      }}
                                  />
                              </Box>
                              <div data-joyride-id="evidence-type-filter">
                                  <SelectComponent
                                      id="type-filter"
                                      value={evidenceTypeFilter}
                                      items={evidenceTypeOptions}
                                      onChange={handleEvidenceTypeFilterChange}
                                      sx={evidenceTypeFilterSelectStyle}
                                      customRenderValue={(value, selectedItem) => {
                                        if (!selectedItem) return "Select Evidence Type";
                                        return value === "all"
                                          ? selectedItem.name
                                          : `evidence: ${selectedItem.name.toLowerCase()}`;
                                      }}


                                  />
                              </div>
                              <GroupBy
                                  options={[
                                      { id: 'evidence_type', label: 'Evidence type' },
                                      { id: 'uploaded_by', label: 'Uploaded by' },
                                      { id: 'model', label: 'Model' },
                                  ]}
                                  onGroupChange={handleGroupChangeEvidence}
                              />
                          </Stack>

                          {/* Right side: Add Upload Evidence */}
                          <Stack direction="row" spacing={2}>
                              <div data-joyride-id="add-model-button">
                                  <CustomizableButton
                                      variant="contained"
                                      sx={addNewModelButtonStyle}
                                      text="Upload evidence"
                                      icon={<AddCircleOutlineIcon size={16} />}
                                      onClick={handleNewUploadEvidenceClick}
                                      isDisabled={isCreatingDisabled}
                                  />
                              </div>
                          </Stack>
                      </Stack>

                      <GroupedTableView
                          groupedData={groupedEvidenceHub}
                          ungroupedData={filteredEvidenceHub}
                          renderTable={(data, options) => (
                              <EvidenceHubTable
                                  key={tableKey}
                                  isLoading={isLoading}
                                  data={data}
                                  onEdit={handleEditEvidence}
                                  onDelete={handleDeleteEvidence}
                                  modelInventoryData={modelInventoryData}
                                  deletingId={deletingEvidenceId}
                                  hidePagination={options?.hidePagination}
                              />
                          )}
                      />
                  </>
              )}
          </Stack>

          {/* Analytics Drawer */}
          <AnalyticsDrawer
              open={isAnalyticsDrawerOpen}
              onClose={() => setIsAnalyticsDrawerOpen(false)}
              title="Analytics & Trends"
              description="Track your model inventory history over time"
              entityName="Model"
              availableParameters={[
                  { value: "status", label: "Status" },
                  // Add more parameters here as needed
              ]}
              defaultParameter="status"
          />

          <NewModelInventory
              isOpen={isNewModelInventoryModalOpen}
              setIsOpen={handleCloseModal}
              onSuccess={handleModelInventorySuccess}
              onError={handleModelInventoryError}
              selectedModelInventoryId={selectedModelInventory?.id}
              evidenceData={evidenceHubData}
              handleEditEvidence={handleEditEvidence}
              handleDeleteEvidence={handleDeleteEvidence}
              handleAddEvidence={handleAddEvidence}
              modelInventoryData={modelInventoryData}
              initialData={
                  selectedModelInventory
                      ? {
                            provider_model:
                                selectedModelInventory.provider_model || "",
                            provider: selectedModelInventory.provider || "",
                            model: selectedModelInventory.model || "",
                            version: selectedModelInventory.version || "",
                            approver: selectedModelInventory.approver,
                            capabilities: selectedModelInventory.capabilities,
                            security_assessment:
                                selectedModelInventory.security_assessment,
                            status: selectedModelInventory.status,
                            status_date: selectedModelInventory.status_date
                                ? new Date(selectedModelInventory.status_date)
                                      .toISOString()
                                      .split("T")[0]
                                : new Date().toISOString().split("T")[0],
                            reference_link:
                                selectedModelInventory.reference_link || "",
                            biases: selectedModelInventory.biases || "",
                            limitations:
                                selectedModelInventory.limitations || "",
                            hosting_provider:
                                selectedModelInventory.hosting_provider || "",
                            projects: selectedModelInventory.projects || [],
                            frameworks: selectedModelInventory.frameworks || [],
                            security_assessment_data:
                                selectedModelInventory.security_assessment_data ||
                                [],
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
                            mitigation_plan:
                                selectedModelRisk.mitigation_plan || "",
                            impact: selectedModelRisk.impact || "",
                            model_id: selectedModelRisk.model_id,
                        }
                      : undefined
              }
              isEdit={!!selectedModelRisk}
          />

          <NewEvidenceHub
              isOpen={isEvidenceHubModalOpen}
              setIsOpen={handleClosEvidenceModal}
              onSuccess={handleEvidenceUploadModalSuccess}
              onError={handleEvidenceUploadModalError}
              isEdit={!!selectedEvidenceHub}
              initialData={selectedEvidenceHub || undefined}
          />

          <PageTour
              steps={ModelInventorySteps}
              run={true}
              tourKey="model-inventory-tour"
          />
      </Stack>
  );
};

export default ModelInventory;