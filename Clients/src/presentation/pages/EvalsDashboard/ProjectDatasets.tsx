import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Drawer,
  Divider,
  Chip,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Button,
  useTheme,
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Upload, Download, X, Eye, Edit3, Trash2, ArrowLeft, Save as SaveIcon, Copy, Database, ChevronUp, ChevronDown, ChevronsUpDown, Plus } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import ButtonToggle from "../../components/ButtonToggle";
import { deepEvalDatasetsService, type DatasetPromptRecord, type ListedDataset, type DatasetType } from "../../../infrastructure/api/deepEvalDatasetsService";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import Field from "../../components/Inputs/Field";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import { getPaginationRowCount, setPaginationRowCount } from "../../../application/utils/paginationStorage";
import DatasetsTable, { type DatasetRow } from "../../components/Table/DatasetsTable";

type ProjectDatasetsProps = { projectId: string };

type BuiltInDataset = ListedDataset & {
  promptCount?: number;
  isUserDataset?: boolean;
  createdAt?: string;
  datasetType?: DatasetType;
  // Additional metadata for templates
  test_count?: number;
  categories?: string[];
  category_count?: number;
  difficulty?: { easy: number; medium: number; hard: number };
  description?: string;
  tags?: string[];
};

export function ProjectDatasets({ projectId }: ProjectDatasetsProps) {
  void projectId; // Used for future project-scoped features
  const theme = useTheme();

  // Tab state: "my" for user datasets, "templates" for built-in datasets
  const [activeTab, setActiveTab] = useState<"my" | "templates">("my");

  // My datasets state
  const [datasets, setDatasets] = useState<BuiltInDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<BuiltInDataset | null>(null);
  const [datasetPrompts, setDatasetPrompts] = useState<DatasetPromptRecord[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Template datasets state
  const [templateGroups, setTemplateGroups] = useState<Record<"chatbot" | "rag" | "agent" | "safety", BuiltInDataset[]>>({
    chatbot: [],
    rag: [],
    agent: [],
    safety: [],
  });
  const [selectedTemplate, setSelectedTemplate] = useState<BuiltInDataset | null>(null);
  const [templatePrompts, setTemplatePrompts] = useState<DatasetPromptRecord[]>([]);
  const [loadingTemplatePrompts, setLoadingTemplatePrompts] = useState(false);
  const [copyingTemplate, setCopyingTemplate] = useState(false);

  // Template table state (pagination, search, sorting)
  const [templatePage, setTemplatePage] = useState(0);
  const [templateRowsPerPage, setTemplateRowsPerPage] = useState(() => getPaginationRowCount("templates", 10));
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");
  const [templateSortConfig, setTemplateSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  // Copy template confirmation modal state
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<BuiltInDataset | null>(null);

  // Expanded prompt rows in template preview
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());

  // Template drawer state
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);

  // Action menu state
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
  const [actionDataset, setActionDataset] = useState<BuiltInDataset | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<BuiltInDataset | null>(null);

  // Inline editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<BuiltInDataset | null>(null);
  const [editablePrompts, setEditablePrompts] = useState<DatasetPromptRecord[]>([]);
  const [editDatasetName, setEditDatasetName] = useState("");
  const [savingDataset, setSavingDataset] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(false);

  // Prompt edit drawer state (for inline editor)
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);

  // Create dataset modal state
  const [createDatasetModalOpen, setCreateDatasetModalOpen] = useState(false);

  // State for dataset metadata (prompt counts, difficulty)
  const [datasetMetadata, setDatasetMetadata] = useState<Record<string, { promptCount: number; avgDifficulty: string; loading: boolean }>>({});

  // Calculate average difficulty from prompts
  const calculateAvgDifficulty = (prompts: DatasetPromptRecord[]): string => {
    const difficulties = prompts.filter(p => p.difficulty).map(p => p.difficulty!.toLowerCase());
    if (difficulties.length === 0) return "-";
    
    const counts = { easy: 0, medium: 0, hard: 0 };
    difficulties.forEach(d => {
      if (d === "easy") counts.easy++;
      else if (d === "medium") counts.medium++;
      else if (d === "hard") counts.hard++;
    });
    
    // Return the most common difficulty
    const max = Math.max(counts.easy, counts.medium, counts.hard);
    if (max === 0) return "-";
    if (counts.hard === max) return "Hard";
    if (counts.medium === max) return "Medium";
    return "Easy";
  };

  // Load metadata for a single dataset
  const loadDatasetMetadata = useCallback(async (dataset: BuiltInDataset) => {
    if (datasetMetadata[dataset.path]?.loading || datasetMetadata[dataset.path]?.promptCount !== undefined) {
      return; // Already loading or loaded
    }
    
    setDatasetMetadata(prev => ({
      ...prev,
      [dataset.path]: { promptCount: 0, avgDifficulty: "-", loading: true }
    }));
    
    try {
      const res = await deepEvalDatasetsService.read(dataset.path);
      const prompts = res.prompts || [];
      setDatasetMetadata(prev => ({
        ...prev,
        [dataset.path]: {
          promptCount: prompts.length,
          avgDifficulty: calculateAvgDifficulty(prompts),
          loading: false
        }
      }));
    } catch {
      setDatasetMetadata(prev => ({
        ...prev,
        [dataset.path]: { promptCount: 0, avgDifficulty: "-", loading: false }
      }));
    }
  }, [datasetMetadata]);

  // Load user's datasets (My datasets tab)
  const loadMyDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await deepEvalDatasetsService.listMy().catch(() => ({ datasets: [] }));
      const userDatasets = userRes.datasets || [];
      const allDatasets: BuiltInDataset[] = userDatasets.map((ud) => ({
        key: `user_${ud.id}`,
        name: ud.name,
        path: ud.path,
        use_case: (ud.datasetType || "chatbot") as "chatbot" | "rag" | "agent" | "safety",
        datasetType: ud.datasetType || "chatbot",
        isUserDataset: true,
        createdAt: ud.createdAt,
      }));
      setDatasets(allDatasets);
    } catch (err) {
      console.error("Failed to load datasets", err);
      setDatasets([]);
      setAlert({
        variant: "error",
        body: "Failed to load datasets",
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load built-in template datasets (Templates tab)
  const loadTemplateDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deepEvalDatasetsService.list();
      setTemplateGroups(res as Record<"chatbot" | "rag" | "agent" | "safety", BuiltInDataset[]>);
    } catch (err) {
      console.error("Failed to load template datasets", err);
      setTemplateGroups({ chatbot: [], rag: [], agent: [], safety: [] });
      setAlert({
        variant: "error",
        body: "Failed to load template datasets",
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Flatten templates from all categories into a single array with category field
  type TemplateWithCategory = BuiltInDataset & { category: "chatbot" | "rag" | "agent" | "safety" };
  const flattenedTemplates: TemplateWithCategory[] = useMemo(() => {
    return (["chatbot", "rag", "agent", "safety"] as const).flatMap((category) =>
      (templateGroups[category] || []).map((ds) => ({ ...ds, category }))
    );
  }, [templateGroups]);

  // Template filter columns
  const templateFilterColumns: FilterColumn[] = useMemo(() => [
    { id: "name", label: "Dataset name", type: "text" },
    {
      id: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "chatbot", label: "Chatbot" },
        { value: "rag", label: "RAG" },
        { value: "agent", label: "Agent" },
        { value: "safety", label: "Safety" },
      ],
    },
  ], []);

  // Template field value getter for filtering
  const getTemplateFieldValue = useCallback(
    (item: TemplateWithCategory, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return item.name;
        case "category":
          return item.category;
        default:
          return null;
      }
    },
    []
  );

  // useFilterBy hook for templates
  const { filterData: filterTemplateData, handleFilterChange: handleTemplateFilterChange } = useFilterBy<TemplateWithCategory>(getTemplateFieldValue);

  // Filtered and sorted templates
  const filteredAndSortedTemplates = useMemo(() => {
    // Apply filter
    let result = filterTemplateData(flattenedTemplates);

    // Apply search
    if (templateSearchTerm.trim()) {
      const q = templateSearchTerm.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    // Apply sorting
    if (templateSortConfig.key && templateSortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";

        switch (templateSortConfig.key) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "category":
            aVal = a.category;
            bVal = b.category;
            break;
          case "tests":
            aVal = a.test_count ?? 0;
            bVal = b.test_count ?? 0;
            break;
          case "difficulty": {
            // Calculate predominant difficulty from the object
            const getPredominantDifficulty = (diff?: { easy: number; medium: number; hard: number }) => {
              if (!diff) return 0;
              const total = diff.easy + diff.medium + diff.hard;
              if (total === 0) return 0;
              // Weight: easy=1, medium=2, hard=3, then average
              return (diff.easy * 1 + diff.medium * 2 + diff.hard * 3) / total;
            };
            aVal = getPredominantDifficulty(a.difficulty);
            bVal = getPredominantDifficulty(b.difficulty);
            break;
          }
          default:
            return 0;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          const cmp = aVal.localeCompare(bVal);
          return templateSortConfig.direction === "asc" ? cmp : -cmp;
        }
        if (aVal < bVal) return templateSortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return templateSortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [flattenedTemplates, filterTemplateData, templateSearchTerm, templateSortConfig]);

  // Paginated templates
  const paginatedTemplates = useMemo(() => {
    const start = templatePage * templateRowsPerPage;
    return filteredAndSortedTemplates.slice(start, start + templateRowsPerPage);
  }, [filteredAndSortedTemplates, templatePage, templateRowsPerPage]);

  // Template sorting handler
  const handleTemplateSort = useCallback((columnId: string) => {
    setTemplateSortConfig((prev) => {
      if (prev.key === columnId) {
        if (prev.direction === "asc") return { key: columnId, direction: "desc" };
        if (prev.direction === "desc") return { key: "", direction: null };
      }
      return { key: columnId, direction: "asc" };
    });
  }, []);

  // Template pagination handlers
  const handleTemplatePageChange = (_: unknown, newPage: number) => {
    setTemplatePage(newPage);
  };

  const handleTemplateRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setTemplateRowsPerPage(newRowsPerPage);
    setPaginationRowCount("templates", newRowsPerPage);
    setTemplatePage(0);
  };

  // Open copy confirmation modal
  const handleOpenCopyModal = (template: BuiltInDataset) => {
    setTemplateToCopy(template);
    setCopyModalOpen(true);
  };

  // Confirm copy
  const handleConfirmCopy = async () => {
    if (!templateToCopy) return;
    setCopyModalOpen(false);
    await handleCopyTemplate(templateToCopy);
    setTemplateToCopy(null);
  };

  // Open template drawer
  const handleViewTemplate = (template: BuiltInDataset) => {
    setSelectedTemplate(template);
    setTemplateDrawerOpen(true);
    setExpandedPromptIds(new Set()); // Reset expanded state
  };

  // Close template drawer
  const handleCloseTemplateDrawer = () => {
    setTemplateDrawerOpen(false);
    setSelectedTemplate(null);
    setTemplatePrompts([]);
    setExpandedPromptIds(new Set()); // Reset expanded state
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "my") {
      void loadMyDatasets();
    } else {
      void loadTemplateDatasets();
    }
  }, [activeTab, loadMyDatasets, loadTemplateDatasets]);

  // Load template prompts when a template is selected
  useEffect(() => {
    if (!selectedTemplate?.path) {
      setTemplatePrompts([]);
      return;
    }
    (async () => {
      try {
        setLoadingTemplatePrompts(true);
        const res = await deepEvalDatasetsService.read(selectedTemplate.path);
        setTemplatePrompts(res.prompts || []);
      } catch (err) {
        console.error("Failed to load template prompts", err);
        setTemplatePrompts([]);
      } finally {
        setLoadingTemplatePrompts(false);
      }
    })();
  }, [selectedTemplate]);

  // Copy template to user's datasets
  const handleCopyTemplate = async (template: BuiltInDataset) => {
    try {
      setCopyingTemplate(true);
      // Load the template content
      const res = await deepEvalDatasetsService.read(template.path);
      const prompts = res.prompts || [];

      // Create a new file and upload it
      const json = JSON.stringify(prompts, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const fileName = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.json`;
      const file = new File([blob], fileName, { type: "application/json" });

      await deepEvalDatasetsService.uploadDataset(file);
      setAlert({ variant: "success", body: `"${template.name}" copied to your datasets` });
      setTimeout(() => setAlert(null), 3000);

      // Switch to My datasets tab and reload
      setActiveTab("my");
      void loadMyDatasets();
    } catch (err) {
      console.error("Failed to copy template", err);
      setAlert({ variant: "error", body: "Failed to copy template" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setCopyingTemplate(false);
    }
  };

  const filterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Dataset name", type: "text" },
    ],
    []
  );

  const getFieldValue = useCallback(
    (d: BuiltInDataset, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "name":
          return d.name;
        case "use_case":
          return d.use_case;
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<BuiltInDataset>(getFieldValue);

  const filteredDatasets = useMemo(() => {
    const afterFilter = filterData(datasets);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((d) =>
      [d.name, d.path, d.use_case].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [datasets, filterData, searchTerm]);

  // Action menu handlers
  const handleActionMenuClose = () => {
    setActionAnchor(null);
    setActionDataset(null);
  };

  const handleViewPrompts = async (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    setSelectedDataset(dataset);
    setDrawerOpen(true);
    try {
      setLoadingPrompts(true);
      const res = await deepEvalDatasetsService.read(dataset.path);
      setDatasetPrompts(res.prompts || []);
    } catch (err) {
      console.error("Failed to load dataset prompts", err);
      setDatasetPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleOpenInEditor = async (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    try {
      setLoadingEditor(true);
      const res = await deepEvalDatasetsService.read(dataset.path);
      setEditablePrompts(res.prompts || []);
      // Use the dataset name directly (already cleaned by backend)
      setEditDatasetName(dataset.name);
      setEditingDataset(dataset);
      setEditorOpen(true);
    } catch (err) {
      console.error("Failed to load dataset for editing", err);
      setAlert({ variant: "error", body: "Failed to load dataset for editing" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingDataset(null);
    setEditablePrompts([]);
    setEditDatasetName("");
  };

  const handleSaveDataset = async () => {
    try {
      setSavingDataset(true);
      const json = JSON.stringify(editablePrompts, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const slug = editDatasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const finalName = slug ? `${slug}.json` : "dataset.json";
      const file = new File([blob], finalName, { type: "application/json" });
      const datasetType = editingDataset?.datasetType || "chatbot";
      await deepEvalDatasetsService.uploadDataset(file, datasetType);
      setAlert({ variant: "success", body: `Dataset "${editDatasetName}" saved successfully!` });
      setTimeout(() => setAlert(null), 3000);
      handleCloseEditor();
      void loadMyDatasets();
    } catch (err) {
      console.error("Failed to save dataset", err);
      type AxiosLike = { response?: { data?: unknown } };
      const axiosErr = err as AxiosLike | Error;
      const resData = (axiosErr as AxiosLike)?.response?.data as Record<string, unknown> | undefined;
      const serverMsg =
        (resData && (String(resData.message ?? "") || String(resData.detail ?? ""))) ||
        (axiosErr instanceof Error ? axiosErr.message : null);
      setAlert({ variant: "error", body: serverMsg || "Save failed. Check dataset structure." });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setSavingDataset(false);
    }
  };

  const isValidToSave = useMemo(() => {
    return editablePrompts && editablePrompts.length > 0 && editablePrompts.some((p) => p.prompt.trim()) && editDatasetName.trim();
  }, [editablePrompts, editDatasetName]);

  const handleAddPrompt = () => {
    const newPrompt: DatasetPromptRecord = {
      id: `prompt_${Date.now()}`,
      category: "General",
      prompt: "",
      expected_output: "",
      expected_keywords: [],
      retrieval_context: [],
    };
    setEditablePrompts((prev) => [...prev, newPrompt]);
    // Open the drawer with the new prompt
    setSelectedPromptIndex(editablePrompts.length);
    setPromptDrawerOpen(true);
  };

  const handleDeletePrompt = (idx: number) => {
    setEditablePrompts((prev) => prev.filter((_, i) => i !== idx));
    if (selectedPromptIndex === idx) {
      setPromptDrawerOpen(false);
      setSelectedPromptIndex(null);
    } else if (selectedPromptIndex !== null && selectedPromptIndex > idx) {
      setSelectedPromptIndex(selectedPromptIndex - 1);
    }
  };

  const handleRemoveDataset = (dataset: BuiltInDataset) => {
    handleActionMenuClose();
    setDatasetToDelete(dataset);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return;
    try {
      await deepEvalDatasetsService.deleteDatasets([datasetToDelete.path]);
      setAlert({ variant: "success", body: "Dataset removed" });
      setTimeout(() => setAlert(null), 3000);
      void loadMyDatasets();
    } catch (err) {
      console.error("Failed to remove dataset", err);
      setAlert({ variant: "error", body: "Failed to remove dataset" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setDeleteModalOpen(false);
      setDatasetToDelete(null);
    }
  };

  const handleRowClick = async (dataset: BuiltInDataset) => {
    // Navigate directly to editor when clicking on a row
    await handleOpenInEditor(dataset);
  };


  // Load metadata for datasets in "My datasets" tab
  useEffect(() => {
    if (activeTab === "my" && filteredDatasets.length > 0) {
      filteredDatasets.forEach(dataset => {
        if (!datasetMetadata[dataset.path]) {
          void loadDatasetMetadata(dataset);
        }
      });
    }
  }, [activeTab, filteredDatasets, datasetMetadata, loadDatasetMetadata]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedDataset(null);
    setDatasetPrompts([]);
  };

  const handleUploadClick = () => {
    setUploadModalOpen(true);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Example dataset type for download
  const [exampleDatasetType, setExampleDatasetType] = useState<"chatbot" | "rag" | "agent">("chatbot");

  const handleDownloadExample = (type: "chatbot" | "rag" | "agent" = exampleDatasetType) => {
    const exampleDatasets = {
      chatbot: [
        {
          id: "chatbot_001",
          category: "general_knowledge",
          prompt: "What is the capital of France?",
          expected_output: "The capital of France is Paris.",
          expected_keywords: ["Paris", "capital", "France"],
          difficulty: "easy"
        },
        {
          id: "chatbot_002",
          category: "coding",
          prompt: "Write a Python function to reverse a string.",
          expected_output: "def reverse_string(s):\n    return s[::-1]",
          expected_keywords: ["def", "return"],
          difficulty: "medium"
        }
      ],
      rag: [
        {
          id: "rag_001",
          category: "document_qa",
          prompt: "What are the key benefits of renewable energy?",
          expected_output: "The key benefits of renewable energy include reduced carbon emissions, energy independence, and long-term cost savings.",
          expected_keywords: ["carbon emissions", "energy independence", "cost savings"],
          difficulty: "medium",
          retrieval_context: [
            "Renewable energy sources such as solar, wind, and hydropower offer significant environmental benefits by reducing greenhouse gas emissions.",
            "Countries that invest in renewable energy often achieve greater energy independence and security.",
            "While initial costs may be higher, renewable energy systems typically provide long-term cost savings through reduced fuel and maintenance costs."
          ]
        },
        {
          id: "rag_002",
          category: "technical_docs",
          prompt: "How does the authentication system handle expired tokens?",
          expected_output: "When a token expires, the system returns a 401 status code and the client must refresh the token using the refresh endpoint.",
          expected_keywords: ["401", "refresh", "token"],
          difficulty: "hard",
          retrieval_context: [
            "The authentication middleware validates JWT tokens on each request. If the token has expired, it returns HTTP 401 Unauthorized.",
            "Clients should implement automatic token refresh by calling POST /auth/refresh with a valid refresh token.",
            "Refresh tokens have a longer expiry (7 days) compared to access tokens (15 minutes)."
          ]
        }
      ],
      agent: [
        {
          id: "agent_001",
          category: "task_execution",
          prompt: "Search for the weather in New York and summarize it.",
          expected_output: "I searched for the current weather in New York. The temperature is 72°F with partly cloudy skies.",
          expected_keywords: ["weather", "New York", "temperature"],
          difficulty: "medium",
          tools_available: ["web_search", "calculator", "calendar"],
          expected_tools: ["web_search"]
        },
        {
          id: "agent_002",
          category: "multi_step",
          prompt: "Calculate the total cost of 3 items at $25.99 each plus 8% tax.",
          expected_output: "The subtotal is $77.97 and with 8% tax ($6.24), the total is $84.21.",
          expected_keywords: ["77.97", "6.24", "84.21"],
          difficulty: "easy",
          tools_available: ["calculator", "web_search"],
          expected_tools: ["calculator"]
        }
      ]
    };

    const exampleData = exampleDatasets[type];
    const filename = `example_${type}_dataset.json`;

    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadModalOpen(false);
      const resp = await deepEvalDatasetsService.uploadDataset(file, exampleDatasetType);
      setAlert({ variant: "success", body: `Uploaded ${resp.filename}` });
      setTimeout(() => setAlert(null), 4000);
      void loadMyDatasets();
    } catch (err) {
      console.error("Upload failed", err);
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Upload failed",
      });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // If editor is loading, show spinner
  if (loadingEditor) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  // Inline editor view
  if (editorOpen && editingDataset) {
    return (
      <Box>
        {alert && <Alert variant={alert.variant} body={alert.body} />}

        {/* Header with back button and save */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={handleCloseEditor} aria-label="Back">
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "16px" }}>
              Edit dataset
            </Typography>
          </Stack>
          <Button
            variant="contained"
            disabled={!isValidToSave || savingDataset}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0F5E4B" }, height: "34px" }}
            startIcon={<SaveIcon size={16} />}
            onClick={handleSaveDataset}
          >
            {savingDataset ? "Saving..." : "Save copy"}
          </Button>
        </Stack>

        {/* Dataset name input */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Field
            label="Dataset name"
            value={editDatasetName}
            onChange={(e) => setEditDatasetName(e.target.value)}
            placeholder="Enter a descriptive name for this dataset"
            isRequired
          />
          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "13px" }}>
            Edit the prompts below, then click Save to add a copy to your datasets.
          </Typography>
        </Stack>

        {/* Prompts table */}
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>ID</TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Prompt</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "90px" }}>Difficulty</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "120px" }}>Category</TableCell>
                <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "60px" }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editablePrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No prompts in this dataset yet.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddPrompt}
                      sx={{
                        color: "#13715B",
                        borderColor: "#13715B",
                        "&:hover": { borderColor: "#0F5E4B", backgroundColor: "#E8F5F1" },
                      }}
                    >
                      Add your first prompt
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                editablePrompts.map((p, idx) => (
                  <TableRow
                    key={p.id || idx}
                    onClick={() => {
                      setSelectedPromptIndex(idx);
                      setPromptDrawerOpen(true);
                    }}
                    sx={{
                      ...singleTheme.tableStyles.primary.body.row,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }}>
                        {p.id || `prompt_${idx + 1}`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          color: p.prompt ? "#374151" : "#9CA3AF",
                          fontStyle: p.prompt ? "normal" : "italic",
                        }}
                      >
                        {p.prompt || "Empty prompt - click to edit"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {p.difficulty && (
                        <Chip
                          label={p.difficulty}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "10px",
                            fontWeight: 500,
                            backgroundColor:
                              p.difficulty === "easy" ? "#D1FAE5" :
                              p.difficulty === "medium" ? "#FEF3C7" :
                              p.difficulty === "hard" ? "#FEE2E2" : "#E5E7EB",
                            color:
                              p.difficulty === "easy" ? "#065F46" :
                              p.difficulty === "medium" ? "#92400E" :
                              p.difficulty === "hard" ? "#991B1B" : "#374151",
                            borderRadius: "4px",
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip
                        label={p.category || "uncategorized"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          backgroundColor: "#E5E7EB",
                          color: "#374151",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(idx);
                        }}
                        sx={{
                          color: "#9CA3AF",
                          "&:hover": { color: "#EF4444", backgroundColor: "#FEE2E2" },
                        }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add prompt button */}
        {editablePrompts.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={handleAddPrompt}
            fullWidth
            sx={{
              mt: 2,
              color: "#13715B",
              borderColor: "#E5E7EB",
              borderStyle: "dashed",
              py: 1.5,
              "&:hover": { 
                borderColor: "#13715B", 
                backgroundColor: "#E8F5F1",
                borderStyle: "dashed",
              },
            }}
          >
            Add prompt
          </Button>
        )}

        {/* Prompt Edit Drawer */}
        <Drawer
          anchor="right"
          open={promptDrawerOpen}
          onClose={() => {
            setPromptDrawerOpen(false);
            setSelectedPromptIndex(null);
          }}
        >
          <Stack
            sx={{
              width: 500,
              maxHeight: "100vh",
              overflowY: "auto",
              p: theme.spacing(10),
              bgcolor: theme.palette.background.paper,
            }}
          >
            {/* Drawer Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography fontWeight={600} color={theme.palette.text.primary} fontSize="16px">
                Edit prompt
              </Typography>
              <Box
                onClick={() => {
                  setPromptDrawerOpen(false);
                  setSelectedPromptIndex(null);
                }}
                sx={{ cursor: "pointer" }}
              >
                <X size={20} color={theme.palette.text.secondary} />
              </Box>
            </Stack>
            <Divider sx={{ mb: 3, mx: `calc(-1 * ${theme.spacing(10)})` }} />

            {selectedPromptIndex !== null && editablePrompts[selectedPromptIndex] && (
              <Stack spacing={3}>
                <Field
                  label="Prompt"
                  value={editablePrompts[selectedPromptIndex].prompt}
                  onChange={(e) => {
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], prompt: e.target.value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Enter the prompt text"
                  isRequired
                  type="description"
                />

                <Field
                  label="Expected output"
                  value={editablePrompts[selectedPromptIndex].expected_output || ""}
                  onChange={(e) => {
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], expected_output: e.target.value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Enter the expected response"
                  type="description"
                />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px", mb: 1 }}>
                    Difficulty
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <Chip
                        key={diff}
                        label={diff.charAt(0).toUpperCase() + diff.slice(1)}
                        onClick={() => {
                          const next = [...editablePrompts];
                          next[selectedPromptIndex] = { ...next[selectedPromptIndex], difficulty: diff };
                          setEditablePrompts(next);
                        }}
                        sx={{
                          cursor: "pointer",
                          height: 28,
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: editablePrompts[selectedPromptIndex].difficulty === diff
                            ? diff === "easy" ? "#D1FAE5"
                              : diff === "medium" ? "#FEF3C7"
                              : "#FEE2E2"
                            : "#F3F4F6",
                          color: editablePrompts[selectedPromptIndex].difficulty === diff
                            ? diff === "easy" ? "#065F46"
                              : diff === "medium" ? "#92400E"
                              : "#991B1B"
                            : "#6B7280",
                          border: editablePrompts[selectedPromptIndex].difficulty === diff ? "1px solid" : "1px solid transparent",
                          borderColor: editablePrompts[selectedPromptIndex].difficulty === diff
                            ? diff === "easy" ? "#10B981"
                              : diff === "medium" ? "#F59E0B"
                              : "#EF4444"
                            : "transparent",
                          "&:hover": {
                            backgroundColor: diff === "easy" ? "#D1FAE5"
                              : diff === "medium" ? "#FEF3C7"
                              : "#FEE2E2",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Field
                  label="Category"
                  value={editablePrompts[selectedPromptIndex].category || ""}
                  onChange={(e) => {
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], category: e.target.value };
                    setEditablePrompts(next);
                  }}
                  placeholder="e.g., general_knowledge, coding, etc."
                />

                <Field
                  label="Keywords"
                  value={(editablePrompts[selectedPromptIndex].expected_keywords || []).join(", ")}
                  onChange={(e) => {
                    const value = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    const next = [...editablePrompts];
                    next[selectedPromptIndex] = { ...next[selectedPromptIndex], expected_keywords: value };
                    setEditablePrompts(next);
                  }}
                  placeholder="Comma separated keywords"
                />

                {/* Only show retrieval context for RAG datasets */}
                {editingDataset?.datasetType === "rag" && (
                  <Field
                    label="Retrieval context"
                    value={(editablePrompts[selectedPromptIndex].retrieval_context || []).join("\n")}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      const next = [...editablePrompts];
                      next[selectedPromptIndex] = { ...next[selectedPromptIndex], retrieval_context: lines };
                      setEditablePrompts(next);
                    }}
                    placeholder="One entry per line"
                    type="description"
                  />
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Trash2 size={14} />}
                    onClick={() => {
                      if (selectedPromptIndex !== null) {
                        handleDeletePrompt(selectedPromptIndex);
                      }
                    }}
                    sx={{
                      color: "#EF4444",
                      borderColor: "#FCA5A5",
                      "&:hover": { 
                        borderColor: "#EF4444", 
                        backgroundColor: "#FEE2E2" 
                      },
                      height: "34px",
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setPromptDrawerOpen(false);
                      setSelectedPromptIndex(null);
                    }}
                    sx={{
                      bgcolor: "#13715B",
                      "&:hover": { bgcolor: "#0F5E4B" },
                      height: "34px",
                      flex: 1,
                    }}
                  >
                    Done
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Drawer>
      </Box>
    );
  }

  // Default table view
  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
          Datasets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Datasets contain the prompts or conversations used to evaluate your models. Create custom datasets or use templates to get started quickly.
        </Typography>
      </Stack>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={handleFileChange}
      />

      {/* ButtonToggle for My datasets / Templates */}
      <Stack direction="row" alignItems="center" sx={{ marginBottom: "18px" }}>
        <ButtonToggle
          options={[
            { label: "My datasets", value: "my" },
            { label: "Templates", value: "templates" },
          ]}
          value={activeTab}
          onChange={(value) => {
            setActiveTab(value as "my" | "templates");
            setSelectedTemplate(null);
          }}
          height={34}
        />
      </Stack>

      {/* My datasets view */}
      {activeTab === "my" && (
        <>
          {/* Filters + search + upload + create */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ marginBottom: "18px" }}>
            <Stack direction="row" alignItems="center" gap={2}>
              <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
              <GroupBy
                options={[
                  { id: "name", label: "Name" },
                  { id: "prompts", label: "Prompts" },
                  { id: "createdAt", label: "Created" },
                ]}
                onGroupChange={() => {
                  /* Grouping behaviour can be added later */
                }}
              />
              <SearchBox
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={setSearchTerm}
                inputProps={{ "aria-label": "Search datasets" }}
                fullWidth={false}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <CustomizableButton
                variant="outlined"
                text={uploading ? "Uploading..." : "Upload dataset"}
                icon={<Upload size={16} />}
                onClick={handleUploadClick}
                isDisabled={uploading}
                sx={{
                  border: "1px solid #d0d5dd",
                  color: "#344054",
                  gap: 2,
                }}
              />
              <CustomizableButton
                variant="contained"
                text="Add dataset"
                icon={<Plus size={16} />}
                onClick={() => setCreateDatasetModalOpen(true)}
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
              />
            </Stack>
          </Stack>

          {/* Table of user datasets */}
          <Box mb={4}>
            <DatasetsTable
              rows={filteredDatasets.map((dataset): DatasetRow => ({
                key: dataset.path,
                name: dataset.name,
                path: dataset.path,
                useCase: dataset.use_case || dataset.datasetType,
                createdAt: dataset.createdAt,
                metadata: datasetMetadata[dataset.path],
              }))}
              onRowClick={(row) => {
                const dataset = filteredDatasets.find((d) => d.path === row.path);
                if (dataset) handleRowClick(dataset);
              }}
              onView={(row) => {
                const dataset = filteredDatasets.find((d) => d.path === row.path);
                if (dataset) handleViewPrompts(dataset);
              }}
              onEdit={(row) => {
                const dataset = filteredDatasets.find((d) => d.path === row.path);
                if (dataset) handleOpenInEditor(dataset);
              }}
              onDelete={(row) => {
                const dataset = filteredDatasets.find((d) => d.path === row.path);
                if (dataset) {
                  setDatasetToDelete(dataset);
                  setDeleteModalOpen(true);
                }
              }}
              loading={loading}
            />
          </Box>
        </>
      )}

      {/* Templates view */}
      {activeTab === "templates" && (
        <Box>
          {/* Filter + search toolbar */}
            <Stack direction="row" alignItems="center" gap={2} sx={{ marginBottom: "18px" }}>
              <FilterBy columns={templateFilterColumns} onFilterChange={handleTemplateFilterChange} />
              <GroupBy
                options={[
                  { id: "category", label: "Category" },
                  { id: "difficulty", label: "Difficulty" },
                ]}
                onGroupChange={() => {}}
              />
              <SearchBox
                placeholder="Search templates..."
                value={templateSearchTerm}
                onChange={setTemplateSearchTerm}
                inputProps={{ "aria-label": "Search templates" }}
                fullWidth={false}
              />
            </Stack>

            <TableContainer>
              <Table sx={singleTheme.tableStyles.primary.frame}>
                <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                  <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    {/* Sortable Dataset column - 20% */}
                    <TableCell
                      sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%", cursor: "pointer", userSelect: "none" }}
                      onClick={() => handleTemplateSort("name")}
                    >
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>DATASET</Typography>
                        <Box sx={{ color: templateSortConfig.key === "name" ? "#13715B" : "#9CA3AF", display: "flex", alignItems: "center" }}>
                          {templateSortConfig.key === "name" && templateSortConfig.direction === "asc" && <ChevronUp size={16} />}
                          {templateSortConfig.key === "name" && templateSortConfig.direction === "desc" && <ChevronDown size={16} />}
                          {templateSortConfig.key !== "name" && <ChevronsUpDown size={16} />}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Sortable Category column - 20% */}
                    <TableCell
                      sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%", cursor: "pointer", userSelect: "none", textAlign: "center" }}
                      onClick={() => handleTemplateSort("category")}
                    >
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>CATEGORY</Typography>
                        <Box sx={{ color: templateSortConfig.key === "category" ? "#13715B" : "#9CA3AF", display: "flex", alignItems: "center" }}>
                          {templateSortConfig.key === "category" && templateSortConfig.direction === "asc" && <ChevronUp size={16} />}
                          {templateSortConfig.key === "category" && templateSortConfig.direction === "desc" && <ChevronDown size={16} />}
                          {templateSortConfig.key !== "category" && <ChevronsUpDown size={16} />}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Sortable # Prompts column - 20% */}
                    <TableCell
                      sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%", cursor: "pointer", userSelect: "none", textAlign: "center" }}
                      onClick={() => handleTemplateSort("tests")}
                    >
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}># PROMPTS</Typography>
                        <Box sx={{ color: templateSortConfig.key === "tests" ? "#13715B" : "#9CA3AF", display: "flex", alignItems: "center" }}>
                          {templateSortConfig.key === "tests" && templateSortConfig.direction === "asc" && <ChevronUp size={16} />}
                          {templateSortConfig.key === "tests" && templateSortConfig.direction === "desc" && <ChevronDown size={16} />}
                          {templateSortConfig.key !== "tests" && <ChevronsUpDown size={16} />}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Sortable Difficulty column - 20% */}
                    <TableCell
                      sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%", cursor: "pointer", userSelect: "none", textAlign: "center" }}
                      onClick={() => handleTemplateSort("difficulty")}
                    >
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>DIFFICULTY</Typography>
                        <Box sx={{ color: templateSortConfig.key === "difficulty" ? "#13715B" : "#9CA3AF", display: "flex", alignItems: "center" }}>
                          {templateSortConfig.key === "difficulty" && templateSortConfig.direction === "asc" && <ChevronUp size={16} />}
                          {templateSortConfig.key === "difficulty" && templateSortConfig.direction === "desc" && <ChevronDown size={16} />}
                          {templateSortConfig.key !== "difficulty" && <ChevronsUpDown size={16} />}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* ACTION column - 20% */}
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%", textAlign: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>ACTION</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={24} sx={{ color: "#13715B" }} />
                      </TableCell>
                    </TableRow>
                  ) : paginatedTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {flattenedTemplates.length === 0 ? "No template datasets available" : "No templates match your search"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTemplates.map((ds) => {
                      // Calculate predominant difficulty label from the object
                      const getPredominantDifficultyLabel = (diff?: { easy: number; medium: number; hard: number }): string => {
                        if (!diff) return "-";
                        const total = diff.easy + diff.medium + diff.hard;
                        if (total === 0) return "-";
                        // Find which has the highest count
                        if (diff.hard >= diff.medium && diff.hard >= diff.easy) return "Hard";
                        if (diff.medium >= diff.easy) return "Medium";
                        return "Easy";
                      };
                      const getDifficultyStyles = (difficulty: string | undefined) => {
                        switch (difficulty) {
                          case "Easy":
                            return { backgroundColor: "#c8e6c9", color: "#388e3c" };
                          case "Medium":
                            return { backgroundColor: "#fff3e0", color: "#ef6c00" };
                          case "Hard":
                            return { backgroundColor: "#ffebee", color: "#c62828" };
                          default:
                            return { backgroundColor: "#e0e0e0", color: "#616161" };
                        }
                      };
                      const difficultyLabel = getPredominantDifficultyLabel(ds.difficulty);
                      return (
                        <TableRow
                          key={ds.key}
                          onClick={() => handleViewTemplate(ds)}
                          sx={{
                            ...singleTheme.tableStyles.primary.body.row,
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                        >
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                            <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{ds.name}</Typography>
                          </TableCell>
                          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                            <Chip
                              label={ds.category === "rag" ? "RAG" : ds.category === "chatbot" ? "Chatbot" : ds.category === "agent" ? "Agent" : ds.category === "safety" ? "Safety" : ds.category}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "11px",
                                backgroundColor:
                                  ds.category === "chatbot" ? "#DBEAFE" :
                                  ds.category === "rag" ? "#E0E7FF" :
                                  ds.category === "agent" ? "#FEF3C7" :
                                  "#FEE2E2",
                                color:
                                  ds.category === "chatbot" ? "#1E40AF" :
                                  ds.category === "rag" ? "#3730A3" :
                                  ds.category === "agent" ? "#92400E" :
                                  "#991B1B",
                                borderRadius: "4px",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                            <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                              {ds.test_count ?? "-"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                            <Chip
                              label={difficultyLabel}
                              size="small"
                              sx={{
                                ...getDifficultyStyles(difficultyLabel),
                                height: "22px",
                                fontSize: "11px",
                                fontWeight: 500,
                                borderRadius: "4px",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Copy size={14} />}
                              onClick={() => handleOpenCopyModal(ds)}
                              disabled={copyingTemplate}
                              sx={{
                                textTransform: "none",
                                fontSize: "12px",
                                height: "28px",
                                borderColor: "#d0d5dd",
                                color: "#344054",
                                "&:hover": {
                                  borderColor: "#13715B",
                                  color: "#13715B",
                                },
                              }}
                            >
                              Use
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                {filteredAndSortedTemplates.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        count={filteredAndSortedTemplates.length}
                        rowsPerPage={templateRowsPerPage}
                        page={templatePage}
                        onPageChange={handleTemplatePageChange}
                        onRowsPerPageChange={handleTemplateRowsPerPageChange}
                        ActionsComponent={TablePaginationActions}
                        sx={{
                          borderBottom: "none",
                          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                            fontSize: "12px",
                          },
                        }}
                      />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TableContainer>
        </Box>
      )}

      {/* Action menu popover */}
      <Popover
        open={Boolean(actionAnchor)}
        anchorEl={actionAnchor}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "4px",
              border: "1px solid #d0d5dd",
              boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              minWidth: "160px",
            },
          },
        }}
      >
        <List disablePadding>
          <ListItemButton
            onClick={() => actionDataset && handleViewPrompts(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Eye size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="View prompts"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => actionDataset && handleOpenInEditor(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Edit3 size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="Open in editor"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => actionDataset && handleRemoveDataset(actionDataset)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Trash2 size={16} color="#DC2626" />
            </ListItemIcon>
            <ListItemText
              primary="Remove dataset"
              primaryTypographyProps={{ fontSize: "13px", color: "#DC2626" }}
            />
          </ListItemButton>
        </List>
      </Popover>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete this dataset?"
        body={`Are you sure you want to remove "${datasetToDelete?.name || "this dataset"}" from your project? This action cannot be undone.`}
        cancelText="Cancel"
        proceedText="Delete"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDatasetToDelete(null);
        }}
        onProceed={handleConfirmDelete}
        proceedButtonColor="error"
        proceedButtonVariant="contained"
      />

      {/* Copy template confirmation modal */}
      <ConfirmationModal
        isOpen={copyModalOpen}
        title="Copy to my datasets?"
        TitleFontSize={16}
        body={
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            This will copy &quot;{templateToCopy?.name || "this template"}&quot; to your datasets. You can then edit and use it in your experiments.
          </Typography>
        }
        cancelText="Cancel"
        proceedText="Copy"
        onCancel={() => {
          setCopyModalOpen(false);
          setTemplateToCopy(null);
        }}
        onProceed={handleConfirmCopy}
        proceedButtonColor="primary"
        proceedButtonVariant="contained"
      />

      {/* Upload instructions modal */}
      <ModalStandard
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload dataset"
        description="Upload a custom dataset in JSON format for your evaluations"
        onSubmit={handleFileSelect}
        submitButtonText="Choose file"
        isSubmitting={false}
      >
        <Stack spacing={3}>
          {/* Dataset type selector */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px", mb: 1.5 }}>
              Dataset type
            </Typography>
            <Stack direction="row" spacing={1}>
              {(["chatbot", "rag", "agent"] as const).map((type) => (
                <Chip
                  key={type}
                  label={type === "rag" ? "RAG" : type.charAt(0).toUpperCase() + type.slice(1)}
                  onClick={() => setExampleDatasetType(type)}
                  sx={{
                    cursor: "pointer",
                    height: 28,
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: exampleDatasetType === type
                      ? type === "chatbot" ? "#DBEAFE"
                        : type === "rag" ? "#E0E7FF"
                        : "#FEF3C7"
                      : "#F3F4F6",
                    color: exampleDatasetType === type
                      ? type === "chatbot" ? "#1E40AF"
                        : type === "rag" ? "#3730A3"
                        : "#92400E"
                      : "#6B7280",
                    border: exampleDatasetType === type ? "1px solid" : "1px solid transparent",
                    borderColor: exampleDatasetType === type
                      ? type === "chatbot" ? "#3B82F6"
                        : type === "rag" ? "#6366F1"
                        : "#F59E0B"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: type === "chatbot" ? "#DBEAFE"
                        : type === "rag" ? "#E0E7FF"
                        : "#FEF3C7",
                    },
                  }}
                />
              ))}
            </Stack>
            <Typography variant="body2" sx={{ fontSize: "12px", color: "#6B7280", mt: 1 }}>
              {exampleDatasetType === "chatbot" && "Standard Q&A datasets for evaluating chatbot responses."}
              {exampleDatasetType === "rag" && "Datasets with retrieval_context for RAG faithfulness & relevancy metrics."}
              {exampleDatasetType === "agent" && "Datasets with tools_available for evaluating agent task completion."}
            </Typography>
          </Box>

          {/* JSON structure based on type */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px" }}>
                JSON structure for {exampleDatasetType === "rag" ? "RAG" : exampleDatasetType.charAt(0).toUpperCase() + exampleDatasetType.slice(1)}
              </Typography>
              <Button
                size="small"
                startIcon={<Download size={14} />}
                onClick={() => handleDownloadExample(exampleDatasetType)}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  color: "#13715B",
                  "&:hover": {
                    backgroundColor: "rgba(19, 113, 91, 0.08)",
                  },
                }}
              >
                Download example
              </Button>
            </Box>
            <Box
              sx={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                p: 2,
                fontFamily: "monospace",
                fontSize: "11px",
                overflow: "auto",
                maxHeight: "200px",
              }}
            >
              <pre style={{ margin: 0 }}>
{exampleDatasetType === "chatbot" ? `[
  {
    "id": "chatbot_001",
    "category": "general_knowledge",
    "prompt": "What is machine learning?",
    "expected_output": "Machine learning is...",
    "expected_keywords": ["algorithm", "data"],
    "difficulty": "easy"
  }
]` : exampleDatasetType === "rag" ? `[
  {
    "id": "rag_001",
    "category": "document_qa",
    "prompt": "What are the key benefits?",
    "expected_output": "The key benefits are...",
    "expected_keywords": ["benefit", "advantage"],
    "difficulty": "medium",
    "retrieval_context": [
      "Context document 1...",
      "Context document 2..."
    ]
  }
]` : `[
  {
    "id": "agent_001",
    "category": "task_execution",
    "prompt": "Search for weather in NYC",
    "expected_output": "The weather in NYC is...",
    "expected_keywords": ["weather", "NYC"],
    "difficulty": "medium",
    "tools_available": ["web_search", "calculator"],
    "expected_tools": ["web_search"]
  }
]`}
              </pre>
            </Box>
          </Box>

          {/* Field descriptions based on type */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "13px", mb: 1 }}>
              Field descriptions
            </Typography>
            <Stack spacing={0.75}>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  id
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) Unique identifier
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  prompt
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) The input question or task
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  expected_output
                </Typography>
                <Typography component="span" sx={{ fontSize: "12px", color: "text.secondary", ml: 1 }}>
                  (required) Expected model response
                </Typography>
              </Box>
              {exampleDatasetType === "rag" && (
                <Box sx={{ backgroundColor: "#EEF2FF", p: 1, borderRadius: 1, mt: 0.5 }}>
                  <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace", color: "#4338CA" }}>
                    retrieval_context
                  </Typography>
                  <Typography component="span" sx={{ fontSize: "12px", color: "#4338CA", ml: 1 }}>
                    (required for RAG) Array of retrieved context documents
                  </Typography>
                </Box>
              )}
              {exampleDatasetType === "agent" && (
                <>
                  <Box sx={{ backgroundColor: "#FEF3C7", p: 1, borderRadius: 1, mt: 0.5 }}>
                    <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace", color: "#92400E" }}>
                      tools_available
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "12px", color: "#92400E", ml: 1 }}>
                      (recommended) List of tools the agent can use
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: "#FEF3C7", p: 1, borderRadius: 1 }}>
                    <Typography component="span" sx={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace", color: "#92400E" }}>
                      expected_tools
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "12px", color: "#92400E", ml: 1 }}>
                      (recommended) Expected tools to be called
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </ModalStandard>

      {/* Dataset Content Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <Stack
          sx={{
            width: 700,
            maxHeight: "100vh",
            overflowY: "auto",
            p: theme.spacing(10),
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Database size={18} color="#13715B" />
              <Typography fontWeight={600} color={theme.palette.text.primary}>
                {selectedDataset?.name || "Dataset"}
              </Typography>
              {datasetPrompts.length > 0 && (
                <Chip
                  label={`${datasetPrompts.length} prompts`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "11px",
                    backgroundColor: "#E5E7EB",
                    color: "#374151",
                    borderRadius: "4px",
                  }}
                />
              )}
            </Stack>
            <Box onClick={handleCloseDrawer} sx={{ cursor: "pointer" }}>
              <X size={20} color={theme.palette.text.secondary} />
            </Box>
          </Stack>
          <Divider sx={{ mb: 4, mx: `calc(-1 * ${theme.spacing(10)})` }} />

          {/* Loading State */}
          {loadingPrompts && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#13715B" }} />
            </Box>
          )}

          {/* Empty State */}
          {!loadingPrompts && datasetPrompts.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="body2" color="text.secondary">
                No prompts found in this dataset.
              </Typography>
            </Box>
          )}

          {/* Dataset Prompts Table */}
          {!loadingPrompts && datasetPrompts.length > 0 && (
            <TableContainer>
              <Table sx={{ ...singleTheme.tableStyles.primary.frame, tableLayout: "fixed" }}>
                <TableHead
                  sx={{
                    backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
                  }}
                >
                  <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "100px" }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "360px" }}>
                      Prompt
                    </TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "80px" }}>
                      Difficulty
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasetPrompts.map((prompt: DatasetPromptRecord, index: number) => (
                    <TableRow
                      key={prompt.id || index}
                      sx={singleTheme.tableStyles.primary.body.row}
                    >
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }}>
                          {prompt.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Chip
                          label={prompt.category}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "11px",
                            backgroundColor: "#E5E7EB",
                            color: "#374151",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: theme.palette.text.primary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {prompt.prompt}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        {prompt.difficulty && (
                          <Chip
                            label={prompt.difficulty}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "10px",
                              fontWeight: 500,
                              backgroundColor:
                                prompt.difficulty === "easy" ? "#D1FAE5" :
                                prompt.difficulty === "medium" ? "#FEF3C7" :
                                prompt.difficulty === "hard" ? "#FEE2E2" : "#E5E7EB",
                              color:
                                prompt.difficulty === "easy" ? "#065F46" :
                                prompt.difficulty === "medium" ? "#92400E" :
                                prompt.difficulty === "hard" ? "#991B1B" : "#374151",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Drawer>

      {/* Template Content Drawer */}
      <Drawer anchor="right" open={templateDrawerOpen} onClose={handleCloseTemplateDrawer}>
        <Stack
          sx={{
            width: 700,
            maxHeight: "100vh",
            overflowY: "auto",
            p: theme.spacing(10),
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Database size={18} color="#13715B" />
              <Typography fontWeight={600} color={theme.palette.text.primary}>
                {selectedTemplate?.name || "Template"}
              </Typography>
              {templatePrompts.length > 0 && (
                <Chip
                  label={`${templatePrompts.length} prompts`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "11px",
                    backgroundColor: "#E5E7EB",
                    color: "#374151",
                    borderRadius: "4px",
                  }}
                />
              )}
            </Stack>
            <Box onClick={handleCloseTemplateDrawer} sx={{ cursor: "pointer" }}>
              <X size={20} color={theme.palette.text.secondary} />
            </Box>
          </Stack>
          <Divider sx={{ mb: 4, mx: `calc(-1 * ${theme.spacing(10)})` }} />

          {/* Loading State */}
          {loadingTemplatePrompts && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#13715B" }} />
            </Box>
          )}

          {/* Empty State */}
          {!loadingTemplatePrompts && templatePrompts.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 12,
                px: 4,
                textAlign: "center",
              }}
            >
              <Database size={48} color="#9CA3AF" />
              <Typography sx={{ mt: 2, color: "#6B7280", fontWeight: 500 }}>
                No prompts found
              </Typography>
              <Typography sx={{ mt: 0.5, color: "#9CA3AF", fontSize: "13px" }}>
                This template doesn&apos;t contain any prompts
              </Typography>
            </Box>
          )}

          {/* Prompts Table */}
          {!loadingTemplatePrompts && templatePrompts.length > 0 && (
            <TableContainer sx={{ maxWidth: "100%", overflowX: "hidden" }}>
              <Table sx={{ ...singleTheme.tableStyles.primary.frame, tableLayout: "fixed", width: "100%" }}>
                <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                  <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "8%" }}>#</TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "22%" }}>Category</TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "48%" }}>Prompt</TableCell>
                    <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "22%" }}>Difficulty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templatePrompts.map((prompt, index) => {
                    const promptKey = prompt.id || `prompt-${index}`;
                    const isExpanded = expandedPromptIds.has(promptKey);
                    const isLongPrompt = prompt.prompt.length > 40;
                    
                    return (
                      <TableRow 
                        key={promptKey} 
                        onClick={() => {
                          if (isLongPrompt) {
                            setExpandedPromptIds(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(promptKey)) {
                                newSet.delete(promptKey);
                              } else {
                                newSet.add(promptKey);
                              }
                              return newSet;
                            });
                          }
                        }}
                        sx={{ 
                          ...singleTheme.tableStyles.primary.body.row, 
                          cursor: isLongPrompt ? "pointer" : "default",
                          "&:hover": isLongPrompt ? { backgroundColor: "#F9FAFB" } : {},
                          verticalAlign: "top",
                        }}
                      >
                        <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, width: "8%", verticalAlign: "top", pt: 1.5 }}>
                          <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>{index + 1}</Typography>
                        </TableCell>
                        <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, width: "22%", overflow: "hidden", verticalAlign: "top", pt: 1.5 }}>
                          <Chip
                            label={prompt.category?.length > 8 ? `${prompt.category.substring(0, 8)}...` : prompt.category}
                            title={prompt.category}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "10px",
                              backgroundColor: "#E5E7EB",
                              color: "#374151",
                              borderRadius: "4px",
                              maxWidth: "100%",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, width: "48%", overflow: "hidden", verticalAlign: "top", pt: 1.5 }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              color: theme.palette.text.primary,
                              overflow: isExpanded ? "visible" : "hidden",
                              textOverflow: isExpanded ? "clip" : "ellipsis",
                              whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
                              maxWidth: "100%",
                              wordBreak: isExpanded ? "break-word" : "normal",
                              lineHeight: 1.5,
                            }}
                            title={isExpanded ? undefined : prompt.prompt}
                          >
                            {isExpanded ? prompt.prompt : (isLongPrompt ? `${prompt.prompt.substring(0, 40)}...` : prompt.prompt)}
                          </Typography>
                          {isLongPrompt && (
                            <Typography sx={{ fontSize: "11px", color: "#9CA3AF", mt: 0.5 }}>
                              {isExpanded ? "Collapse" : "Expand"}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, width: "22%", verticalAlign: "top", pt: 1.5 }}>
                          {prompt.difficulty && (
                            <Chip
                              label={prompt.difficulty}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "10px",
                                fontWeight: 500,
                                backgroundColor:
                                  prompt.difficulty === "easy" ? "#D1FAE5" :
                                  prompt.difficulty === "medium" ? "#FEF3C7" :
                                  prompt.difficulty === "hard" ? "#FEE2E2" : "#E5E7EB",
                                color:
                                  prompt.difficulty === "easy" ? "#065F46" :
                                  prompt.difficulty === "medium" ? "#92400E" :
                                  prompt.difficulty === "hard" ? "#991B1B" : "#374151",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Copy Button */}
          {!loadingTemplatePrompts && templatePrompts.length > 0 && selectedTemplate && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Copy size={14} />}
              onClick={() => handleOpenCopyModal(selectedTemplate)}
              disabled={copyingTemplate}
              sx={{
                mt: 4,
                textTransform: "none",
                bgcolor: "#13715B",
                "&:hover": { bgcolor: "#0F5E4B" },
                height: "40px",
              }}
            >
              {copyingTemplate ? "Copying..." : "Copy to my datasets"}
            </Button>
          )}
        </Stack>
      </Drawer>

      {/* Create Dataset Modal - Choice between Editor and Upload */}
      {createDatasetModalOpen && (
        <>
          <Box
            onClick={() => setCreateDatasetModalOpen(false)}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1299,
            }}
          />
          <Box
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1300,
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              width: "100%",
              maxWidth: "480px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: "1px solid #E5E7EB" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: "16px", color: "#111827" }}>
                    Add dataset
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.5 }}>
                    Choose how you want to add a new dataset
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setCreateDatasetModalOpen(false)}
                  size="small"
                  sx={{ color: "#9CA3AF", "&:hover": { color: "#6B7280" } }}
                >
                  <X size={20} />
                </IconButton>
              </Stack>
            </Box>

            {/* Options */}
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {/* Create from scratch option */}
                <Box
                  onClick={() => {
                    setCreateDatasetModalOpen(false);
                    setEditablePrompts([{
                      id: "prompt_1",
                      category: "general",
                      prompt: "",
                      expected_output: "",
                    }]);
                    setEditDatasetName("");
                    setEditingDataset({ key: "new", name: "New Dataset", path: "", use_case: exampleDatasetType, datasetType: exampleDatasetType });
                    setEditorOpen(true);
                  }}
                  sx={{
                    p: 2,
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#13715B",
                      backgroundColor: "#F7FAF9",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        backgroundColor: "#E8F5F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Edit3 size={22} color="#13715B" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#111827", mb: 0.25 }}>
                        Create from scratch
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                        Use the editor to manually add prompts
                      </Typography>
                    </Box>
                    <Box sx={{ color: "#9CA3AF" }}>→</Box>
                  </Stack>
                </Box>

                {/* Upload JSON option */}
                <Box
                  onClick={() => {
                    setCreateDatasetModalOpen(false);
                    setUploadModalOpen(true);
                  }}
                  sx={{
                    p: 2,
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#4F46E5",
                      backgroundColor: "#F5F5FF",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        backgroundColor: "#EEF2FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Upload size={22} color="#4F46E5" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#111827", mb: 0.25 }}>
                        Upload JSON file
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                        Import existing dataset in JSON format
                      </Typography>
                    </Box>
                    <Box sx={{ color: "#9CA3AF" }}>→</Box>
                  </Stack>
                </Box>

                {/* Use template option */}
                <Box
                  onClick={() => {
                    setCreateDatasetModalOpen(false);
                    setActiveTab("templates");
                  }}
                  sx={{
                    p: 2,
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#D97706",
                      backgroundColor: "#FFFBEB",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        backgroundColor: "#FEF3C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Database size={22} color="#D97706" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#111827", mb: 0.25 }}>
                        Start from template
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                        Browse pre-built evaluation templates
                      </Typography>
                    </Box>
                    <Box sx={{ color: "#9CA3AF" }}>→</Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
