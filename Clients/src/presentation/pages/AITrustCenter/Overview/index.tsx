import React, { Suspense } from "react";
import { Box, Typography, Stack, Checkbox, FormControlLabel, useTheme, CircularProgress, TextField } from "@mui/material";
import Alert from "../../../components/Alert";
import Toggle from '../../../components/Inputs/Toggle';
import ToggleCard from '../../../components/Inputs/ToggleCard';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import { useAITrustCentreOverviewQuery, useAITrustCentreOverviewMutation } from '../../../../application/hooks/useAITrustCentreOverviewQuery';
import { handleAlert } from '../../../../application/tools/alertUtils';
import SaveIcon from '@mui/icons-material/Save';
import Field from '../../../components/Inputs/Field';

import { 
  SectionPaper, 
  PrivacyFields, 
  styles,
  getFormControlLabelStyles 
} from './styles';

import {
  COMPLIANCE_BADGES,
  SUCCESS_MESSAGE,
} from './constants';

// Helper component for TextField with consistent styling
const StyledTextField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}> = ({ value, onChange, placeholder, disabled }) => (
  <TextField
    multiline
    minRows={3}
    maxRows={8}
    placeholder={placeholder}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    sx={styles.textField}
    variant="outlined"
    size="small"
  />
);

// Helper component for Section Header
const SectionHeader: React.FC<{
  title: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
}> = ({ title, checked, onToggle, label = "Enabled and visible" }) => {
  const theme = useTheme();
  const formControlLabelStyles = getFormControlLabelStyles(theme);
  
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={styles.sectionTitle}>{title}</Typography>
      <FormControlLabel 
        control={
          <Toggle 
            checked={checked}
            onChange={(_, checked) => onToggle(checked)}
          />
        } 
        label={label} 
        sx={formControlLabelStyles}
      />
    </Stack>
  );
};

// Helper component for Compliance Badge
const ComplianceBadge: React.FC<{
  badge: { key: string; label: string };
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}> = ({ badge, checked, onChange, disabled }) => (
  <FormControlLabel
    control={
      <Checkbox 
        checked={checked}
        onChange={(_, checked) => onChange(checked)}
        disabled={disabled}
      />
    }
    label={badge.label}
    sx={{ ...styles.badge, ...styles.checkbox }}
  />
);

