import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { Info as GreyCircleInfoIcon } from "lucide-react";
import { cardStyles } from "../../../themes";
import { CEMarkingData, ConformityStepStatus, ConformityStep } from "../../../../domain/types/ceMarking";
import VWLink from "../../../components/Link/VWLink";
import Select from "../../../components/Inputs/Select";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import StandardModal from "../../../components/Modals/StandardModal";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import VWTooltip from "../../../components/VWTooltip";
import Checkbox from "../../../components/Inputs/Checkbox";
import { ceMarkingService } from "../../../../infrastructure/api/ceMarkingService";
import { showAlert as showGlobalAlert } from "../../../../infrastructure/api/customAxios";

interface CEMarkingProps {
  projectId: string;
}

// Annex III Category options
const ANNEX_III_OPTIONS = [
  { _id: "annex_iii_1", name: "Annex III 1 – Biometric identification and categorisation of natural persons" },
  { _id: "annex_iii_2", name: "Annex III 2 – Management and operation of critical infrastructure" },
  { _id: "annex_iii_3", name: "Annex III 3 – Education and vocational training" },
  { _id: "annex_iii_4", name: "Annex III 4 – Employment, workers management and access to self employment" },
  { _id: "annex_iii_5", name: "Annex III 5 – Access to essential private and public services and benefits" },
  { _id: "annex_iii_6", name: "Annex III 6 – Law enforcement" },
  { _id: "annex_iii_7", name: "Annex III 7 – Migration, asylum and border control management" },
  { _id: "annex_iii_8", name: "Annex III 8 – Administration of justice and democratic processes" },
];

// Role in Product options
const ROLE_IN_PRODUCT_OPTIONS = [
  { _id: "standalone", name: "Standalone AI system" },
  { _id: "safety_component", name: "Safety component of a product" },
  { _id: "component_larger", name: "Component in a larger AI product or workflow" },
  { _id: "foundation_model", name: "General purpose or foundation model integrated into a downstream system" },
];

// Owner options - mock data (would come from API in production)
const OWNER_OPTIONS = [
  { _id: "alice_smith", name: "Alice Smith" },
  { _id: "bob_lee", name: "Bob Lee" },
  { _id: "carol_johnson", name: "Carol Johnson" },
  { _id: "david_brown", name: "David Brown" },
];

// Status options for dropdown
const STATUS_OPTIONS = [
  { _id: ConformityStepStatus.Completed, name: ConformityStepStatus.Completed },
  { _id: ConformityStepStatus.InProgress, name: ConformityStepStatus.InProgress },
  { _id: ConformityStepStatus.NotStarted, name: ConformityStepStatus.NotStarted },
  { _id: ConformityStepStatus.NotNeeded, name: ConformityStepStatus.NotNeeded },
];

// Declaration status options
const DECLARATION_STATUS_OPTIONS = [
  { _id: "draft", name: "Draft" },
  { _id: "ready_for_signature", name: "Ready for signature" },
  { _id: "signed", name: "Signed" },
  { _id: "archived", name: "Archived" },
];

// Registration status options
const REGISTRATION_STATUS_OPTIONS = [
  { _id: "not_registered", name: "Not registered" },
  { _id: "pending", name: "Pending" },
  { _id: "registered", name: "Registered" },
  { _id: "rejected", name: "Rejected" },
];

// Helper function to format status for display
const formatStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'ready_for_signature': 'Ready for signature',
    'signed': 'Signed',
    'archived': 'Archived',
    'not_registered': 'Not registered',
    'pending': 'Pending',
    'registered': 'Registered',
    'rejected': 'Rejected'
  };
  return statusMap[status] || status;
};

// Get placeholder text for each step's description
const getDescriptionPlaceholder = (stepName: string): string => {
  const placeholders: Record<string, string> = {
    "Confirm high risk classification": "Describe the methodology and criteria used to classify this AI system as high-risk, including references to relevant Annex III categories and any supporting documentation.",
    "Complete EU AI Act checklist": "Document the progress of completing all required EU AI Act controls and assessments, noting any outstanding items or blockers that need attention.",
    "Compile technical documentation file": "Outline the structure and contents of the technical documentation, including system specifications, training data information, risk management measures, and quality management systems.",
    "Internal review and sign off": "Detail the internal review process, including stakeholders involved, review criteria, findings, and required approvals before proceeding to external assessment.",
    "Notified body review": "Provide information about the selected notified body, scope of review, timeline, and any specific requirements or documentation they have requested.",
    "Sign declaration of conformity": "Note the responsible parties for signing, legal requirements, and any pre-signing checks or validations that must be completed.",
    "Register in EU database": "Record the registration process details, including database URL, registration ID, submission date, and any follow-up requirements or renewal dates.",
  };

  return placeholders[stepName] || "Provide a detailed description of this conformity assessment step, including objectives, deliverables, and success criteria.";
};

