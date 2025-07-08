export const INITIAL_FORM_DATA = {
  intro: {
    intro_visible: true,
    purpose_visible: true,
    purpose_text: '',
    our_statement_visible: false,
    our_statement_text: '',
    our_mission_visible: true,
    our_mission_text: '',
  },
  compliance_badges: {
    badges_visible: true,
    SOC2_Type_I: true,
    SOC2_Type_II: true,
    ISO_27001: true,
    ISO_42001: true,
    CCPA: true,
    GDPR: true,
    HIPAA: true,
    EU_AI_Act: true,
  },
  company_info: {
    company_info_visible: false,
    background_visible: false,
    background_text: '',
    core_benefit_visible: false,
    core_benefit_text: '',
    compliance_doc_visible: false,
    compliance_doc_text: '',
  },
  terms_and_contact: {
    is_visible: true,
    has_terms_of_service: true,
    terms_of_service: '',
    has_privacy_policy: true,
    privacy_policy: '',
    has_company_email: true,
    company_email: '',
  },
};

export const COMPLIANCE_BADGES = [
  { key: 'SOC2_Type_I', label: 'SOC2 Type I' },
  { key: 'SOC2_Type_II', label: 'SOC2 Type II' },
  { key: 'ISO_27001', label: 'ISO 27001' },
  { key: 'ISO_42001', label: 'ISO 42001' },
  { key: 'CCPA', label: 'CCPA' },
  { key: 'GDPR', label: 'GDPR' },
  { key: 'HIPAA', label: 'HIPAA' },
  { key: 'EU_AI_Act', label: 'EU AI Act' },
];

export const TEXT_FIELD_STYLES = {
  width: '100%',
  height: '100%',
  '& .MuiOutlinedInput-root': {
    border: 'none',
    backgroundColor: 'transparent',
    height: '100%',
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputBase-input': {
    padding: 0,
    height: '100% !important',
    resize: 'none',
  }
};

export const SUCCESS_MESSAGE = 'AI Trust Centre data saved successfully!'; 