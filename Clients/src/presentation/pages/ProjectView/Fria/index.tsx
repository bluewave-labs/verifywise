import { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  AlertTriangle,
  Send,
  Gauge,
  ShieldAlert,
  CheckCircle,
  Building2,
  Scale,
  Users,
  Shield,
  Eye,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { StatCard } from "../../../components/Cards/StatCard";
import SectionSidebar, { SectionItem } from "../../../components/SectionSidebar";
import { useFria } from "../../../../application/hooks/useFria";
import { CustomizableButton } from "../../../components/button/customizable-button";
import OrgProfileSection from "./sections/OrgProfileSection";
import ApplicabilityScopeSection from "./sections/ApplicabilityScopeSection";
import AffectedPersonsSection from "./sections/AffectedPersonsSection";
import RightsMatrixSection from "./sections/RightsMatrixSection";
import SpecificRisksSection from "./sections/SpecificRisksSection";
import OversightSection from "./sections/OversightSection";
import ConsultationSection from "./sections/ConsultationSection";
import SummarySection from "./sections/SummarySection";
import FriaVersionHistory from "./FriaVersionHistory";
import StandardModal from "../../../components/Modals/StandardModal";
import Field from "../../../components/Inputs/Field";

interface FriaProps {
  projectId: string;
}

const SECTIONS: SectionItem[] = [
  { id: "org-profile", label: "1. Organisation & system profile", Icon: Building2 },
  { id: "applicability", label: "2. Applicability & scope", Icon: Scale },
  { id: "affected-persons", label: "3. Affected persons & groups", Icon: Users },
  { id: "rights-matrix", label: "4. Fundamental rights matrix", Icon: Shield },
  { id: "specific-risks", label: "5. Specific risks of harm", Icon: AlertTriangle },
  { id: "oversight", label: "6. Human oversight & transparency", Icon: Eye },
  { id: "consultation", label: "7. Stakeholder consultation", Icon: MessageSquare },
  { id: "summary", label: "8. Summary & recommendation", Icon: FileCheck },
];

const FriaAssessment = ({ projectId }: FriaProps) => {
  const {
    assessment,
    rights,
    riskItems,
    isLoading,
    error,
    isSaving,
    lastSaveStatus,
    updateAssessment,
    updateRights,
    addRiskItem,
    updateRiskItem,
    deleteRiskItem,
    submitFria,
  } = useFria(projectId);

  const [activeSection, setActiveSection] = useState("org-profile");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitReason, setSubmitReason] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  // Show snackbar when save status changes
  useEffect(() => {
    if (lastSaveStatus === "saved") {
      setSnackbar({ open: true, severity: "success", message: "Changes saved" });
    } else if (lastSaveStatus === "error") {
      setSnackbar({ open: true, severity: "error", message: "Failed to save changes" });
    }
  }, [lastSaveStatus]);

  const handleSubmitConfirm = useCallback(async () => {
    await submitFria(submitReason || "Submitted for review");
    setShowSubmitModal(false);
    setSubmitReason("");
  }, [submitFria, submitReason]);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // IntersectionObserver to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3, rootMargin: "-100px 0px -60% 0px" }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!assessment) return null;

  const riskSubtitle =
    assessment.risk_score > 70
      ? "High risk — review required"
      : assessment.risk_score > 40
      ? "Moderate risk level"
      : "Low risk level";

  return (
    <Stack spacing={0} gap="16px">
      {/* Stat cards row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        <StatCard
          title="Completion"
          value={`${assessment.completion_pct}%`}
          Icon={Gauge}
          subtitle="of assessment complete"
        />
        <StatCard
          title="Risk score"
          value={`${assessment.risk_score}/100`}
          Icon={ShieldAlert}
          subtitle={riskSubtitle}
          highlight={assessment.risk_score > 70}
        />
        <StatCard
          title="Rights flagged"
          value={assessment.rights_flagged}
          Icon={AlertTriangle}
          subtitle={`of ${rights.length} rights`}
          highlight={assessment.rights_flagged > 0}
        />
        <StatCard
          title="Status"
          value={assessment.status}
          Icon={CheckCircle}
          subtitle={`Version ${assessment.version}`}
        />
      </Box>

      {/* Submit button — right-aligned */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <CustomizableButton
          text="Submit for review"
          variant="contained"
          onClick={() => setShowSubmitModal(true)}
          disabled={
            isSaving ||
            assessment.status === "approved"
          }
          startIcon={<Send size={14} />}
          sx={{ height: 34 }}
        />
      </Box>

      {/* Main layout: sidebar + content */}
      <Box sx={{ display: "flex", gap: "16px" }}>
        <SectionSidebar
          sections={SECTIONS}
          activeSection={activeSection}
          onSelect={scrollToSection}
          width={300}
        />

        {/* Scrollable sections */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={0} gap="16px">
            <div
              id="org-profile"
              ref={(el) => {
                sectionRefs.current["org-profile"] = el;
              }}
            >
              <OrgProfileSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="applicability"
              ref={(el) => {
                sectionRefs.current["applicability"] = el;
              }}
            >
              <ApplicabilityScopeSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="affected-persons"
              ref={(el) => {
                sectionRefs.current["affected-persons"] = el;
              }}
            >
              <AffectedPersonsSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="rights-matrix"
              ref={(el) => {
                sectionRefs.current["rights-matrix"] = el;
              }}
            >
              <RightsMatrixSection
                friaId={assessment.id}
                rights={rights}
                onUpdateRights={updateRights}
                isSaving={isSaving}
              />
            </div>

            <div
              id="specific-risks"
              ref={(el) => {
                sectionRefs.current["specific-risks"] = el;
              }}
            >
              <SpecificRisksSection
                assessment={assessment}
                riskItems={riskItems}
                projectId={projectId}
                onUpdate={updateAssessment}
                onAddRiskItem={addRiskItem}
                onUpdateRiskItem={updateRiskItem}
                onDeleteRiskItem={deleteRiskItem}
                isSaving={isSaving}
              />
            </div>

            <div
              id="oversight"
              ref={(el) => {
                sectionRefs.current["oversight"] = el;
              }}
            >
              <OversightSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="consultation"
              ref={(el) => {
                sectionRefs.current["consultation"] = el;
              }}
            >
              <ConsultationSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="summary"
              ref={(el) => {
                sectionRefs.current["summary"] = el;
              }}
            >
              <SummarySection
                assessment={assessment}
                rights={rights}
                riskItems={riskItems}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <FriaVersionHistory
              friaId={assessment.id}
              currentVersion={assessment.version}
            />
          </Stack>
        </Box>
      </Box>
      {/* Submit confirmation modal */}
      <StandardModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setSubmitReason("");
        }}
        title="Submit for review"
        description={`This will submit version ${assessment.version + 1} of the FRIA for review. You can optionally add a note.`}
        onSubmit={handleSubmitConfirm}
        submitButtonText="Submit"
      >
        <Field
          id="submit-reason"
          label="Note (optional)"
          value={submitReason}
          onChange={(e) => setSubmitReason(e.target.value)}
          placeholder="e.g. Initial assessment complete"
          type="description"
        />
      </StandardModal>

      {/* Save feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontSize: 13 }}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default FriaAssessment;
