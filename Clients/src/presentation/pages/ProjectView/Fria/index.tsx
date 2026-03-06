import { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
import { palette } from "../../../themes/palette";
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
  { id: "org-profile", label: "Organisation & system profile", number: 1, Icon: Building2 },
  { id: "applicability", label: "Applicability & scope", number: 2, Icon: Scale },
  { id: "affected-persons", label: "Affected persons & groups", number: 3, Icon: Users },
  { id: "rights-matrix", label: "Fundamental rights matrix", number: 4, Icon: Shield },
  { id: "specific-risks", label: "Specific risks of harm", number: 5, Icon: AlertTriangle },
  { id: "oversight", label: "Human oversight & transparency", number: 6, Icon: Eye },
  { id: "consultation", label: "Stakeholder consultation", number: 7, Icon: MessageSquare },
  { id: "summary", label: "Summary & recommendation", number: 8, Icon: FileCheck },
];

const FriaAssessment = ({ projectId }: FriaProps) => {
  const theme = useTheme();
  const {
    assessment,
    rights,
    riskItems,
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
          onClick={() => submitFria("Submitted for review")}
          disabled={
            isSaving ||
            assessment.status === "completed" ||
            assessment.status === "approved"
          }
          startIcon={<Send size={14} />}
          sx={{ height: 34 }}
        />
      </Box>

      {/* Main layout: sidebar + content */}
      <Box sx={{ display: "flex", gap: "16px" }}>
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
          <List disablePadding>
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              const SectionIcon = section.Icon;

              return (
                <ListItemButton
                  key={section.id}
                  disableRipple
                  onClick={() => scrollToSection(section.id)}
                  sx={{
                    height: "32px",
                    gap: theme.spacing(4),
                    borderRadius: theme.shape.borderRadius,
                    px: theme.spacing(4),
                    justifyContent: "flex-start",
                    background: isActive
                      ? "linear-gradient(135deg, #F7F7F7 0%, #F2F2F2 100%)"
                      : "transparent",
                    border: isActive
                      ? "1px solid #E8E8E8"
                      : "1px solid transparent",
                    "&:hover": {
                      background: isActive
                        ? "linear-gradient(135deg, #F7F7F7 0%, #F2F2F2 100%)"
                        : "#FAFAFA",
                      border: isActive
                        ? "1px solid #E8E8E8"
                        : "1px solid transparent",
                    },
                    "&:hover svg": {
                      color: "#13715B !important",
                      stroke: "#13715B !important",
                    },
                    "&:hover svg path": {
                      stroke: "#13715B !important",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "16px",
                      mr: 0,
                      "& svg": {
                        color: isActive
                          ? "#13715B !important"
                          : `${theme.palette.text.tertiary} !important`,
                        stroke: isActive
                          ? "#13715B !important"
                          : `${theme.palette.text.tertiary} !important`,
                        transition: "color 0.2s ease, stroke 0.2s ease",
                      },
                      "& svg path": {
                        stroke: isActive
                          ? "#13715B !important"
                          : `${theme.palette.text.tertiary} !important`,
                      },
                    }}
                  >
                    <SectionIcon size={16} strokeWidth={1.5} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${section.number}. ${section.label}`}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? palette.text.primary
                          : theme.palette.text.secondary,
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

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
    </Stack>
  );
};

export default FriaAssessment;