const AITrustCenterOverview: React.FC = () => {
  const { data: formData, isLoading: loading, error } = useAITrustCentreOverviewQuery();
  const updateOverviewMutation = useAITrustCentreOverviewMutation();

  // Local state for form data and notifications
  const [alert, setAlert] = React.useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState<any>(null);
  const [localFormData, setLocalFormData] = React.useState<any>(null);

  // Update local form data when query data changes
  React.useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
      setOriginalData(formData);
    }
  }, [formData]);

  // Check for unsaved changes
  React.useEffect(() => {
    const hasChanges = JSON.stringify(localFormData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [localFormData, originalData]);

  // Generic handler for form field changes
  const handleFieldChange = (section: string, field: string, value: boolean | string) => {
    setLocalFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Helper function to safely get compliance badge value
  const getComplianceBadgeValue = (badgeKey: string): boolean => {
    if (!localFormData?.compliance_badges) return false;
    return localFormData.compliance_badges[badgeKey] as boolean || false;
  };

  // Handle save
  const handleSave = async () => {
    try {
      console.log('Saving AI Trust Centre data:', localFormData);
      
      // Prepare the data to send, ensuring all sections are included
      const dataToSave = {
        intro: localFormData.intro,
        compliance_badges: localFormData.compliance_badges,
        company_description: localFormData.company_description,
        terms_and_contact: localFormData.terms_and_contact,
        info: localFormData.info
      };
      
      // Call the updateOverview mutation
      await updateOverviewMutation.mutateAsync(dataToSave);
      
      // Update local state to reflect the saved data
      setOriginalData({ ...localFormData }); // Create a deep copy
      setHasUnsavedChanges(false);
      
      handleAlert({
        variant: "success",
        body: SUCCESS_MESSAGE,
        setAlert,
      });
      
      console.log('AI Trust Centre data saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (loading || !localFormData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="error"
            body={error.message || 'An error occurred'}
            isToast={true}
            onClick={() => {}}
          />
        </Suspense>
      )}
      

      
      {/* Introduction Section */}
      <SectionPaper sx={{ opacity: localFormData.info?.intro_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Introduction"
          checked={localFormData.info?.intro_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'intro_visible', checked)}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Purpose of our trust center"
            checked={localFormData.intro?.purpose_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'purpose_visible', checked)}
            disabled={!localFormData.info?.intro_visible}
          >
            <StyledTextField
              value={localFormData.intro?.purpose_text || ''}
              onChange={(value) => localFormData.info?.intro_visible && localFormData.intro?.purpose_visible && handleFieldChange('intro', 'purpose_text', value)}
              placeholder="Include a section to summarize the purpose of the Trust Center. Clearly communicate the company's commitment to responsible AI use, data privacy, and ethical AI practices."
              disabled={!localFormData.info?.intro_visible || !localFormData.intro?.purpose_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our statement"
            checked={localFormData.intro?.our_statement_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_statement_visible', checked)}
            disabled={!localFormData.info?.intro_visible}
          >
            <StyledTextField
              value={localFormData.intro?.our_statement_text || ''}
              onChange={(value) => localFormData.info?.intro_visible && localFormData.intro?.our_statement_visible && handleFieldChange('intro', 'our_statement_text', value)}
              placeholder="Provide a brief statement about the company's AI applications and their significance. Mention the main objectives, like data security, ethical AI, and trust-building with customers."
              disabled={!localFormData.info?.intro_visible || !localFormData.intro?.our_statement_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our mission"
            checked={localFormData.intro?.our_mission_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_mission_visible', checked)}
            disabled={!localFormData.info?.intro_visible}
          >
            <StyledTextField
              value={localFormData.intro?.our_mission_text || ''}
              onChange={(value) => localFormData.info?.intro_visible && localFormData.intro?.our_mission_visible && handleFieldChange('intro', 'our_mission_text', value)}
              placeholder="Input a mission statement reflecting your values related to AI governance and ethics."
              disabled={!localFormData.info?.intro_visible || !localFormData.intro?.our_mission_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Compliance Badges Section */}
      <SectionPaper sx={{ opacity: localFormData.info?.compliance_badges_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Compliance and certification badges"
          checked={localFormData.info?.compliance_badges_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'compliance_badges_visible', checked)}
        />
        <Typography sx={styles.sectionDescription}>
          Compliance badges for certifications and standards (e.g., EU AI Act, NIST, SOC2, ISO 27001, GDPR).
        </Typography>
        <Box
          display="flex"
          flexWrap="wrap"
          rowGap={0.5}
          mt={1}
          sx={styles.badgesContainer}
        >
          {COMPLIANCE_BADGES.map((badge) => (
            <ComplianceBadge
              key={badge.key}
              badge={badge}
              checked={getComplianceBadgeValue(badge.key)}
              onChange={(checked) => handleFieldChange('compliance_badges', badge.key, checked)}
              disabled={!localFormData.info?.compliance_badges_visible}
            />
          ))}
        </Box>
      </SectionPaper>

      {/* Company Info Section */}
      <SectionPaper sx={{ opacity: localFormData.info?.company_description_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Company description and values"
          checked={localFormData.info?.company_description_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'company_description_visible', checked)}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Background"
            checked={localFormData.company_description?.background_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'background_visible', checked)}
            disabled={!localFormData.info?.company_description_visible}
          >
            <StyledTextField
              value={localFormData.company_description?.background_text || ''}
              onChange={(value) => localFormData.info?.company_description_visible && localFormData.company_description?.background_visible && handleFieldChange('company_description', 'background_text', value)}
              placeholder="Explain your company, what you do, and why trust in AI is essential to you."
              disabled={!localFormData.info?.company_description_visible || !localFormData.company_description?.background_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Core benefits"
            checked={localFormData.company_description?.core_benefits_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'core_benefits_visible', checked)}
            disabled={!localFormData.info?.company_description_visible}
          >
            <StyledTextField
              value={localFormData.company_description?.core_benefits_text || ''}
              placeholder="Explain key benefits like efficiency, security, customer support, and ethical AI practices. You can also detail your AI offering functionality, use cases, and benefits to users."
              onChange={(value) => localFormData.info?.company_description_visible && localFormData.company_description?.core_benefits_visible && handleFieldChange('company_description', 'core_benefits_text', value)}
              disabled={!localFormData.info?.company_description_visible || !localFormData.company_description?.core_benefits_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Compliance documentation"
            checked={localFormData.company_description?.compliance_doc_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'compliance_doc_visible', checked)}
            disabled={!localFormData.info?.company_description_visible}
          >
            <StyledTextField
              value={localFormData.company_description?.compliance_doc_text || ''}
              onChange={(value) => localFormData.info?.company_description_visible && localFormData.company_description?.compliance_doc_visible && handleFieldChange('company_description', 'compliance_doc_text', value)}
              placeholder="Access our comprehensive compliance documentation and certifications."
              disabled={!localFormData.info?.company_description_visible || !localFormData.company_description?.compliance_doc_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Privacy Policy Section */}
      <SectionPaper sx={{ opacity: localFormData.info?.terms_and_contact_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Privacy policy, terms of service, and contact information"
          checked={localFormData.info?.terms_and_contact_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'terms_and_contact_visible', checked)}
        />
        <Typography sx={styles.sectionDescription}>
          Include links to essential documents like the Privacy Policy and Terms of Service. Also include email address for privacy/security related questions and incidents.
        </Typography>
        <PrivacyFields>
          <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={localFormData.terms_and_contact?.terms_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'terms_visible', checked)}
                    disabled={!localFormData.info?.terms_and_contact_visible}
                  />
                } 
                label="Terms of service" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="terms-of-service-input"
                placeholder="Enter terms of service URL..."
                width={458}
                value={localFormData.terms_and_contact?.terms_text || ''}
                onChange={(e) => localFormData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'terms_text', e.target.value)}
                disabled={!localFormData.terms_and_contact?.terms_visible || !localFormData.info?.terms_and_contact_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={localFormData.terms_and_contact?.privacy_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'privacy_visible', checked)}
                    disabled={!localFormData.info?.terms_and_contact_visible}
                  />
                } 
                label="Privacy policy" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="privacy-policy-input"
                placeholder="Enter privacy policy URL..."
                width={458}
                value={localFormData.terms_and_contact?.privacy_text || ''}
                onChange={(e) => localFormData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'privacy_text', e.target.value)}
                disabled={!localFormData.terms_and_contact?.privacy_visible || !localFormData.info?.terms_and_contact_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={localFormData.terms_and_contact?.email_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'email_visible', checked)}
                    disabled={!localFormData.info?.terms_and_contact_visible}
                  />
                } 
                label="Company email" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="company-email-input"
                placeholder="Enter company email..."
                width={458}
                value={localFormData.terms_and_contact?.email_text || ''}
                onChange={(e) => localFormData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'email_text', e.target.value)}
                disabled={!localFormData.terms_and_contact?.email_visible || !localFormData.info?.terms_and_contact_visible}
                sx={styles.privacyField}
              />
            </Stack>
          </Stack>
        </PrivacyFields>
      </SectionPaper>
      
      {/* Save Button */}
      <Stack>
        <CustomizableButton
          sx={{
            ...styles.saveButton,
            backgroundColor: hasUnsavedChanges ? "#13715B" : "#ccc",
            border: `1px solid ${hasUnsavedChanges ? "#13715B" : "#ccc"}`,
          }}
          icon={<SaveIcon />}
          variant="contained"
          onClick={handleSave}
          isDisabled={!hasUnsavedChanges}
          text="Save"
        />
      </Stack>

      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default AITrustCenterOverview; 