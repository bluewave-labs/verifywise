import React from "react";
import { Box, Typography, Stack, Checkbox, FormControlLabel, useTheme, Alert, CircularProgress, TextField, Snackbar } from "@mui/material";
import Toggle from '../../../components/Inputs/Toggle';
import ToggleCard from '../../../components/Inputs/ToggleCard';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import { useAITrustCentreOverview } from '../../../../application/hooks/useAITrustCentreOverview';
import SaveIcon from '@mui/icons-material/Save';
import Field from '../../../components/Inputs/Field';

import { 
  SectionPaper, 
  PrivacyFields, 
  styles,
  getFormControlLabelStyles 
} from './styles';

import {
  INITIAL_FORM_DATA,
  COMPLIANCE_BADGES,
  SUCCESS_MESSAGE,
  FORM_SECTIONS,
  TOGGLE_FIELDS
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
  const { data, loading, error, updateOverview } = useAITrustCentreOverview();

  // Local state for form data and notifications
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState(INITIAL_FORM_DATA);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState(INITIAL_FORM_DATA);

  // Load saved form data from localStorage on component mount
  React.useEffect(() => {
    const savedFormData = localStorage.getItem('aiTrustCentreFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        setOriginalData(parsedData);
        console.log('Loaded saved form data from localStorage:', parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('aiTrustCentreFormData', JSON.stringify(formData));
  }, [formData]);

  // Check for unsaved changes
  React.useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Update form data when API data is loaded
  React.useEffect(() => {
    if (data) {
      console.log('AI Trust Centre data loaded from API:', data);
      
      const apiData = (data as any).data || data;
      
      const updateData = (prevData: typeof INITIAL_FORM_DATA) => ({
        intro: { ...prevData.intro, ...(apiData.intro || {}) },
        compliance_badges: { ...prevData.compliance_badges, ...(apiData.compliance_badges || {}) },
        company_info: { ...prevData.company_info, ...(apiData.company_info || {}) },
        terms_and_contact: { ...prevData.terms_and_contact, ...(apiData.terms_and_contact || {}) },
      });
      
      setFormData(updateData);
      setOriginalData(updateData);
    }
  }, [data]);

  // Generic handler for form field changes
  const handleFieldChange = (section: keyof typeof formData, field: string, value: boolean | string) => {
    const isToggleField = Object.values(TOGGLE_FIELDS).includes(field as any);
    
    if (!isToggleField) {
      const sectionEnabled = getSectionEnabled(section);
      if (!sectionEnabled) return;
    }
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Helper function to check if a section is enabled
  const getSectionEnabled = (section: keyof typeof formData): boolean => {
    const sectionMap = {
      [FORM_SECTIONS.INTRO]: formData.intro.intro_visible,
      [FORM_SECTIONS.COMPLIANCE_BADGES]: formData.compliance_badges.badges_visible,
      [FORM_SECTIONS.COMPANY_INFO]: formData.company_info.company_info_visible,
      [FORM_SECTIONS.TERMS_AND_CONTACT]: formData.terms_and_contact.is_visible,
    };
    return sectionMap[section] ?? true;
  };

  // Helper function to safely get compliance badge value
  const getComplianceBadgeValue = (badgeKey: string): boolean => {
    return formData.compliance_badges[badgeKey as keyof typeof formData.compliance_badges] as boolean || false;
  };

  // Handle save
  const handleSave = async () => {
    try {
      console.log('Saving AI Trust Centre data:', formData);
      
      const dataToSend = {
        intro: {
          intro_visible: formData.intro.intro_visible,
          purpose_visible: formData.intro.purpose_visible,
          purpose_text: formData.intro.purpose_text || '',
          our_statement_visible: formData.intro.our_statement_visible,
          our_statement_text: formData.intro.our_statement_text || '',
          our_mission_visible: formData.intro.our_mission_visible,
          our_mission_text: formData.intro.our_mission_text || '',
        },
        compliance_badges: {
          badges_visible: formData.compliance_badges.badges_visible,
          SOC2_Type_I: formData.compliance_badges.SOC2_Type_I,
          SOC2_Type_II: formData.compliance_badges.SOC2_Type_II,
          ISO_27001: formData.compliance_badges.ISO_27001,
          ISO_42001: formData.compliance_badges.ISO_42001,
          CCPA: formData.compliance_badges.CCPA,
          GDPR: formData.compliance_badges.GDPR,
          HIPAA: formData.compliance_badges.HIPAA,
          EU_AI_Act: formData.compliance_badges.EU_AI_Act,
        },
        company_info: {
          company_info_visible: formData.company_info.company_info_visible,
          background_visible: formData.company_info.background_visible,
          background_text: formData.company_info.background_text || '',
          core_benefit_visible: formData.company_info.core_benefit_visible,
          core_benefit_text: formData.company_info.core_benefit_text || '',
          compliance_doc_visible: formData.company_info.compliance_doc_visible,
          compliance_doc_text: formData.company_info.compliance_doc_text || '',
        },
        terms_and_contact: {
          is_visible: formData.terms_and_contact.is_visible,
          has_terms_of_service: formData.terms_and_contact.has_terms_of_service,
          terms_of_service: formData.terms_and_contact.terms_of_service || '',
          has_privacy_policy: formData.terms_and_contact.has_privacy_policy,
          privacy_policy: formData.terms_and_contact.privacy_policy || '',
          has_company_email: formData.terms_and_contact.has_company_email,
          company_email: formData.terms_and_contact.company_email || '',
        },
      };
      
      await updateOverview(dataToSend);
      setSaveSuccess(true);
      setOriginalData(formData);
      setHasUnsavedChanges(false);
      
      console.log('AI Trust Centre data saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Handle success notification close
  const handleSuccessClose = () => {
    setSaveSuccess(false);
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Introduction Section */}
      <SectionPaper sx={{ opacity: formData.intro.intro_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Introduction"
          checked={formData.intro.intro_visible}
          onToggle={(checked) => handleFieldChange(FORM_SECTIONS.INTRO, TOGGLE_FIELDS.INTRO_VISIBLE, checked)}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Purpose of our trust center"
            checked={formData.intro.purpose_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.INTRO, 'purpose_visible', checked)}
            disabled={!formData.intro.intro_visible}
          >
            <StyledTextField
              value={formData.intro.purpose_text}
              onChange={(value) => formData.intro.intro_visible && formData.intro.purpose_visible && handleFieldChange(FORM_SECTIONS.INTRO, 'purpose_text', value)}
              placeholder="Include a section to summarize the purpose of the Trust Center. Clearly communicate the company's commitment to responsible AI use, data privacy, and ethical AI practices."
              disabled={!formData.intro.intro_visible || !formData.intro.purpose_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our statement"
            checked={formData.intro.our_statement_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.INTRO, 'our_statement_visible', checked)}
            disabled={!formData.intro.intro_visible}
          >
            <StyledTextField
              value={formData.intro.our_statement_text}
              onChange={(value) => formData.intro.intro_visible && formData.intro.our_statement_visible && handleFieldChange(FORM_SECTIONS.INTRO, 'our_statement_text', value)}
              placeholder="Provide a brief statement about the company's AI applications and their significance. Mention the main objectives, like data security, ethical AI, and trust-building with customers."
              disabled={!formData.intro.intro_visible || !formData.intro.our_statement_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our mission"
            checked={formData.intro.our_mission_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.INTRO, 'our_mission_visible', checked)}
            disabled={!formData.intro.intro_visible}
          >
            <StyledTextField
              value={formData.intro.our_mission_text}
              onChange={(value) => formData.intro.intro_visible && formData.intro.our_mission_visible && handleFieldChange(FORM_SECTIONS.INTRO, 'our_mission_text', value)}
              placeholder="Input a mission statement reflecting your values related to AI governance and ethics."
              disabled={!formData.intro.intro_visible || !formData.intro.our_mission_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Compliance Badges Section */}
      <SectionPaper sx={{ opacity: formData.compliance_badges.badges_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Compliance and certification badges"
          checked={formData.compliance_badges.badges_visible}
          onToggle={(checked) => handleFieldChange(FORM_SECTIONS.COMPLIANCE_BADGES, TOGGLE_FIELDS.BADGES_VISIBLE, checked)}
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
              onChange={(checked) => handleFieldChange(FORM_SECTIONS.COMPLIANCE_BADGES, badge.key, checked)}
              disabled={!formData.compliance_badges.badges_visible}
            />
          ))}
        </Box>
      </SectionPaper>

      {/* Company Info Section */}
      <SectionPaper sx={{ opacity: formData.company_info.company_info_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Company description and values"
          checked={formData.company_info.company_info_visible}
          onToggle={(checked) => handleFieldChange(FORM_SECTIONS.COMPANY_INFO, TOGGLE_FIELDS.COMPANY_INFO_VISIBLE, checked)}
          label={formData.company_info.company_info_visible ? "Enabled and visible" : "Disabled"}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Background"
            checked={formData.company_info.background_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'background_visible', checked)}
            disabled={!formData.company_info.company_info_visible}
          >
            <StyledTextField
              value={formData.company_info.background_text}
              onChange={(value) => formData.company_info.company_info_visible && formData.company_info.background_visible && handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'background_text', value)}
              placeholder="Explain your company, what you do, and why trust in AI is essential to you."
              disabled={!formData.company_info.company_info_visible || !formData.company_info.background_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Core benefits"
            checked={formData.company_info.core_benefit_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'core_benefit_visible', checked)}
            disabled={!formData.company_info.company_info_visible}
          >
            <StyledTextField
              value={formData.company_info.core_benefit_text}
              onChange={(value) => formData.company_info.company_info_visible && formData.company_info.core_benefit_visible && handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'core_benefit_text', value)}
              placeholder="Explain key benefits like efficiency, security, customer support, and ethical AI practices. You can also detail your AI offering functionality, use cases, and benefits to users."
              disabled={!formData.company_info.company_info_visible || !formData.company_info.core_benefit_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Compliance documentation"
            checked={formData.company_info.compliance_doc_visible}
            onToggle={(_, checked) => handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'compliance_doc_visible', checked)}
            disabled={!formData.company_info.company_info_visible}
          >
            <StyledTextField
              value={formData.company_info.compliance_doc_text}
              onChange={(value) => formData.company_info.company_info_visible && formData.company_info.compliance_doc_visible && handleFieldChange(FORM_SECTIONS.COMPANY_INFO, 'compliance_doc_text', value)}
              placeholder="Access our comprehensive compliance documentation and certifications."
              disabled={!formData.company_info.company_info_visible || !formData.company_info.compliance_doc_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Privacy Policy Section */}
      <SectionPaper sx={{ opacity: formData.terms_and_contact.is_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Privacy policy, terms of service, and contact information"
          checked={formData.terms_and_contact.is_visible}
          onToggle={(checked) => handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, TOGGLE_FIELDS.IS_VISIBLE, checked)}
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
                    checked={formData.terms_and_contact.has_terms_of_service}
                    onChange={(_, checked) => handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'has_terms_of_service', checked)}
                    disabled={!formData.terms_and_contact.is_visible}
                  />
                } 
                label="Terms of service" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="terms-of-service-input"
                placeholder="Enter terms of service URL..."
                width={458}
                value={formData.terms_and_contact.terms_of_service || ''}
                onChange={(e) => formData.terms_and_contact.is_visible && handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'terms_of_service', e.target.value)}
                disabled={!formData.terms_and_contact.has_terms_of_service || !formData.terms_and_contact.is_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact.has_privacy_policy}
                    onChange={(_, checked) => handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'has_privacy_policy', checked)}
                    disabled={!formData.terms_and_contact.is_visible}
                  />
                } 
                label="Privacy policy" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="privacy-policy-input"
                placeholder="Enter privacy policy URL..."
                width={458}
                value={formData.terms_and_contact.privacy_policy || ''}
                onChange={(e) => formData.terms_and_contact.is_visible && handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'privacy_policy', e.target.value)}
                disabled={!formData.terms_and_contact.has_privacy_policy || !formData.terms_and_contact.is_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact.has_company_email}
                    onChange={(_, checked) => handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'has_company_email', checked)}
                    disabled={!formData.terms_and_contact.is_visible}
                  />
                } 
                label="Company email" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="company-email-input"
                placeholder="Enter company email..."
                width={458}
                value={formData.terms_and_contact.company_email || ''}
                onChange={(e) => formData.terms_and_contact.is_visible && handleFieldChange(FORM_SECTIONS.TERMS_AND_CONTACT, 'company_email', e.target.value)}
                disabled={!formData.terms_and_contact.has_company_email || !formData.terms_and_contact.is_visible}
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

      {/* Success Notification */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSuccessClose} 
          severity="success" 
          sx={{ 
            width: '100%',
            backgroundColor: '#ecfdf3',
            border: '1px solid #12715B',
            color: '#079455',
            '& .MuiAlert-icon': {
              color: '#079455',
            }
          }}
        >
          {SUCCESS_MESSAGE}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AITrustCenterOverview; 