// Table styles - using the primary theme table styles
const getTableHeaderRowStyles = () => ({
  textTransform: "uppercase",
  borderBottom: "1px solid #d0d5dd",
  background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
});

const getTableHeaderCellStyles = () => ({
  color: "#475467",
  fontSize: "13px",
  fontWeight: 400,
  padding: "12px 10px",
  whiteSpace: "nowrap",
});

const getTableBodyRowStyles = () => ({
  textTransform: "capitalize",
  borderBottom: "1px solid #d0d5dd",
  backgroundColor: "white",
  transition: "background-color 0.3s ease-in-out",
  "&:hover td": {
    backgroundColor: "#fafafa",
  },
  "&:hover": {
    cursor: "pointer",
  },
});

const getTableBodyCellStyles = () => ({
  fontSize: "13px",
  padding: "12px 10px",
  whiteSpace: "nowrap",
  backgroundColor: "white",
});


const getStatusColor = (status: ConformityStepStatus): string => {
  switch (status) {
    case ConformityStepStatus.Completed:
      return "#10B981";
    case ConformityStepStatus.InProgress:
      return "#3B82F6";
    case ConformityStepStatus.NotStarted:
      return "#6B7280";
    case ConformityStepStatus.NotNeeded:
      return "#9CA3AF";
    default:
      return "#6B7280";
  }
};

const getStatusBgColor = (status: ConformityStepStatus): string => {
  switch (status) {
    case ConformityStepStatus.Completed:
      return "#10B98120";
    case ConformityStepStatus.InProgress:
      return "#3B82F620";
    case ConformityStepStatus.NotStarted:
      return "#6B728020";
    case ConformityStepStatus.NotNeeded:
      return "#9CA3AF20";
    default:
      return "#6B728020";
  }
};

