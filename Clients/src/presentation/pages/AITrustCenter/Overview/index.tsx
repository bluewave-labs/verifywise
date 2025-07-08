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
  TEXT_FIELD_STYLES,
  SUCCESS_MESSAGE
} from './constants';

const AITrustCenterOverview: React.FC = () => {
  const theme = useTheme();
  const formControlLabelStyles = getFormControlLabelStyles(theme);
  
  const { data, loading, error, updateOverview } = useAITrustCentreOverview();

  // Local state for form data and notifications
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState(INITIAL_FORM_DATA);

  // Load saved form data from localStorage on component mount
  React.useEffect(() => {
    const savedFormData = localStorage.getItem('aiTrustCentreFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
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

  // Update form data when API data is loaded
  React.useEffect(() => {
    if (data) {
      console.log('AI Trust Centre data loaded from API:', data);
      
      // The actual data is nested under data.data
      const apiData = (data as any).data || data;
      
      // Merge API data with existing form data instead of completely overwriting
      setFormData(prevFormData => {
        const newFormData = {
          intro: { 
            ...prevFormData.intro, 
            ...(apiData.intro || {}),
            // Only update boolean values if they exist in API data
            intro_visible: apiData.intro?.intro_visible !== undefined ? apiData.intro.intro_visible : prevFormData.intro.intro_visible,
            purpose_visible: apiData.intro?.purpose_visible !== undefined ? apiData.intro.purpose_visible : prevFormData.intro.purpose_visible,
            our_statement_visible: apiData.intro?.our_statement_visible !== undefined ? apiData.intro.our_statement_visible : prevFormData.intro.our_statement_visible,
            our_mission_visible: apiData.intro?.our_mission_visible !== undefined ? apiData.intro.our_mission_visible : prevFormData.intro.our_mission_visible,
          },
          compliance_badges: { 
            ...prevFormData.compliance_badges, 
            ...(apiData.compliance_badges || {}),
            // Only update boolean values if they exist in API data
            badges_visible: apiData.compliance_badges?.badges_visible !== undefined ? apiData.compliance_badges.badges_visible : prevFormData.compliance_badges.badges_visible,
            SOC2_Type_I: apiData.compliance_badges?.SOC2_Type_I !== undefined ? apiData.compliance_badges.SOC2_Type_I : prevFormData.compliance_badges.SOC2_Type_I,
            SOC2_Type_II: apiData.compliance_badges?.SOC2_Type_II !== undefined ? apiData.compliance_badges.SOC2_Type_II : prevFormData.compliance_badges.SOC2_Type_II,
            ISO_27001: apiData.compliance_badges?.ISO_27001 !== undefined ? apiData.compliance_badges.ISO_27001 : prevFormData.compliance_badges.ISO_27001,
            ISO_42001: apiData.compliance_badges?.ISO_42001 !== undefined ? apiData.compliance_badges.ISO_42001 : prevFormData.compliance_badges.ISO_42001,
            CCPA: apiData.compliance_badges?.CCPA !== undefined ? apiData.compliance_badges.CCPA : prevFormData.compliance_badges.CCPA,
            GDPR: apiData.compliance_badges?.GDPR !== undefined ? apiData.compliance_badges.GDPR : prevFormData.compliance_badges.GDPR,
            HIPAA: apiData.compliance_badges?.HIPAA !== undefined ? apiData.compliance_badges.HIPAA : prevFormData.compliance_badges.HIPAA,
            EU_AI_Act: apiData.compliance_badges?.EU_AI_Act !== undefined ? apiData.compliance_badges.EU_AI_Act : prevFormData.compliance_badges.EU_AI_Act,
          },
          company_info: { 
            ...prevFormData.company_info, 
            ...(apiData.company_info || {}),
            // Only update boolean values if they exist in API data
            company_info_visible: apiData.company_info?.company_info_visible !== undefined ? apiData.company_info.company_info_visible : prevFormData.company_info.company_info_visible,
            background_visible: apiData.company_info?.background_visible !== undefined ? apiData.company_info.background_visible : prevFormData.company_info.background_visible,
            core_benefit_visible: apiData.company_info?.core_benefit_visible !== undefined ? apiData.company_info.core_benefit_visible : prevFormData.company_info.core_benefit_visible,
            compliance_doc_visible: apiData.company_info?.compliance_doc_visible !== undefined ? apiData.company_info.compliance_doc_visible : prevFormData.company_info.compliance_doc_visible,
          },
          terms_and_contact: { 
            ...prevFormData.terms_and_contact, 
            ...(apiData.terms_and_contact || {}),
            // Only update boolean values if they exist in API data
            is_visible: apiData.terms_and_contact?.is_visible !== undefined ? apiData.terms_and_contact.is_visible : prevFormData.terms_and_contact.is_visible,
            has_terms_of_service: apiData.terms_and_contact?.has_terms_of_service !== undefined ? apiData.terms_and_contact.has_terms_of_service : prevFormData.terms_and_contact.has_terms_of_service,
            has_privacy_policy: apiData.terms_and_contact?.has_privacy_policy !== undefined ? apiData.terms_and_contact.has_privacy_policy : prevFormData.terms_and_contact.has_privacy_policy,
            has_company_email: apiData.terms_and_contact?.has_company_email !== undefined ? apiData.terms_and_contact.has_company_email : prevFormData.terms_and_contact.has_company_email,
          },
        };
        
        console.log('Merged form data:', newFormData);
        return newFormData;
      });
    }
  }, [data]);

  // Generic handler for form field changes
  const handleFieldChange = (section: keyof typeof formData, field: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Helper function to safely get compliance badge value
  const getComplianceBadgeValue = (badgeKey: string): boolean => {
    return formData.compliance_badges[badgeKey as keyof typeof formData.compliance_badges] as boolean || false;
  };

  // Handle save
  const handleSave = async () => {
    try {
      console.log('Saving AI Trust Centre data:', formData);
      console.log('Compliance badges before save:', formData.compliance_badges);
      
      // Ensure we send complete data with all boolean values explicitly set
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
      
      console.log('Data being sent to API:', dataToSend);
      
      await updateOverview(dataToSend);
      setSaveSuccess(true);
      console.log('AI Trust Centre data saved successfully');
      
      // Don't let the hook refresh data automatically - keep our local state
      // The API response might not include all the boolean values properly
    } catch (error) {
      console.error('Save failed:', error);
      // Error is already handled in the hook and displayed in the UI
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

      <Typography sx={styles.description}>
        This section serves as a comprehensive, user-friendly introduction to the company's AI practices, establishing a foundation of trust your customers. Users immediately understand the company's commitment to AI governance, security, and compliance, and have a clear path to further resources or contact if they have additional questions.
      </Typography>
      
      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Introduction</Typography>
          <FormControlLabel 
            control={
              <Toggle 
                checked={formData.intro.intro_visible}
                onChange={(_, checked) => handleFieldChange('intro', 'intro_visible', checked)}
              />
            } 
            label="Enabled and visible" 
            sx={formControlLabelStyles}
          />
        </Stack>
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Purpose of our trust center"
            checked={formData.intro.purpose_visible}
            onToggle={(_, checked) => handleFieldChange('intro', 'purpose_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Include a section to summarize the purpose of the Trust Center. Clearly communicate the company's commitment to responsible AI use, data privacy, and ethical AI practices."
              value={formData.intro.purpose_text || ''}
              onChange={(e) => handleFieldChange('intro', 'purpose_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
          <ToggleCard
            label="Our statement"
            checked={formData.intro.our_statement_visible}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_statement_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Provide a brief statement about the company's AI applications and their significance. Mention the main objectives, like data security, ethical AI, and trust-building with customers."
              value={formData.intro.our_statement_text || ''}
              onChange={(e) => handleFieldChange('intro', 'our_statement_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
          <ToggleCard
            label="Our mission"
            checked={formData.intro.our_mission_visible}
            onToggle={(_, checked) => handleFieldChange('intro', 'our_mission_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Input a mission statement reflecting your values related to AI governance and ethics."
              value={formData.intro.our_mission_text || ''}
              onChange={(e) => handleFieldChange('intro', 'our_mission_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Compliance and certification badges</Typography>
          <FormControlLabel 
            control={
              <Toggle 
                checked={formData.compliance_badges.badges_visible}
                onChange={(_, checked) => handleFieldChange('compliance_badges', 'badges_visible', checked)}
              />
            } 
            label="Enabled and visible" 
            sx={formControlLabelStyles}
          />
        </Stack>
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
            <FormControlLabel
              key={badge.key}
              control={
                <Checkbox 
                  checked={getComplianceBadgeValue(badge.key)}
                  onChange={(_, checked) => handleFieldChange('compliance_badges', badge.key, checked)}
                />
              }
              label={badge.label}
              sx={{ ...styles.badge, ...styles.checkbox }}
            />
          ))}
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Company description and values</Typography>
          <FormControlLabel 
            control={
              <Toggle 
                checked={formData.company_info.company_info_visible}
                onChange={(_, checked) => handleFieldChange('company_info', 'company_info_visible', checked)}
              />
            } 
            label={formData.company_info.company_info_visible ? "Enabled and visible" : "Disabled"} 
            sx={formControlLabelStyles}
          />
        </Stack>
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Background"
            checked={formData.company_info.background_visible}
            onToggle={(_, checked) => handleFieldChange('company_info', 'background_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Explain your company, what you do, and why trust in AI is essential to you."
              value={formData.company_info.background_text || ''}
              onChange={(e) => handleFieldChange('company_info', 'background_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
          <ToggleCard
            label="Core benefits"
            checked={formData.company_info.core_benefit_visible}
            onToggle={(_, checked) => handleFieldChange('company_info', 'core_benefit_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Explain key benefits like efficiency, security, customer support, and ethical AI practices. You can also detail your AI offering functionality, use cases, and benefits to users."
              value={formData.company_info.core_benefit_text || ''}
              onChange={(e) => handleFieldChange('company_info', 'core_benefit_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
          <ToggleCard
            label="Compliance documentation"
            checked={formData.company_info.compliance_doc_visible}
            onToggle={(_, checked) => handleFieldChange('company_info', 'compliance_doc_visible', checked)}
          >
            <TextField
              multiline
              placeholder="Access our comprehensive compliance documentation and certifications."
              value={formData.company_info.compliance_doc_text || ''}
              onChange={(e) => handleFieldChange('company_info', 'compliance_doc_text', e.target.value)}
              sx={{ 
                ...TEXT_FIELD_STYLES,
                '& .MuiInputBase-input': {
                  ...TEXT_FIELD_STYLES['& .MuiInputBase-input'],
                  ...styles.cardText,
                }
              }}
              variant="outlined"
              size="small"
            />
          </ToggleCard>
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Privacy policy, terms of service, and contact information</Typography>
          <FormControlLabel 
            control={
              <Toggle 
                checked={formData.terms_and_contact.is_visible}
                onChange={(_, checked) => handleFieldChange('terms_and_contact', 'is_visible', checked)}
              />
            } 
            label="Enabled and visible" 
            sx={formControlLabelStyles}
          />
        </Stack>
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
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'has_terms_of_service', checked)}
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
                onChange={(e) => handleFieldChange('terms_and_contact', 'terms_of_service', e.target.value)}
                disabled={!formData.terms_and_contact.has_terms_of_service}
                sx={{
                  backgroundColor: theme.palette.background.main,
                  "& input": {
                    padding: "0 14px",
                  },
                }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact.has_privacy_policy}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'has_privacy_policy', checked)}
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
                onChange={(e) => handleFieldChange('terms_and_contact', 'privacy_policy', e.target.value)}
                disabled={!formData.terms_and_contact.has_privacy_policy}
                sx={{
                  backgroundColor: theme.palette.background.main,
                  "& input": {
                    padding: "0 14px",
                  },
                }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={formData.terms_and_contact.has_company_email}
                    onChange={(_, checked) => handleFieldChange('terms_and_contact', 'has_company_email', checked)}
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
                onChange={(e) => handleFieldChange('terms_and_contact', 'company_email', e.target.value)}
                disabled={!formData.terms_and_contact.has_company_email}
                sx={{
                  backgroundColor: theme.palette.background.main,
                  "& input": {
                    padding: "0 14px",
                  },
                }}
              />
            </Stack>
          </Stack>
        </PrivacyFields>
      </SectionPaper>
      
      <Stack>
        <CustomizableButton
          sx={{
            alignSelf: "flex-end",
            width: "fit-content",
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          icon={<SaveIcon />}
          variant="contained"
          onClick={handleSave}
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