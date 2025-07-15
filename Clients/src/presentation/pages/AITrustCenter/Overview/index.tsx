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
  const { loading, error, updateOverview, fetchOverview } = useAITrustCentreOverview();

  // Local state for form data and notifications
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState<any>(null);
  const [formData, setFormData] = React.useState<any>(null);

  // Fetch overview data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchOverview();
        console.log('Overview data fetched successfully');
        console.log('Raw API Response:', response);
        
        // Extract the overview data from the nested response
        const overviewData = response?.data?.overview || response?.overview || response;
        setFormData(overviewData);
        setOriginalData(overviewData);
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };
    loadData();
  }, [fetchOverview]);

  // Check for unsaved changes
  React.useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Generic handler for form field changes
  const handleFieldChange = (section: string, field: string, value: boolean | string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Helper function to safely get compliance badge value
  const getComplianceBadgeValue = (badgeKey: string): boolean => {
    if (!formData?.compliance_badges) return false;
    return formData.compliance_badges[badgeKey] as boolean || false;
  };

  // Handle save
  const handleSave = async () => {
    try {
      console.log('Saving AI Trust Centre data:', formData);
      
      // Prepare the data to send, ensuring all sections are included
      const dataToSave = {
        intro: formData.intro,
        compliance_badges: formData.compliance_badges,
        company_description: formData.company_description,
        terms_and_contact: formData.terms_and_contact,
        info: formData.info
      };
      
      // Call the updateOverview function from the hook
      await updateOverview(dataToSave);
      
      // Update local state to reflect the saved data
      setOriginalData({ ...formData }); // Create a deep copy
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      
      console.log('AI Trust Centre data saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Handle success notification close
  const handleSuccessClose = () => {
    setSaveSuccess(false);
  };

  if (loading || !formData) {
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
      <SectionPaper sx={{ opacity: formData.info?.intro_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Introduction"
          checked={formData.info?.intro_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'intro_visible', checked)}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Purpose of our trust center"
            checked={formData.intro?.purpose_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'purpose_visible', checked)}
            disabled={!formData.info?.intro_visible}
          >
            <StyledTextField
              value={formData.intro?.purpose_text || ''}
              onChange={(value) => formData.info?.intro_visible && formData.intro?.purpose_visible && handleFieldChange('intro', 'purpose_text', value)}
              placeholder="Include a section to summarize the purpose of the Trust Center. Clearly communicate the company's commitment to responsible AI use, data privacy, and ethical AI practices."
              disabled={!formData.info?.intro_visible || !formData.intro?.purpose_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our statement"
            checked={formData.intro?.our_statement_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_statement_visible', checked)}
            disabled={!formData.info?.intro_visible}
          >
            <StyledTextField
              value={formData.intro?.our_statement_text || ''}
              onChange={(value) => formData.info?.intro_visible && formData.intro?.our_statement_visible && handleFieldChange('intro', 'our_statement_text', value)}
              placeholder="Provide a brief statement about the company's AI applications and their significance. Mention the main objectives, like data security, ethical AI, and trust-building with customers."
              disabled={!formData.info?.intro_visible || !formData.intro?.our_statement_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Our mission"
            checked={formData.intro?.our_mission_visible || false}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_mission_visible', checked)}
            disabled={!formData.info?.intro_visible}
          >
            <StyledTextField
              value={formData.intro?.our_mission_text || ''}
              onChange={(value) => formData.info?.intro_visible && formData.intro?.our_mission_visible && handleFieldChange('intro', 'our_mission_text', value)}
              placeholder="Input a mission statement reflecting your values related to AI governance and ethics."
              disabled={!formData.info?.intro_visible || !formData.intro?.our_mission_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Compliance Badges Section */}
      <SectionPaper sx={{ opacity: formData.info?.compliance_badges_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Compliance and certification badges"
          checked={formData.info?.compliance_badges_visible || false}
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
              disabled={!formData.info?.compliance_badges_visible}
            />
          ))}
        </Box>
      </SectionPaper>

      {/* Company Info Section */}
      <SectionPaper sx={{ opacity: formData.info?.company_description_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Company description and values"
          checked={formData.info?.company_description_visible || false}
          onToggle={(checked) => handleFieldChange('info', 'company_description_visible', checked)}
          label={formData.info?.company_description_visible ? "Enabled and visible" : "Disabled"}
        />
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Background"
            checked={formData.company_description?.background_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'background_visible', checked)}
            disabled={!formData.info?.company_description_visible}
          >
            <StyledTextField
              value={formData.company_description?.background_text || ''}
              onChange={(value) => formData.info?.company_description_visible && formData.company_description?.background_visible && handleFieldChange('company_description', 'background_text', value)}
              placeholder="Explain your company, what you do, and why trust in AI is essential to you."
              disabled={!formData.info?.company_description_visible || !formData.company_description?.background_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Core benefits"
            checked={formData.company_description?.core_benefits_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'core_benefits_visible', checked)}
            disabled={!formData.info?.company_description_visible}
          >
            <StyledTextField
              value={formData.company_description?.core_benefits_text || ''}
              onChange={(value) => formData.info?.company_description_visible && formData.company_description?.core_benefits_visible && handleFieldChange('company_description', 'core_benefits_text', value)}
              placeholder="Explain key benefits like efficiency, security, customer support, and ethical AI practices. You can also detail your AI offering functionality, use cases, and benefits to users."
              disabled={!formData.info?.company_description_visible || !formData.company_description?.core_benefits_visible}
            />
          </ToggleCard>
          <ToggleCard
            label="Compliance documentation"
            checked={formData.company_description?.compliance_doc_visible || false}
            onToggle={(_, checked) => handleFieldChange('company_description', 'compliance_doc_visible', checked)}
            disabled={!formData.info?.company_description_visible}
          >
            <StyledTextField
              value={formData.company_description?.compliance_doc_text || ''}
              onChange={(value) => formData.info?.company_description_visible && formData.company_description?.compliance_doc_visible && handleFieldChange('company_description', 'compliance_doc_text', value)}
              placeholder="Access our comprehensive compliance documentation and certifications."
              disabled={!formData.info?.company_description_visible || !formData.company_description?.compliance_doc_visible}
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      {/* Privacy Policy Section */}
      <SectionPaper sx={{ opacity: formData.info?.terms_and_contact_visible ? 1 : 0.5 }}>
        <SectionHeader
          title="Privacy policy, terms of service, and contact information"
          checked={formData.info?.terms_and_contact_visible || false}
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
                    checked={formData.terms_and_contact?.terms_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'terms_visible', checked)}
                    disabled={!formData.info?.terms_and_contact_visible}
                  />
                } 
                label="Terms of service" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="terms-of-service-input"
                placeholder="Enter terms of service URL..."
                width={458}
                value={formData.terms_and_contact?.terms_text || ''}
                onChange={(e) => formData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'terms_text', e.target.value)}
                disabled={!formData.terms_and_contact?.terms_visible || !formData.info?.terms_and_contact_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact?.privacy_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'privacy_visible', checked)}
                    disabled={!formData.info?.terms_and_contact_visible}
                  />
                } 
                label="Privacy policy" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="privacy-policy-input"
                placeholder="Enter privacy policy URL..."
                width={458}
                value={formData.terms_and_contact?.privacy_text || ''}
                onChange={(e) => formData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'privacy_text', e.target.value)}
                disabled={!formData.terms_and_contact?.privacy_visible || !formData.info?.terms_and_contact_visible}
                sx={styles.privacyField}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact?.email_visible || false}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'email_visible', checked)}
                    disabled={!formData.info?.terms_and_contact_visible}
                  />
                } 
                label="Company email" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field
                id="company-email-input"
                placeholder="Enter company email..."
                width={458}
                value={formData.terms_and_contact?.email_text || ''}
                onChange={(e) => formData.info?.terms_and_contact_visible && handleFieldChange('terms_and_contact', 'email_text', e.target.value)}
                disabled={!formData.terms_and_contact?.email_visible || !formData.info?.terms_and_contact_visible}
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