const CEMarking: React.FC<CEMarkingProps> = ({ projectId }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CEMarkingData | null>(null);

  // State for editable fields
  const [annexIIICategory, setAnnexIIICategory] = useState<string>("annex_iii_5");
  const [roleInProduct, setRoleInProduct] = useState<string>("standalone");

  // Modal state for editing conformity steps
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ConformityStep | null>(null);
  const [stepEditForm, setStepEditForm] = useState({
    description: "",
    status: ConformityStepStatus.NotStarted,
    owner: "",
    dueDate: null as Dayjs | null,
    completedDate: null as Dayjs | null,
  });

  // Modal state for editing declaration
  const [isDeclarationModalOpen, setIsDeclarationModalOpen] = useState(false);
  const [declarationEditForm, setDeclarationEditForm] = useState({
    status: "",
    signedOn: null as Dayjs | null,
    signatory: "",
    declarationDocument: "",
  });

  // Modal state for editing EU registration
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationEditForm, setRegistrationEditForm] = useState({
    status: "",
    euRegistrationId: "",
    registrationDate: null as Dayjs | null,
    euRecordUrl: "",
  });

  // Modal state for linking policies
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [availablePolicies, setAvailablePolicies] = useState<any[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Modal state for linking evidences
  const [isEvidencesModalOpen, setIsEvidencesModalOpen] = useState(false);
  const [availableEvidences, setAvailableEvidences] = useState<any[]>([]);
  const [selectedEvidences, setSelectedEvidences] = useState<number[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);

  // Modal state for linking incidents
  const [isIncidentsModalOpen, setIsIncidentsModalOpen] = useState(false);
  const [availableIncidents, setAvailableIncidents] = useState<any[]>([]);
  const [selectedIncidents, setSelectedIncidents] = useState<number[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Fetch CE Marking data on mount
  useEffect(() => {
    fetchCEMarkingData();
  }, [projectId]);

  // Auto-fill completed date when status changes to Completed
  useEffect(() => {
    if (stepEditForm.status === ConformityStepStatus.Completed && !stepEditForm.completedDate) {
      setStepEditForm((prev) => ({ ...prev, completedDate: dayjs() }));
    }
  }, [stepEditForm.status]);

  const fetchCEMarkingData = async () => {
    try {
      setLoading(true);
      const ceMarkingData = await ceMarkingService.getCEMarking(projectId);
      setData(ceMarkingData);
      setAnnexIIICategory(ceMarkingData.annexIIICategory || "annex_iii_5");
      setRoleInProduct(ceMarkingData.roleInProduct || "standalone");
    } catch (error) {
      console.error("Error fetching CE Marking data:", error);
      showAlert("Failed to load CE Marking data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, variant: "success" | "error" | "info" | "warning" = "success") => {
    showGlobalAlert({
      variant,
      title: variant === "error" ? "Error" : "Success",
      body: message,
      isToast: true
    });
  };

  const handleViewChecklist = () => {
    // Navigate to the Frameworks/regulations tab with EU AI Act framework
    navigate(`/project-view?projectId=${projectId}&tab=frameworks&framework=eu-ai-act`);
  };

  const handleAnnexIIICategoryChange = async (event: any) => {
    const newValue = event.target.value;
    setAnnexIIICategory(newValue);

    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateClassificationAndScope(projectId, {
        annexIIICategory: newValue,
      });
      setData(updatedData);
      showAlert("Annex III category updated successfully");
    } catch (error) {
      console.error("Error updating Annex III category:", error);
      showAlert("Failed to update Annex III category", "error");
      // Revert on error
      setAnnexIIICategory(data?.annexIIICategory || "annex_iii_5");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleInProductChange = async (event: any) => {
    const newValue = event.target.value;
    setRoleInProduct(newValue);

    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateClassificationAndScope(projectId, {
        roleInProduct: newValue,
      });
      setData(updatedData);
      showAlert("Role in product updated successfully");
    } catch (error) {
      console.error("Error updating role in product:", error);
      showAlert("Failed to update role in product", "error");
      // Revert on error
      setRoleInProduct(data?.roleInProduct || "standalone");
    } finally {
      setSaving(false);
    }
  };

  const handleStepClick = (step: ConformityStep) => {
    setSelectedStep(step);
    setStepEditForm({
      description: step.description || "",
      status: step.status,
      owner: step.owner || "",
      dueDate: step.dueDate ? dayjs(step.dueDate) : null,
      completedDate: step.completedDate ? dayjs(step.completedDate) : null,
    });
    setIsStepModalOpen(true);
  };

  const handleStepModalClose = () => {
    setIsStepModalOpen(false);
    setSelectedStep(null);
    setStepEditForm({
      description: "",
      status: ConformityStepStatus.NotStarted,
      owner: "",
      dueDate: null,
      completedDate: null,
    });
  };

  const handleStepModalSave = async () => {
    if (!selectedStep) return;

    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateConformityStep(
        projectId,
        selectedStep.id,
        {
          description: stepEditForm.description,
          status: stepEditForm.status,
          owner: stepEditForm.owner,
          dueDate: stepEditForm.dueDate ? stepEditForm.dueDate.format("YYYY-MM-DD") : null,
          completedDate: stepEditForm.completedDate ? stepEditForm.completedDate.format("YYYY-MM-DD") : null,
        }
      );

      setData(updatedData);
      showAlert("Conformity step updated successfully");
      handleStepModalClose();
    } catch (error) {
      console.error("Error updating conformity step:", error);
      showAlert("Failed to update conformity step", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeclarationClick = () => {
    if (data) {
      setDeclarationEditForm({
        status: data.declarationStatus,
        signedOn: data.signedOn ? dayjs(data.signedOn) : null,
        signatory: data.signatory || "",
        declarationDocument: data.declarationDocument || "",
      });
      setIsDeclarationModalOpen(true);
    }
  };

  const handleDeclarationModalClose = () => {
    setIsDeclarationModalOpen(false);
    setDeclarationEditForm({
      status: "",
      signedOn: null,
      signatory: "",
      declarationDocument: "",
    });
  };

  const handleDeclarationModalSave = async () => {
    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateDeclaration(
        projectId,
        {
          declarationStatus: declarationEditForm.status,
          signedOn: declarationEditForm.signedOn ? declarationEditForm.signedOn.format("YYYY-MM-DD") : null,
          signatory: declarationEditForm.signatory,
          declarationDocument: declarationEditForm.declarationDocument,
        }
      );

      setData(updatedData);
      showAlert("Declaration details updated successfully");
      handleDeclarationModalClose();
    } catch (error) {
      console.error("Error updating declaration:", error);
      showAlert("Failed to update declaration details", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrationClick = () => {
    if (data) {
      setRegistrationEditForm({
        status: data.registrationStatus,
        euRegistrationId: data.euRegistrationId || "",
        registrationDate: data.registrationDate ? dayjs(data.registrationDate) : null,
        euRecordUrl: data.euRecordUrl || "",
      });
      setIsRegistrationModalOpen(true);
    }
  };

  const handleRegistrationModalClose = () => {
    setIsRegistrationModalOpen(false);
    setRegistrationEditForm({
      status: "",
      euRegistrationId: "",
      registrationDate: null,
      euRecordUrl: "",
    });
  };

  const handleRegistrationModalSave = async () => {
    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateRegistration(
        projectId,
        {
          registrationStatus: registrationEditForm.status,
          euRegistrationId: registrationEditForm.euRegistrationId,
          registrationDate: registrationEditForm.registrationDate ? registrationEditForm.registrationDate.format("YYYY-MM-DD") : null,
          euRecordUrl: registrationEditForm.euRecordUrl,
        }
      );

      setData(updatedData);
      showAlert("EU registration details updated successfully");
      handleRegistrationModalClose();
    } catch (error) {
      console.error("Error updating registration:", error);
      showAlert("Failed to update EU registration details", "error");
    } finally {
      setSaving(false);
    }
  };

  // Policies modal handlers
  const handleOpenPoliciesModal = async () => {
    setIsPoliciesModalOpen(true);
    setLoadingPolicies(true);
    try {
      const policies = await ceMarkingService.getAllPolicies();
      setAvailablePolicies(policies || []);
      // Set currently linked policies as selected
      setSelectedPolicies(data?.linkedPolicies || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      showAlert("Failed to load policies", "error");
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleClosePoliciesModal = () => {
    setIsPoliciesModalOpen(false);
    setSelectedPolicies([]);
  };

  const handleSavePolicies = async () => {
    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateLinkedPolicies(projectId, selectedPolicies);
      setData(updatedData);
      showAlert("Linked policies updated successfully");
      handleClosePoliciesModal();
    } catch (error) {
      console.error("Error updating linked policies:", error);
      showAlert("Failed to update linked policies", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePolicy = (policyId: number) => {
    setSelectedPolicies(prev =>
      prev.includes(policyId)
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  // Evidence modal handlers
  const handleOpenEvidencesModal = async () => {
    setIsEvidencesModalOpen(true);
    setLoadingEvidences(true);
    try {
      const evidences = await ceMarkingService.getAllEvidences();
      setAvailableEvidences(evidences || []);
      // Set currently linked evidence as selected
      setSelectedEvidences(data?.linkedEvidences || []);
    } catch (error) {
      console.error("Error fetching evidence:", error);
      showAlert("Failed to load evidence", "error");
    } finally {
      setLoadingEvidences(false);
    }
  };

  const handleCloseEvidencesModal = () => {
    setIsEvidencesModalOpen(false);
    setSelectedEvidences([]);
  };

  const handleSaveEvidences = async () => {
    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateLinkedEvidences(projectId, selectedEvidences);
      setData(updatedData);
      showAlert("Linked evidence updated successfully");
      handleCloseEvidencesModal();
    } catch (error) {
      console.error("Error updating linked evidence:", error);
      showAlert("Failed to update linked evidence", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleEvidence = (evidenceId: number) => {
    setSelectedEvidences(prev =>
      prev.includes(evidenceId)
        ? prev.filter(id => id !== evidenceId)
        : [...prev, evidenceId]
    );
  };

  // Incidents modal handlers
  const handleOpenIncidentsModal = async () => {
    setIsIncidentsModalOpen(true);
    setLoadingIncidents(true);
    try {
      const incidents = await ceMarkingService.getAllIncidents();
      setAvailableIncidents(incidents || []);
      // Set currently linked incidents as selected
      setSelectedIncidents(data?.linkedIncidents || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      showAlert("Failed to load incidents", "error");
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleCloseIncidentsModal = () => {
    setIsIncidentsModalOpen(false);
    setSelectedIncidents([]);
  };

  const handleSaveIncidents = async () => {
    try {
      setSaving(true);
      const updatedData = await ceMarkingService.updateLinkedIncidents(projectId, selectedIncidents);
      setData(updatedData);
      showAlert("Linked incidents updated successfully");
      handleCloseIncidentsModal();
    } catch (error) {
      console.error("Error updating linked incidents:", error);
      showAlert("Failed to update linked incidents", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleIncident = (incidentId: number) => {
    setSelectedIncidents(prev =>
      prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle null data case (shouldn't happen as backend creates default record)
  if (!data) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
          Unable to load CE Marking data. Please refresh the page or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Explanation */}
      <Box sx={{ marginBottom: 1 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 400,
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          Track your EU AI Act conformity assessment journey. High-risk AI systems require CE marking before being placed on the EU market, demonstrating compliance with safety, transparency, and fundamental rights requirements.
        </Typography>
      </Box>

      {/* Top Row: Classification and EU AI Act Completion */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: "16px",
        }}
      >
        {/* Classification and scope */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              Classification and scope
            </Typography>

            <Stack sx={{ gap: "8px" }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  HIGH RISK AI SYSTEM
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.isHighRiskAISystem ? "Yes" : "No"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  ANNEX III CATEGORY
                </Typography>
                <Select
                  id="annex-iii-category"
                  value={annexIIICategory}
                  items={ANNEX_III_OPTIONS}
                  onChange={handleAnnexIIICategoryChange}
                  disabled={saving}
                  sx={{ width: "100%" }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  ROLE IN PRODUCT
                </Typography>
                <Select
                  id="role-in-product"
                  value={roleInProduct}
                  items={ROLE_IN_PRODUCT_OPTIONS}
                  onChange={handleRoleInProductChange}
                  disabled={saving}
                  sx={{ width: "100%" }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  INTENDED PURPOSE
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.intendedPurpose}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* EU AI Act completion */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 1,
              }}
            >
              EU AI Act completion
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 400,
                color: theme.palette.text.tertiary,
                marginBottom: 2,
              }}
            >
              Summary of this use case against your EU AI Act mappings.
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ marginBottom: 1 }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 400, color: theme.palette.text.secondary }}
                  >
                    Controls. {data.controlsCompleted} of {data.controlsTotal} completed
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}
                  >
                    {data.controlsTotal > 0 ? Math.round((data.controlsCompleted / data.controlsTotal) * 100) : 0}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data.controlsTotal > 0 ? (data.controlsCompleted / data.controlsTotal) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#F3F4F6",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#FBBF24",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ marginBottom: 1 }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 400, color: theme.palette.text.secondary }}
                  >
                    Assessments. {data.assessmentsCompleted} of {data.assessmentsTotal} completed
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}
                  >
                    {data.assessmentsTotal > 0 ? Math.round((data.assessmentsCompleted / data.assessmentsTotal) * 100) : 0}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={data.assessmentsTotal > 0 ? (data.assessmentsCompleted / data.assessmentsTotal) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#F3F4F6",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#FBBF24",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                <VWLink onClick={handleViewChecklist}>
                  View detailed EU AI Act checklist
                </VWLink>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Conformity assessment steps */}
      <Card sx={cardStyles.base(theme)}>
        <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ marginBottom: 2 }}
          >
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Conformity assessment steps
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 400,
                color: theme.palette.text.tertiary,
                textTransform: "uppercase",
              }}
            >
              {data.completedStepsCount} OF {data.totalStepsCount} STEPS COMPLETED OR NOT NEEDED
            </Typography>
          </Stack>

          <Box sx={{ marginBottom: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(data.completedStepsCount / data.totalStepsCount) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#F3F4F6",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#FBBF24",
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={getTableHeaderRowStyles()}>
                  <TableCell sx={{ ...getTableHeaderCellStyles(), width: "60px" }}>
                    #
                  </TableCell>
                  <TableCell sx={getTableHeaderCellStyles()}>STEP</TableCell>
                  <TableCell sx={getTableHeaderCellStyles()}>STATUS</TableCell>
                  <TableCell sx={getTableHeaderCellStyles()}>OWNER</TableCell>
                  <TableCell sx={getTableHeaderCellStyles()}>DUE DATE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.conformitySteps.map((step) => (
                  <TableRow
                    key={step.id}
                    sx={getTableBodyRowStyles()}
                    onClick={() => handleStepClick(step)}
                  >
                    <TableCell sx={{ ...getTableBodyCellStyles(), width: "60px" }}>
                      {step.id}
                    </TableCell>
                    <TableCell sx={getTableBodyCellStyles()}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {step.step}
                      </Typography>
                    </TableCell>
                    <TableCell sx={getTableBodyCellStyles()}>
                      <Chip
                        label={step.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusBgColor(step.status),
                          color: getStatusColor(step.status),
                          borderRadius: "4px !important",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={getTableBodyCellStyles()}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {step.owner || "–"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={getTableBodyCellStyles()}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {step.dueDate || "–"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bottom Row: 4 smaller cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: "16px",
        }}
      >
        {/* Declaration of conformity */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              Declaration of conformity
            </Typography>

            <Stack sx={{ gap: "8px" }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  STATUS
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {formatStatusDisplay(data.declarationStatus)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  SIGNED ON
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.signedOn || "–"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  SIGNATORY
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.signatory || "–"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  DECLARATION DOCUMENT
                </Typography>
                <VWLink onClick={() => console.log("Link declaration evidence clicked")}>
                  {data.declarationDocument || "Link declaration evidence"}
                </VWLink>
              </Box>

              <Box sx={{ marginTop: "8px" }}>
                <CustomizableButton
                  variant="outlined"
                  text="Edit declaration details"
                  onClick={handleDeclarationClick}
                  sx={{
                    width: "100%",
                    height: 34,
                    fontSize: 13,
                    borderColor: "#D1D5DB",
                    color: "#374151",
                    "&:hover": {
                      borderColor: "#9CA3AF",
                      backgroundColor: "#F9FAFB",
                    },
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* EU registration */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              EU registration
            </Typography>

            <Stack sx={{ gap: "8px" }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  STATUS
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {formatStatusDisplay(data.registrationStatus)}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  EU REGISTRATION ID
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.euRegistrationId || "–"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  REGISTRATION DATE
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.registrationDate || "–"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  EU RECORD URL
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.euRecordUrl || "–"}
                </Typography>
              </Box>

              <Box sx={{ marginTop: "8px" }}>
                <CustomizableButton
                  variant="outlined"
                  text="Edit EU registration details"
                  onClick={handleRegistrationClick}
                  sx={{
                    width: "100%",
                    height: 34,
                    fontSize: 13,
                    borderColor: "#D1D5DB",
                    color: "#374151",
                    "&:hover": {
                      borderColor: "#9CA3AF",
                      backgroundColor: "#F9FAFB",
                    },
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Policies and evidence */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              Policies and evidence
            </Typography>

            <Stack sx={{ gap: "8px" }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  POLICIES LINKED TO EU AI ACT
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                  >
                    {data.policiesLinked} policies linked to this use case.
                  </Typography>
                  <VWLink onClick={handleOpenPoliciesModal}>
                    Manage linked policies
                  </VWLink>
                </Stack>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  EVIDENCE LINKED TO EU AI ACT REQUIREMENTS
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                  >
                    {data.evidenceLinked} evidence items.
                  </Typography>
                  <VWLink onClick={handleOpenEvidencesModal}>
                    Manage linked evidence
                  </VWLink>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Incidents for this use case */}
        <Card sx={cardStyles.base(theme)}>
          <CardContent sx={{ padding: 3, "&:last-child": { paddingBottom: 3 } }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              Incidents for this use case
            </Typography>

            <Stack sx={{ gap: "8px" }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  TOTAL INCIDENTS
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.totalIncidents}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: theme.palette.text.tertiary,
                    textTransform: "uppercase",
                    marginBottom: 0.5,
                  }}
                >
                  LAST INCIDENT
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 400, color: theme.palette.text.primary }}
                >
                  {data.lastIncident || "No incidents"}
                </Typography>
              </Box>

              <VWLink onClick={handleOpenIncidentsModal}>
                View incidents for this use case
              </VWLink>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Edit Conformity Step Modal */}
      <StandardModal
        isOpen={isStepModalOpen}
        onClose={handleStepModalClose}
        title={selectedStep ? `Edit: ${selectedStep.step}` : "Edit Conformity Step"}
        description="Update the status, ownership, and details for this conformity assessment step."
        onSubmit={handleStepModalSave}
        submitButtonText="Save changes"
        isSubmitting={saving}
        maxWidth="800px"
      >
        <Stack spacing={6}>
          {/* Description Field */}
          <Field
            type="description"
            label="Description"
            placeholder={selectedStep ? getDescriptionPlaceholder(selectedStep.step) : ""}
            value={stepEditForm.description}
            onChange={(e) => setStepEditForm({ ...stepEditForm, description: e.target.value })}
            rows={6}
          />

          {/* Status and Owner Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Select
                id="conformity-step-status"
                label="Status"
                isRequired
                items={STATUS_OPTIONS}
                value={stepEditForm.status}
                onChange={(e) =>
                  setStepEditForm({
                    ...stepEditForm,
                    status: e.target.value as ConformityStepStatus,
                  })
                }
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Select
                id="conformity-step-owner"
                label="Owner"
                items={OWNER_OPTIONS}
                value={stepEditForm.owner}
                onChange={(e) =>
                  setStepEditForm({ ...stepEditForm, owner: String(e.target.value) })
                }
                placeholder="Select owner"
              />
            </Box>
          </Stack>

          {/* Due Date and Completed Date Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Due date"
                isOptional
                date={stepEditForm.dueDate}
                handleDateChange={(value) => setStepEditForm({ ...stepEditForm, dueDate: value })}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Completed date"
                date={stepEditForm.completedDate}
                handleDateChange={(value) =>
                  setStepEditForm({ ...stepEditForm, completedDate: value })
                }
                disabled={stepEditForm.status !== ConformityStepStatus.Completed}
              />
            </Box>
          </Stack>
        </Stack>
      </StandardModal>

      {/* Edit Declaration Modal */}
      <StandardModal
        isOpen={isDeclarationModalOpen}
        onClose={handleDeclarationModalClose}
        title="Edit declaration of conformity"
        description="Update the declaration status, signatory details, and documentation."
        onSubmit={handleDeclarationModalSave}
        submitButtonText="Save changes"
        isSubmitting={saving}
        maxWidth="800px"
      >
        <Stack spacing={6}>
          {/* Status and Signatory Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Select
                id="declaration-status"
                label="Status"
                isRequired
                items={DECLARATION_STATUS_OPTIONS}
                value={declarationEditForm.status}
                onChange={(e) =>
                  setDeclarationEditForm({ ...declarationEditForm, status: String(e.target.value) })
                }
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Stack gap={theme.spacing(2)}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography
                    component="p"
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: "13px",
                      margin: 0,
                      height: "22px",
                    }}
                  >
                    Signatory
                  </Typography>
                  <VWTooltip
                    header="Who is a Signatory?"
                    content={
                      <>
                        <p>
                          The signatory is the person who signs the EU Declaration of Conformity on behalf of the provider of the AI system. In practice it should be:
                        </p>
                        <ul>
                          <li>A natural person inside the company (or its authorised representative),</li>
                          <li>Officially authorised to sign regulatory declarations,</li>
                          <li>Whose name and role appear on the declaration document</li>
                        </ul>
                      </>
                    }
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        color: "#9CA3AF",
                        "&:hover": {
                          color: "#6B7280",
                        },
                      }}
                    >
                      <GreyCircleInfoIcon size={16} />
                    </Box>
                  </VWTooltip>
                </Stack>
                <Field
                  type="text"
                  placeholder="Enter signatory name"
                  value={declarationEditForm.signatory}
                  onChange={(e) =>
                    setDeclarationEditForm({ ...declarationEditForm, signatory: e.target.value })
                  }
                />
              </Stack>
            </Box>
          </Stack>

          {/* Signed On and Document Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Signed on"
                isOptional
                date={declarationEditForm.signedOn}
                handleDateChange={(value) =>
                  setDeclarationEditForm({ ...declarationEditForm, signedOn: value })
                }
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                type="text"
                label="Declaration document"
                placeholder="Enter document link or reference"
                value={declarationEditForm.declarationDocument}
                onChange={(e) =>
                  setDeclarationEditForm({ ...declarationEditForm, declarationDocument: e.target.value })
                }
              />
            </Box>
          </Stack>
        </Stack>
      </StandardModal>

      {/* Edit EU Registration Modal */}
      <StandardModal
        isOpen={isRegistrationModalOpen}
        onClose={handleRegistrationModalClose}
        title="Edit EU registration"
        description="Update the EU registration status, ID, and database record details."
        onSubmit={handleRegistrationModalSave}
        submitButtonText="Save changes"
        isSubmitting={saving}
        maxWidth="800px"
      >
        <Stack spacing={6}>
          {/* Explanation Text */}
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 400,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            <Typography component="span" sx={{ fontWeight: 600 }}>
              EU registration ID
            </Typography>{" "}
            is the official ID/number assigned by the EU high-risk AI database for this
            specific AI system.{" "}
            <Typography component="span" sx={{ fontWeight: 600 }}>
              EU record URL
            </Typography>{" "}
            is the direct link to the online record in the EU database for that system.
          </Typography>

          {/* Status and EU Registration ID Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <Select
                id="registration-status"
                label="Status"
                isRequired
                items={REGISTRATION_STATUS_OPTIONS}
                value={registrationEditForm.status}
                onChange={(e) =>
                  setRegistrationEditForm({ ...registrationEditForm, status: String(e.target.value) })
                }
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                type="text"
                label="EU registration ID"
                placeholder="Enter registration ID"
                value={registrationEditForm.euRegistrationId}
                onChange={(e) =>
                  setRegistrationEditForm({ ...registrationEditForm, euRegistrationId: e.target.value })
                }
              />
            </Box>
          </Stack>

          {/* Registration Date and EU Record URL Row */}
          <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Registration date"
                isOptional
                date={registrationEditForm.registrationDate}
                handleDateChange={(value) =>
                  setRegistrationEditForm({ ...registrationEditForm, registrationDate: value })
                }
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                type="text"
                label="EU record URL"
                placeholder="Enter EU database record URL"
                value={registrationEditForm.euRecordUrl}
                onChange={(e) =>
                  setRegistrationEditForm({ ...registrationEditForm, euRecordUrl: e.target.value })
                }
              />
            </Box>
          </Stack>
        </Stack>
      </StandardModal>

      {/* Link Policies Modal */}
      <StandardModal
        isOpen={isPoliciesModalOpen}
        onClose={handleClosePoliciesModal}
        title="Link policies to CE Marking"
        description="Select policies to link with this CE Marking process. These policies will be included in your compliance documentation."
        onSubmit={handleSavePolicies}
        submitButtonText={`Link ${selectedPolicies.length} ${selectedPolicies.length === 1 ? 'policy' : 'policies'}`}
        isSubmitting={saving}
        maxWidth="800px"
      >
        {loadingPolicies ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availablePolicies.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                No policies available. Create policies in the Policies section first.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {availablePolicies.map((policy, index) => (
                  <Box
                    key={policy.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderBottom: index < availablePolicies.length - 1 ? `1px solid ${theme.palette.border?.light || '#e0e0e0'}` : 'none',
                      '&:hover': { backgroundColor: theme.palette.action?.hover || '#f5f5f5' },
                      cursor: 'pointer',
                    }}
                    onClick={() => togglePolicy(policy.id)}
                  >
                    <Box sx={{ marginRight: 2 }}>
                      <Checkbox
                        id={`policy-${policy.id}`}
                        isChecked={selectedPolicies.includes(policy.id)}
                        value={String(policy.id)}
                        onChange={() => togglePolicy(policy.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                        {policy.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ marginTop: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          Status: {policy.status}
                        </Typography>
                        {policy.tags && policy.tags.length > 0 && (
                          <>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                              Tags: {policy.tags.join(', ')}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </StandardModal>

      {/* Link Evidence Modal */}
      <StandardModal
        isOpen={isEvidencesModalOpen}
        onClose={handleCloseEvidencesModal}
        title="Link evidence files to CE Marking"
        description="Select evidence files to link with this CE Marking process. These files will serve as supporting documentation."
        onSubmit={handleSaveEvidences}
        submitButtonText={`Link ${selectedEvidences.length} ${selectedEvidences.length === 1 ? 'file' : 'files'}`}
        isSubmitting={saving}
        maxWidth="800px"
      >
        {loadingEvidences ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableEvidences.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                No evidence files available. Upload files in the Files section first.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {availableEvidences.map((evidence, index) => (
                  <Box
                    key={evidence.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderBottom: index < availableEvidences.length - 1 ? `1px solid ${theme.palette.border?.light || '#e0e0e0'}` : 'none',
                      '&:hover': { backgroundColor: theme.palette.action?.hover || '#f5f5f5' },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleEvidence(evidence.id)}
                  >
                    <Box sx={{ marginRight: 2 }}>
                      <Checkbox
                        id={`evidence-${evidence.id}`}
                        isChecked={selectedEvidences.includes(evidence.id)}
                        value={String(evidence.id)}
                        onChange={() => toggleEvidence(evidence.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                        {evidence.filename}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ marginTop: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          Source: {evidence.source}
                        </Typography>
                        {evidence.project_title && (
                          <>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                              Project: {evidence.project_title}
                            </Typography>
                          </>
                        )}
                        {evidence.uploaded_time && (
                          <>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                              Uploaded: {dayjs(evidence.uploaded_time).format('MMM DD, YYYY')}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </StandardModal>

      {/* Link Incidents Modal */}
      <StandardModal
        isOpen={isIncidentsModalOpen}
        onClose={handleCloseIncidentsModal}
        title="Link incidents to CE Marking"
        description="Select incidents to link with this CE Marking process. These incidents will be included in your compliance documentation."
        onSubmit={handleSaveIncidents}
        submitButtonText={`Link ${selectedIncidents.length} ${selectedIncidents.length === 1 ? 'incident' : 'incidents'}`}
        isSubmitting={saving}
        maxWidth="800px"
      >
        {loadingIncidents ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableIncidents.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                No incidents available. Create incidents in the Incident Management section first.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {availableIncidents.map((incident, index) => (
                  <Box
                    key={incident.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderBottom: index < availableIncidents.length - 1 ? `1px solid ${theme.palette.border?.light || '#e0e0e0'}` : 'none',
                      '&:hover': { backgroundColor: theme.palette.action?.hover || '#f5f5f5' },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleIncident(incident.id)}
                  >
                    <Box sx={{ marginRight: 2 }}>
                      <Checkbox
                        id={`incident-${incident.id}`}
                        isChecked={selectedIncidents.includes(incident.id)}
                        value={String(incident.id)}
                        onChange={() => toggleIncident(incident.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                        {incident.incident_id || `Incident #${incident.id}`}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ marginTop: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          Type: {incident.type}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          Severity: {incident.severity}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          Status: {incident.status}
                        </Typography>
                        {incident.occurred_date && (
                          <>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>•</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                              Occurred: {dayjs(incident.occurred_date).format('MMM DD, YYYY')}
                            </Typography>
                          </>
                        )}
                      </Stack>
                      {incident.description && (
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, marginTop: 0.5 }}>
                          {incident.description.length > 100
                            ? `${incident.description.substring(0, 100)}...`
                            : incident.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </StandardModal>

    </Box>
  );
};

export default CEMarking;
