/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  Suspense,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Box,
  Stack,
  Fade,
  Modal,
  Typography,
  Button,
  useTheme,
  IconButton,
} from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { CirclePlus as AddCircleOutlineIcon, BarChart3 } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";
import SelectComponent from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import TabContext from "@mui/lab/TabContext";
import { SearchBox } from "../../components/Search";
import TipBox from "../../components/TipBox";
import TabBar from "../../components/TabBar";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";
import { EvidenceHubModel } from "../../../domain/models/Common/evidenceHub/evidenceHub.model";
import NewEvidenceHub from "../../components/Modals/EvidenceHub";
import { createEvidenceHub } from "../../../application/repository/evidenceHub.repository";
import EvidenceHubTable from "./evidenceHubTable";
import ShareButton from "../../components/ShareViewDropdown/ShareButton";
import ShareViewDropdown, {
  ShareViewSettings,
} from "../../components/ShareViewDropdown";
import {
  useCreateShareLink,
  useUpdateShareLink,
} from "../../../application/hooks/useShare";
import { GroupBy } from "../../components/Table/GroupBy";
import {
  useTableGrouping,
  useGroupByState,
} from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import { ExportMenu } from "../../components/Table/ExportMenu";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";

const Alert = React.lazy(() => import("../../components/Alert"));

// Constants
const REDIRECT_DELAY_MS = 2000;

