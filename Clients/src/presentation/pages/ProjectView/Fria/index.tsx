import { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AlertTriangle,
  CheckCircle,
  Send,
} from "lucide-react";
import Chip from "../../../components/Chip";
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

interface FriaProps {
  projectId: string;
}

const SECTIONS = [
  { id: "org-profile", label: "Organisation & system profile", number: 1 },
  { id: "applicability", label: "Applicability & scope", number: 2 },
  { id: "affected-persons", label: "Affected persons & groups", number: 3 },
  { id: "rights-matrix", label: "Fundamental rights matrix", number: 4 },
  { id: "specific-risks", label: "Specific risks of harm", number: 5 },
  { id: "oversight", label: "Human oversight & transparency", number: 6 },
  { id: "consultation", label: "Stakeholder consultation", number: 7 },
  { id: "summary", label: "Summary & recommendation", number: 8 },
];

const FriaAssessment = ({ projectId }: FriaProps) => {
  const theme = useTheme();
  const {
    assessment,
    rights,
    riskItems,
    modelLinks,
    isLoading,
    error,
    isSaving,
    updateAssessment,
    updateRights,
    addRiskItem,
    updateRiskItem,
    deleteRiskItem,
    submitFria,
  } = useFria(projectId);

  const [activeSection, setActiveSection] = useState("org-profile");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  }, [assessment]);

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

  return (
    <Stack spacing={3}>
      {/* Status header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "4px",
          backgroundColor: theme.palette.background.paper,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">
            Completion
          </Typography>
          <Box sx={{ flex: 1, minWidth: 80 }}>
            <LinearProgress
              variant="determinate"
              value={assessment.completion_pct}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {assessment.completion_pct}%
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Risk score
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {assessment.risk_score}/100
          </Typography>
        </Box>

        <Chip label={assessment.risk_level} size="small" />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {assessment.rights_flagged > 0 ? (
            <AlertTriangle size={14} color={theme.palette.warning.main} />
          ) : (
            <CheckCircle size={14} color={theme.palette.success.main} />
          )}
          <Typography variant="body2">
            {assessment.rights_flagged} right{assessment.rights_flagged !== 1 ? "s" : ""} flagged
          </Typography>
        </Box>

        <Chip label={assessment.status} size="small" />

        <Box sx={{ ml: "auto" }}>
          <CustomizableButton
            text="Submit for review"
            variant="contained"
            onClick={() => submitFria("Submitted for review")}
            disabled={isSaving || assessment.status === "completed" || assessment.status === "approved"}
            startIcon={<Send size={14} />}
            sx={{ height: 34 }}
          />
        </Box>
      </Box>

      {/* Main layout: sidebar + content */}
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Section navigation sidebar */}
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            position: "sticky",
            top: 80,
            alignSelf: "flex-start",
            display: { xs: "none", md: "block" },
          }}
        >
          <Stack spacing={0.5}>
            {SECTIONS.map((section) => (
              <Box
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === section.id
                      ? `${theme.palette.primary.main}10`
                      : "transparent",
                  borderLeft:
                    activeSection === section.id
                      ? `2px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 12,
                    fontWeight: activeSection === section.id ? 600 : 400,
                    color:
                      activeSection === section.id
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                  }}
                >
                  {section.number}. {section.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Scrollable sections */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={3}>
            <div
              id="org-profile"
              ref={(el) => { sectionRefs.current["org-profile"] = el; }}
            >
              <OrgProfileSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="applicability"
              ref={(el) => { sectionRefs.current["applicability"] = el; }}
            >
              <ApplicabilityScopeSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="affected-persons"
              ref={(el) => { sectionRefs.current["affected-persons"] = el; }}
            >
              <AffectedPersonsSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="rights-matrix"
              ref={(el) => { sectionRefs.current["rights-matrix"] = el; }}
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
              ref={(el) => { sectionRefs.current["specific-risks"] = el; }}
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
              ref={(el) => { sectionRefs.current["oversight"] = el; }}
            >
              <OversightSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="consultation"
              ref={(el) => { sectionRefs.current["consultation"] = el; }}
            >
              <ConsultationSection
                assessment={assessment}
                onUpdate={updateAssessment}
                isSaving={isSaving}
              />
            </div>

            <div
              id="summary"
              ref={(el) => { sectionRefs.current["summary"] = el; }}
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
    </Stack>
  );
};

export default FriaAssessment;