const ModelInventory: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedUrlParam = useRef(false);
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
  const [modelRiskStatusFilter, setModelRiskStatusFilter] = useState<
    "active" | "deleted" | "all"
  >("active");
  const [deletingModelRiskId, setDeletingModelRiskId] = useState<number | null>(
    null
  );
  const [users, setUsers] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  // MLFlow data state
  const [mlflowData, setMlflowData] = useState<any[]>([]);
  const [isMlflowLoading, setIsMlflowLoading] = useState(false);

  const { userRoleName } = useAuth();
  const { trackDashboard, trackFeature, trackAIModel } = usePostHog();
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);
  const theme = useTheme();

  // Share link mutations
  const createShareMutation = useCreateShareLink();
  const updateShareMutation = useUpdateShareLink();

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // GroupBy state - models tab
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  // GroupBy state - model risks tab
  const {
    groupBy: groupByRisk,
    groupSortOrder: groupSortOrderRisk,
    handleGroupChange: handleGroupChangeRisk,
  } = useGroupByState();

  // GroupBy state - evidence hub tab
  const {
    groupBy: groupByEvidence,
    groupSortOrder: groupSortOrderEvidence,
    handleGroupChange: handleGroupChangeEvidence,
  } = useGroupByState();

  // Preselected model ID for evidence creation (used by change history feature)
  const [preselectedModelId, setPreselectedModelId] = useState<
    number | undefined
  >(undefined);

  // FilterBy - Dynamic options generators for Models tab
  const getUniqueProviders = useCallback(() => {
    const providers = new Set<string>();
    modelInventoryData.forEach((item) => {
      if (item.provider) {
        providers.add(item.provider);
      }
    });
    return Array.from(providers)
      .sort()
      .map((provider) => ({ value: provider, label: provider }));
  }, [modelInventoryData]);

  const getUniqueApprovers = useCallback(() => {
    const approverIds = new Set<string>();
    modelInventoryData.forEach((item) => {
      if (item.approver) {
        approverIds.add(item.approver.toString());
      }
    });
    return Array.from(approverIds)
      .sort()
      .map((approverId) => {
        const user = users.find((u: any) => u.id.toString() === approverId);
        const userName = user
          ? `${user.name} ${user.surname}`.trim()
          : `User ${approverId}`;
        return { value: approverId, label: userName };
      });
  }, [modelInventoryData, users]);

  // FilterBy - Filter columns configuration for Models tab
  const modelFilterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: ModelInventoryStatus.APPROVED, label: "Approved" },
          { value: ModelInventoryStatus.RESTRICTED, label: "Restricted" },
          { value: ModelInventoryStatus.PENDING, label: "Pending" },
          { value: ModelInventoryStatus.BLOCKED, label: "Blocked" },
        ],
      },
      {
        id: "provider",
        label: "Provider",
        type: "select" as const,
        options: getUniqueProviders(),
      },
      {
        id: "model",
        label: "Model name",
        type: "text" as const,
      },
      {
        id: "approver",
        label: "Approver",
        type: "select" as const,
        options: getUniqueApprovers(),
      },
      {
        id: "security_assessment",
        label: "Security assessment",
        type: "select" as const,
        options: [
          { value: "true", label: "Assessed" },
          { value: "false", label: "Not assessed" },
        ],
      },
    ],
    [getUniqueProviders, getUniqueApprovers]
  );

  // FilterBy - Field value getter for Models tab
  const getModelFieldValue = useCallback(
    (
      item: IModelInventory,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "status":
          return item.status;
        case "provider":
          return item.provider;
        case "model":
          return item.model;
        case "approver":
          return item.approver?.toString();
        case "security_assessment":
          return item.security_assessment ? "true" : "false";
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook for Models tab
  const {
    filterData: filterModelData,
    handleFilterChange: handleModelFilterChange,
  } = useFilterBy<IModelInventory>(getModelFieldValue);

  // FilterBy - Dynamic options generators for Model Risks tab
  const getUniqueRiskOwners = useCallback(() => {
    const ownerIds = new Set<string>();
    modelRisksData.forEach((item) => {
      if (item.owner) {
        ownerIds.add(item.owner.toString());
      }
    });
    return Array.from(ownerIds)
      .sort()
      .map((ownerId) => {
        const user = users.find((u: any) => u.id.toString() === ownerId);
        const userName = user
          ? `${user.name} ${user.surname}`.trim()
          : `User ${ownerId}`;
        return { value: ownerId, label: userName };
      });
  }, [modelRisksData, users]);

  const getUniqueRiskModels = useCallback(() => {
    const modelIds = new Set<string>();
    modelRisksData.forEach((item) => {
      if (item.model_id) {
        modelIds.add(item.model_id.toString());
      }
    });
    return Array.from(modelIds)
      .sort()
      .map((modelId) => {
        const model = modelInventoryData.find(
          (m: any) => m.id.toString() === modelId
        );
        const modelName = model ? model.model : `Model ${modelId}`;
        return { value: modelId, label: modelName };
      });
  }, [modelRisksData, modelInventoryData]);

  // FilterBy - Filter columns configuration for Model Risks tab
  const modelRiskFilterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "risk_name",
        label: "Risk name",
        type: "text" as const,
      },
      {
        id: "model_id",
        label: "Model name",
        type: "select" as const,
        options: getUniqueRiskModels(),
      },
      {
        id: "risk_category",
        label: "Category",
        type: "select" as const,
        options: [
          { value: "Performance", label: "Performance" },
          { value: "Bias & Fairness", label: "Bias & Fairness" },
          { value: "Security", label: "Security" },
          { value: "Data Quality", label: "Data Quality" },
          { value: "Compliance", label: "Compliance" },
        ],
      },
      {
        id: "risk_level",
        label: "Risk level",
        type: "select" as const,
        options: [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
          { value: "Critical", label: "Critical" },
        ],
      },
      {
        id: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "Open", label: "Open" },
          { value: "In Progress", label: "In Progress" },
          { value: "Resolved", label: "Resolved" },
          { value: "Accepted", label: "Accepted" },
        ],
      },
      {
        id: "owner",
        label: "Owner",
        type: "select" as const,
        options: getUniqueRiskOwners(),
      },
      {
        id: "target_date",
        label: "Target date",
        type: "date" as const,
      },
    ],
    [getUniqueRiskModels, getUniqueRiskOwners]
  );

  // FilterBy - Field value getter for Model Risks tab
  const getModelRiskFieldValue = useCallback(
    (
      item: IModelRisk,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "risk_name":
          return item.risk_name;
        case "model_id":
          return item.model_id?.toString();
        case "risk_category":
          return item.risk_category;
        case "risk_level":
          return item.risk_level;
        case "status":
          return item.status;
        case "owner":
          return item.owner?.toString();
        case "target_date":
          return item.target_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook for Model Risks tab
  const {
    filterData: filterModelRiskData,
    handleFilterChange: handleModelRiskFilterChange,
  } = useFilterBy<IModelRisk>(getModelRiskFieldValue);

  const [evidenceHubData, setEvidenceHubData] = useState<EvidenceHubModel[]>(
    []
  );

  // Selected row for View/Edit modal
  const [selectedEvidenceHub, setSelectedEvidenceHub] =
    useState<EvidenceHubModel | null>(null);

  // Modal open/close flag
  const [isEvidenceHubModalOpen, setIsEvidenceHubModalOpen] = useState(false);

  // Search term for Evidence Hub
  const [searchTypeTerm, setSearchTypeTerm] = useState("");

  // FilterBy - Dynamic options generators for Evidence Hub tab
  const getUniqueEvidenceUploaders = useCallback(() => {
    const uploaderIds = new Set<string>();
    evidenceHubData.forEach((item) => {
      const uploadedById = item.evidence_files?.[0]?.uploaded_by;
      if (uploadedById) {
        uploaderIds.add(uploadedById.toString());
      }
    });
    return Array.from(uploaderIds)
      .sort()
      .map((uploaderId) => {
        const user = users.find((u: any) => u.id.toString() === uploaderId);
        const userName = user
          ? `${user.name} ${user.surname}`.trim()
          : `User ${uploaderId}`;
        return { value: uploaderId, label: userName };
      });
  }, [evidenceHubData, users]);

  const getUniqueEvidenceModels = useCallback(() => {
    const modelIds = new Set<string>();
    evidenceHubData.forEach((item) => {
      if (item.mapped_model_ids) {
        item.mapped_model_ids.forEach((modelId) => {
          modelIds.add(modelId.toString());
        });
      }
    });
    return Array.from(modelIds)
      .sort()
      .map((modelId) => {
        const model = modelInventoryData.find(
          (m: any) => m.id.toString() === modelId
        );
        const modelName = model
          ? `${model.provider} - ${model.model}`
          : `Model ${modelId}`;
        return { value: modelId, label: modelName };
      });
  }, [evidenceHubData, modelInventoryData]);

  // FilterBy - Filter columns configuration for Evidence Hub tab
  const evidenceFilterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "evidence_name",
        label: "Evidence name",
        type: "text" as const,
      },
      {
        id: "evidence_type",
        label: "Evidence type",
        type: "select" as const,
        options: [
          { value: "Model Card", label: "Model Card" },
          { value: "Risk Assessment Report", label: "Risk Assessment Report" },
          {
            value: "Bias and Fairness Report",
            label: "Bias and Fairness Report",
          },
          {
            value: "Security Assessment Report",
            label: "Security Assessment Report",
          },
          {
            value: "Data Protection Impact Assessment",
            label: "Data Protection Impact Assessment",
          },
          {
            value: "Robustness and Stress Test Report",
            label: "Robustness and Stress Test Report",
          },
          {
            value: "Evaluation Metrics Summary",
            label: "Evaluation Metrics Summary",
          },
          { value: "Human Oversight Plan", label: "Human Oversight Plan" },
          {
            value: "Post-Market Monitoring Plan",
            label: "Post-Market Monitoring Plan",
          },
          { value: "Version Change Log", label: "Version Change Log" },
          {
            value: "Third-Party Audit Report",
            label: "Third-Party Audit Report",
          },
          {
            value: "Conformity Assessment Report",
            label: "Conformity Assessment Report",
          },
          {
            value: "Technical File / CE Documentation",
            label: "Technical File / CE Documentation",
          },
          {
            value: "Vendor Model Documentation",
            label: "Vendor Model Documentation",
          },
          {
            value: "Internal Approval Record",
            label: "Internal Approval Record",
          },
        ],
      },
      {
        id: "mapped_model_ids",
        label: "Mapped models",
        type: "select" as const,
        options: getUniqueEvidenceModels(),
      },
      {
        id: "uploaded_by",
        label: "Uploaded by",
        type: "select" as const,
        options: getUniqueEvidenceUploaders(),
      },
      {
        id: "expiry_date",
        label: "Expiry date",
        type: "date" as const,
      },
    ],
    [getUniqueEvidenceModels, getUniqueEvidenceUploaders]
  );

  // FilterBy - Field value getter for Evidence Hub tab
  const getEvidenceFieldValue = useCallback(
    (
      item: EvidenceHubModel,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "evidence_name":
          return item.evidence_name;
        case "evidence_type":
          return item.evidence_type;
        case "mapped_model_ids":
          // Return first mapped model ID for filtering (supports "is" operator)
          return item.mapped_model_ids?.[0]?.toString();
        case "uploaded_by":
          return item.evidence_files?.[0]?.uploaded_by?.toString();
        case "expiry_date":
          return item.expiry_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook for Evidence Hub tab
  const {
    filterData: filterEvidenceData,
    handleFilterChange: handleEvidenceFilterChange,
  } = useFilterBy<EvidenceHubModel>(getEvidenceFieldValue);

  const [isEvidenceLoading, setEvidenceLoading] = useState(false);

  const [deletingEvidenceId, setDeletingEvidenceId] = useState<number | null>(
    null
  );

  // Share view state
  const [shareAnchorEl, setShareAnchorEl] = useState<HTMLElement | null>(null);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [shareLinkId, setShareLinkId] = useState<number | null>(null);
  const [shareSettings, setShareSettings] = useState<ShareViewSettings>({
    shareAllFields: true,
    allowDataExport: true,
    allowViewersToOpenRecords: false,
    displayToolbar: true,
  });
  const [isShareEnabled, setIsShareEnabled] = useState(false);
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

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

  // Filter data using FilterBy and search
  const filteredData = useMemo(() => {
    // First apply FilterBy conditions
    let data = filterModelData(modelInventoryData);

    // Then apply search filter
    if (searchTerm) {
      data = data.filter(
        (item) =>
          item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.version?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  }, [filterModelData, modelInventoryData, searchTerm]);

  // Define how to get the group key for each model
  const getModelInventoryGroupKey = (
    model: IModelInventory,
    field: string
  ): string | string[] => {
    switch (field) {
      case "provider":
        return model.provider || "Unknown Provider";
      case "status":
        return model.status || "Unknown Status";
      case "security_assessment":
        return model.security_assessment ? "Assessed" : "Not Assessed";
      case "hosting_provider":
        return model.hosting_provider || "Unknown Hosting";
      case "approver":
        if (model.approver) {
          const user = users.find((u: any) => u.id === Number(model.approver));
          return user ? `${user.name} ${user.surname}`.trim() : "Unknown";
        }
        return "No Approver";
      default:
        return "Other";
    }
  };

  // Apply grouping to filtered data
  const groupedModelInventory = useTableGrouping({
    data: filteredData,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getModelInventoryGroupKey,
  });

  // Define export columns for model inventory table
  const exportColumns = useMemo(() => {
    return [
      { id: "provider", label: "Provider" },
      { id: "model", label: "Model" },
      { id: "version", label: "Version" },
      { id: "approver", label: "Approver" },
      { id: "security_assessment", label: "Security Assessment" },
      { id: "status", label: "Status" },
      { id: "status_date", label: "Status Date" },
    ];
  }, []);

  // Prepare export data - format the data for export
  const exportData = useMemo(() => {
    return filteredData.map((model: IModelInventory) => {
      const approverUser = users.find(
        (user: any) => user.id === model.approver
      );
      const approverName = approverUser
        ? `${approverUser.name} ${approverUser.surname}`
        : "-";

      return {
        provider: model.provider || "-",
        model: model.model || "-",
        version: model.version || "-",
        approver: approverName,
        security_assessment: model.security_assessment ? "Yes" : "No",
        status: model.status || "-",
        status_date: model.status_date || "-",
      };
    });
  }, [filteredData, users]);

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
  const fetchModelRisksData = async (
    showLoading = true,
    filter = modelRiskStatusFilter
  ) => {
    if (showLoading) {
      setIsModelRisksLoading(true);
    }
    try {
      const response = await getAllEntities({
        routeUrl: `/modelRisks?filter=${filter}`,
      });
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
      const response = await apiServices.get<{
        configured: boolean;
        models: any[];
      }>("/integrations/mlflow/models");
      if (response.data) {
        // Handle new response format: { configured: boolean, models: [] }
        if ("models" in response.data && Array.isArray(response.data.models)) {
          setMlflowData(response.data.models);
        } else if (Array.isArray(response.data)) {
          // Backwards compatibility: handle old format where response is directly an array
          setMlflowData(response.data as unknown as any[]);
        } else {
          setMlflowData([]);
        }
      } else {
        setMlflowData([]);
      }
    } catch (error) {
      // Only log unexpected errors, not "not configured" scenarios
      // The backend now handles "not configured" gracefully with 200 status
      setMlflowData([]);
    } finally {
      setIsMlflowLoading(false);
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
    fetchMLFlowData();
    fetchUsersData();
    fetchEvidenceData();
  }, []);

  // Refetch model risks when filter changes
  useEffect(() => {
    fetchModelRisksData(true, modelRiskStatusFilter);
  }, [modelRiskStatusFilter]);

  useEffect(() => {
    if (alert) {
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
        setTimeout(() => setAlert(null), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alert]);

  // Handle modelId and evidenceId URL params to open edit modal from Wise Search
  useEffect(() => {
    if (hasProcessedUrlParam.current || isLoading) return;

    const modelId = searchParams.get("modelId");
    const evidenceId = searchParams.get("evidenceId");

    if (modelId) {
      hasProcessedUrlParam.current = true;
      // Fetch model inventory and open edit modal
      getEntityById({ routeUrl: `/modelInventory/${modelId}` })
        .then((response) => {
          if (response?.data) {
            setSelectedModelInventory(response.data);
            setIsNewModelInventoryModalOpen(true);
            setSearchParams({}, { replace: true });
          }
        })
        .catch((err) => {
          console.error("Error fetching model from URL param:", err);
          setSearchParams({}, { replace: true });
        });
    } else if (evidenceId) {
      hasProcessedUrlParam.current = true;
      // Fetch evidence and open edit modal
      getEntityById({ routeUrl: `/evidenceHub/${evidenceId}` })
        .then((response) => {
          if (response?.data) {
            setSelectedEvidenceHub(response.data);
            setIsEvidenceHubModalOpen(true);
            setSearchParams({}, { replace: true });
          }
        })
        .catch((err) => {
          console.error("Error fetching evidence from URL param:", err);
          setSearchParams({}, { replace: true });
        });
    }
  }, [searchParams, isLoading, setSearchParams]);

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
  }, [
    location.state,
    navigate,
    location.pathname,
    activeTab,
    modelInventoryData.length,
    isLoading,
  ]);

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

    setSelectedModelInventory(null);
    setIsNewModelInventoryModalOpen(true);
  };

  const handleNewUploadEvidenceClick = () => {
    setIsEvidenceHubModalOpen(true);
    setSelectedEvidenceHub(null);
  };

  const handleAddEvidence = (modelId?: number) => {
    setIsEvidenceHubModalOpen(true);
    setSelectedEvidenceHub(null);
    setPreselectedModelId(modelId);
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
    setPreselectedModelId(undefined);
  };

  // Share view handlers
  const handleShareClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const generateShareableLink = async (
    settings: ShareViewSettings
  ): Promise<string> => {
    // Prevent concurrent link creation
    if (isCreatingLink) {
      console.log("Link creation already in progress, skipping...");
      return shareableLink;
    }

    try {
      setIsCreatingLink(true);

      // Create share link via API
      const result = await createShareMutation.mutateAsync({
        resource_type: "model",
        resource_id: 0, // 0 = share entire Model Inventory table view
        settings,
      });

      const link = result.data?.shareable_url || "";
      const id = result.data?.id || null;
      setShareableLink(link);
      setShareLinkId(id);
      return link;
    } catch (error) {
      console.error("Error generating share link:", error);
      setAlert({
        variant: "error",
        body: "Failed to generate share link. Please try again.",
      });
      return "";
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleShareEnabledChange = async (enabled: boolean) => {
    setIsShareEnabled(enabled);
    if (enabled && !shareableLink) {
      await generateShareableLink(shareSettings);
    }
  };

  const handleShareSettingsChange = async (settings: ShareViewSettings) => {
    setShareSettings(settings);

    // If we have an existing share link, update its settings
    if (shareLinkId) {
      try {
        await updateShareMutation.mutateAsync({
          id: shareLinkId,
          settings,
        });
        setAlert({
          variant: "success",
          body: "Share link settings updated!",
        });
      } catch (error) {
        console.error("Error updating share link settings:", error);
        setAlert({
          variant: "error",
          body: "Failed to update settings. Please try again.",
        });
      }
    }
  };

  const handleCopyLink = (link: string) => {
    console.log("Link copied:", link);
    setAlert({
      variant: "success",
      body: "Share link copied to clipboard!",
    });
  };

  const handleRefreshLink = () => {
    // Show confirmation dialog
    setShowReplaceConfirmation(true);
  };

  const handleConfirmReplace = async () => {
    setShowReplaceConfirmation(false);

    try {
      // Fetch ALL existing share links for this resource and disable them
      console.log("Fetching all share links for model/0...");
      const existingLinksResponse: any = await apiServices.get(
        "/shares/model/0"
      );
      const existingLinks = existingLinksResponse?.data?.data || [];

      console.log(
        `Found ${existingLinks.length} existing share links:`,
        existingLinks
      );

      // Disable all existing links
      let disabledCount = 0;
      for (const link of existingLinks) {
        console.log(
          `Processing link ID ${link.id}: is_enabled=${link.is_enabled}, share_token=${link.share_token}`
        );

        if (link.is_enabled) {
          console.log(`Attempting to disable share link ID: ${link.id}`);
          try {
            const updateResult = await updateShareMutation.mutateAsync({
              id: link.id,
              is_enabled: false,
            });
            console.log(
              `Successfully disabled link ID ${link.id}. Update result:`,
              updateResult
            );
            disabledCount++;
          } catch (updateError) {
            console.error(`Failed to disable link ID ${link.id}:`, updateError);
            throw updateError;
          }
        } else {
          console.log(`Link ID ${link.id} is already disabled, skipping`);
        }
      }

      console.log(
        `All previous links disabled. Total disabled: ${disabledCount}`
      );

      // Create a new link
      console.log("Creating new share link...");
      const newLink = await generateShareableLink(shareSettings);
      console.log("New share link created:", newLink);

      setAlert({
        variant: "success",
        body: `Share link replaced successfully! ${disabledCount} previous link(s) invalidated.`,
      });
    } catch (error) {
      console.error("Error replacing share link:", error);
      setAlert({
        variant: "error",
        body: "Failed to replace share link. Please try again.",
      });
    }
  };

  const handleOpenLink = (link: string) => {
    console.log("Opening link:", link);
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
      const deleteFrameworks =
        oldFrameworks.length > 0 && newFrameworks.length === 0;

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
      if (
        errorData.status === "error" &&
        errorData.errors &&
        Array.isArray(errorData.errors)
      ) {
        const validationMessages = errorData.errors
          .map((err: any) => {
            return err.message || "Validation error";
          })
          .join(", ");

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

  const handleDeleteEvidence = async (id: number) => {
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

  // Filter model risks using FilterBy
  const filteredModelRisks = useMemo(() => {
    return filterModelRiskData(modelRisksData);
  }, [filterModelRiskData, modelRisksData]);

  // Define how to get the group key for each model risk
  const getModelRiskGroupKey = (
    risk: any,
    field: string
  ): string | string[] => {
    switch (field) {
      case "risk_category":
        return risk.risk_category || "Unknown";
      case "risk_level":
        return risk.risk_level || "Unknown";
      case "status":
        return risk.status || "Unknown";
      case "owner":
        if (risk.owner) {
          const user = users.find((u) => u.id == risk.owner);
          return user ? `${user.name} ${user.surname}`.trim() : "Unknown";
        }
        return "Unassigned";
      case "model_name":
        if (risk.model_id) {
          const model = modelInventoryData.find((m) => m.id == risk.model_id);
          return model?.model || "Unknown Model";
        }
        return "No Model";
      default:
        return "Other";
    }
  };

  // Apply grouping to filtered model risks
  const groupedModelRisks = useTableGrouping({
    data: filteredModelRisks,
    groupByField: groupByRisk,
    sortOrder: groupSortOrderRisk,
    getGroupKey: getModelRiskGroupKey,
  });

  // Filter evidence hub using FilterBy and search
  const filteredEvidenceHub = useMemo(() => {
    // First apply FilterBy conditions
    let filtered = filterEvidenceData(evidenceHubData);

    // Then apply search filter
    if (searchTypeTerm?.trim()) {
      const lower = searchTypeTerm.toLowerCase();
      filtered = filtered.filter((e) =>
        e.evidence_name?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [filterEvidenceData, evidenceHubData, searchTypeTerm]);

  // Define how to get the group key for each evidence
  const getEvidenceGroupKey = (
    evidence: any,
    field: string
  ): string | string[] => {
    switch (field) {
      case "evidence_type":
        return evidence.evidence_type || "Unknown";
      case "uploaded_by":
        if (evidence.uploaded_by) {
          const user = users.find((u) => u.id == evidence.uploaded_by);
          return user ? `${user.name} ${user.surname}`.trim() : "Unknown";
        }
        return "Unknown";
      case "model":
        if (evidence.model_id) {
          const model = modelInventoryData.find(
            (m) => m.id == evidence.model_id
          );
          return model?.model || "Unknown Model";
        }
        return "No Model";
      default:
        return "Other";
    }
  };

  // Apply grouping to filtered evidence hub
  const groupedEvidenceHub = useTableGrouping({
    data: filteredEvidenceHub,
    groupByField: groupByEvidence,
    sortOrder: groupSortOrderEvidence,
    getGroupKey: getEvidenceGroupKey,
  });

  // Export columns and data for Model Risks
  const modelRisksExportColumns = useMemo(() => {
    return [
      { id: "risk_name", label: "Risk Name" },
      { id: "model_name", label: "Model Name" },
      { id: "risk_category", label: "Category" },
      { id: "risk_level", label: "Risk Level" },
      { id: "status", label: "Status" },
      { id: "owner", label: "Owner" },
      { id: "target_date", label: "Target Date" },
    ];
  }, []);

  const modelRisksExportData = useMemo(() => {
    return filteredModelRisks.map((risk: IModelRisk) => {
      const ownerUser = users.find((user: any) => user.id == risk.owner);
      const ownerName = ownerUser
        ? `${ownerUser.name} ${ownerUser.surname}`
        : "-";

      const model = modelInventoryData.find((m) => m.id === risk.model_id);
      const modelName = model ? model.model : "-";

      return {
        risk_name: risk.risk_name || "-",
        model_name: modelName,
        risk_category: risk.risk_category || "-",
        risk_level: risk.risk_level || "-",
        status: risk.status || "-",
        owner: ownerName,
        target_date: risk.target_date || "-",
      };
    });
  }, [filteredModelRisks, users, modelInventoryData]);

  // Export columns and data for Evidence Hub
  const evidenceHubExportColumns = useMemo(() => {
    return [
      { id: "evidence_name", label: "Evidence Name" },
      { id: "evidence_type", label: "Type" },
      { id: "mapped_models", label: "Mapped Models" },
      { id: "uploaded_by", label: "Uploaded By" },
      { id: "uploaded_on", label: "Uploaded On" },
      { id: "expiry_date", label: "Expiry" },
    ];
  }, []);

  const evidenceHubExportData = useMemo(() => {
    return filteredEvidenceHub.map((evidence: EvidenceHubModel) => {
      // Get uploader from first evidence file
      const uploadedById = evidence.evidence_files?.[0]?.uploaded_by;
      const uploaderUser = users.find((user: any) => user.id === uploadedById);
      const uploaderName = uploaderUser
        ? `${uploaderUser.name} ${uploaderUser.surname}`
        : "-";

      // Get upload date from first evidence file
      const uploadDate = evidence.evidence_files?.[0]?.upload_date;
      const formattedUploadDate = uploadDate
        ? new Date(uploadDate).toISOString().split("T")[0]
        : "-";

      // Get mapped model names from mapped_model_ids
      const mappedModelNames =
        evidence.mapped_model_ids
          ?.map((modelId: number) => {
            const model = modelInventoryData.find((m) => m.id === modelId);
            return model ? `${model.provider} - ${model.model}` : null;
          })
          .filter(Boolean)
          .join(", ") || "-";

      // Format expiry date
      const formattedExpiryDate = evidence.expiry_date
        ? new Date(evidence.expiry_date).toISOString().split("T")[0]
        : "-";

      return {
        evidence_name: evidence.evidence_name || "-",
        evidence_type: evidence.evidence_type || "-",
        mapped_models: mappedModelNames,
        uploaded_by: uploaderName,
        uploaded_on: formattedUploadDate,
        expiry_date: formattedExpiryDate,
      };
    });
  }, [filteredEvidenceHub, users, modelInventoryData]);

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

  const handleEvidenceUploadModalSuccess = async (
    formData: EvidenceHubModel
  ) => {
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
        console.log("response", response);

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

      {/* Replace Share Link Confirmation Modal */}
      <Modal
        open={showReplaceConfirmation}
        onClose={(_event, reason) => {
          if (reason !== "backdropClick") {
            setShowReplaceConfirmation(false);
          }
        }}
      >
        <Stack
          gap={theme.spacing(2)}
          color={theme.palette.text.secondary}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            bgcolor: theme.palette.background.modal,
            border: 1,
            borderColor: theme.palette.border.dark,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 24,
            p: theme.spacing(15),
            "&:focus": {
              outline: "none",
            },
          }}
        >
          <Typography fontSize={16} fontWeight={600}>
            Replace Share Link?
          </Typography>
          <Typography fontSize={13} textAlign={"left"}>
            This will invalidate the current share link and generate a new one.
            Anyone with the old link will no longer be able to access the shared
            view.
          </Typography>
          <Typography fontSize={13} textAlign={"left"} mt={theme.spacing(4)}>
            Do you want to continue?
          </Typography>
          <Stack
            direction="row"
            gap={theme.spacing(4)}
            mt={theme.spacing(12)}
            justifyContent="flex-end"
          >
            <Button
              disableRipple
              disableFocusRipple
              disableTouchRipple
              variant="text"
              color="inherit"
              onClick={() => setShowReplaceConfirmation(false)}
              sx={{
                width: 100,
                textTransform: "capitalize",
                fontSize: 13,
                borderRadius: "4px",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "transparent",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              disableRipple
              disableFocusRipple
              disableTouchRipple
              variant="contained"
              onClick={handleConfirmReplace}
              sx={{
                width: 160,
                fontSize: 13,
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                boxShadow: "none",
                borderRadius: "4px",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#0f5a48",
                },
              }}
            >
              Replace Link
            </Button>
          </Stack>
        </Stack>
      </Modal>

      <Stack sx={mainStackStyle}>
        <PageHeader
          title="Model Inventory"
          description="This registry manages all AI/LLM models and their associated risks within your organization. You can view, add, and manage model details and track model-specific risks and mitigation plans."
          rightContent={
            <HelperIcon
              articlePath="ai-governance/model-inventory"
              size="small"
            />
          }
        />
        <TipBox entityName="model-inventory" />

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
              {/* Left side: FilterBy + Search + GroupBy */}
              <Stack direction="row" spacing={2} alignItems="center">
                <div data-joyride-id="model-status-filter">
                  <FilterBy
                    columns={modelFilterColumns}
                    onFilterChange={handleModelFilterChange}
                  />
                </div>

                <GroupBy
                  options={[
                    { id: "provider", label: "Provider" },
                    { id: "status", label: "Status" },
                    { id: "security_assessment", label: "Security Assessment" },
                    { id: "hosting_provider", label: "Hosting Provider" },
                    { id: "approver", label: "Approver" },
                  ]}
                  onGroupChange={handleGroupChange}
                />

                {/* Search */}
                <Box data-joyride-id="model-search">
                  <SearchBox
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    inputProps={{
                      "aria-label": "Search models",
                    }}
                    fullWidth={false}
                  />
                </Box>
              </Stack>

              {/* Right side: Share, Export, Analytics & Add Model buttons */}
              <Stack direction="row" gap="8px" alignItems="center">
                <ShareButton
                  onClick={handleShareClick}
                  size="medium"
                  tooltip="Share view"
                />
                <ExportMenu
                  data={exportData}
                  columns={exportColumns}
                  filename="model-inventory"
                  title="Model Inventory"
                />
                <IconButton
                  onClick={() => setIsAnalyticsDrawerOpen(true)}
                  aria-label="Analytics"
                  sx={{
                    height: "34px",
                    width: "34px",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  <BarChart3 size={16} color="#344054" />
                </IconButton>
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
              <Stack direction="row" gap={2} alignItems="center">
                <div data-joyride-id="risk-category-filter">
                  <FilterBy
                    columns={modelRiskFilterColumns}
                    onFilterChange={handleModelRiskFilterChange}
                  />
                </div>
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
                    return `Show: ${selectedItem.name.toLowerCase()}`;
                  }}
                />
                <GroupBy
                  options={[
                    { id: "risk_category", label: "Category" },
                    { id: "risk_level", label: "Risk level" },
                    { id: "status", label: "Status" },
                    { id: "model_name", label: "Model" },
                    { id: "owner", label: "Owner" },
                  ]}
                  onGroupChange={handleGroupChangeRisk}
                />
              </Stack>
              <Stack direction="row" gap="8px" alignItems="center">
                <ExportMenu
                  data={modelRisksExportData}
                  columns={modelRisksExportColumns}
                  filename="model-risks"
                  title="Model Risks"
                />
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
              {/* Left side: FilterBy + Search + GroupBy */}
              <Stack direction="row" spacing={2} alignItems="center">
                <div data-joyride-id="evidence-type-filter">
                  <FilterBy
                    columns={evidenceFilterColumns}
                    onFilterChange={handleEvidenceFilterChange}
                  />
                </div>
                <GroupBy
                  options={[
                    { id: "evidence_type", label: "Evidence type" },
                    { id: "uploaded_by", label: "Uploaded by" },
                    { id: "model", label: "Model" },
                  ]}
                  onGroupChange={handleGroupChangeEvidence}
                />
                {/* Search */}
                <Box data-joyride-id="evidence-search">
                  <SearchBox
                    placeholder="Search evidence..."
                    value={searchTypeTerm}
                    onChange={setSearchTypeTerm}
                    inputProps={{
                      "aria-label": "Search evidence",
                    }}
                    fullWidth={false}
                  />
                </Box>
              </Stack>

              {/* Right side: Export and Upload Evidence */}
              <Stack direction="row" gap="8px" alignItems="center">
                <ExportMenu
                  data={evidenceHubExportData}
                  columns={evidenceHubExportColumns}
                  filename="evidence-hub"
                  title="Evidence Hub"
                />
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
                projects: selectedModelInventory.projects || [],
                frameworks: selectedModelInventory.frameworks || [],
                security_assessment_data:
                  selectedModelInventory.security_assessment_data || [],
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

      <NewEvidenceHub
        isOpen={isEvidenceHubModalOpen}
        setIsOpen={handleClosEvidenceModal}
        onSuccess={handleEvidenceUploadModalSuccess}
        onError={handleEvidenceUploadModalError}
        isEdit={!!selectedEvidenceHub}
        initialData={selectedEvidenceHub || undefined}
        preselectedModelId={preselectedModelId}
      />

      <PageTour
        steps={ModelInventorySteps}
        run={true}
        tourKey="model-inventory-tour"
      />

      {/* Share View Dropdown */}
      <ShareViewDropdown
        anchorEl={shareAnchorEl}
        onClose={handleShareClose}
        enabled={isShareEnabled}
        shareableLink={shareableLink}
        initialSettings={shareSettings}
        onEnabledChange={handleShareEnabledChange}
        onGenerateLink={generateShareableLink}
        onSettingsChange={handleShareSettingsChange}
        onCopyLink={handleCopyLink}
        onRefreshLink={handleRefreshLink}
        onOpenLink={handleOpenLink}
      />
    </Stack>
  );
};

export default ModelInventory;
