import React from "react";
import { Box, Typography, Stack, Checkbox, FormControlLabel, useTheme } from "@mui/material";
import Toggle from '../../../components/Inputs/Toggle';
import ToggleCard from '../../../components/Inputs/ToggleCard';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import Field from '../../../components/Inputs/Field';
import { 
  SectionPaper, 
  PrivacyFields, 
  styles,
  getFormControlLabelStyles 
} from './styles';

const AITrustCenterOverview: React.FC = () => {
  const theme = useTheme();
  const formControlLabelStyles = getFormControlLabelStyles(theme);

  // Local state for toggles
  const [purposeChecked, setPurposeChecked] = React.useState(true);
  const [statementChecked, setStatementChecked] = React.useState(false);
  const [missionChecked, setMissionChecked] = React.useState(true);
  const [backgroundChecked, setBackgroundChecked] = React.useState(false);
  const [coreBenefitsChecked, setCoreBenefitsChecked] = React.useState(false);

  const complianceBadges = ['SOC2 Type I', 'SOC2 Type II', 'ISO 27001', 'ISO 42001', 'CCPA', 'HIPAA', 'GDPR'];
  
  return (
    <Box>
      <Typography sx={styles.description}>
        This section serves as a comprehensive, user-friendly introduction to the company's AI practices, establishing a foundation of trust your customers. Users immediately understand the company's commitment to AI governance, security, and compliance, and have a clear path to further resources or contact if they have additional questions.
      </Typography>
      
      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Introduction</Typography>
          <FormControlLabel 
            control={<Toggle defaultChecked />} 
            label="Enabled and visible" 
            sx={formControlLabelStyles}
          />
        </Stack>
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Purpose of our trust center"
            checked={purposeChecked}
            onToggle={(_, checked) => setPurposeChecked(checked)}
          >
            <Typography sx={styles.cardText}>
              Include a section to summarize the purpose of the Trust Center. Clearly communicate the company's commitment to responsible AI use, data privacy, and ethical AI practices.
            </Typography>
          </ToggleCard>
          <ToggleCard
            label="Our statement"
            checked={statementChecked}
            onToggle={(_, checked) => setStatementChecked(checked)}
          >
            <Typography sx={styles.cardText}>
              Provide a brief statement about the company's AI applications and their significance. Mention the main objectives, like data security, ethical AI, and trust-building with customers.
            </Typography>
          </ToggleCard>
          <ToggleCard
            label="Our mission"
            checked={missionChecked}
            onToggle={(_, checked) => setMissionChecked(checked)}
          >
            <Typography sx={styles.cardText}>
              Input a mission statement reflecting your values related to AI governance and ethics.
            </Typography>
          </ToggleCard>
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Compliance and certification badges</Typography>
          <FormControlLabel 
            control={<Toggle defaultChecked />} 
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
          {complianceBadges.map((badge) => (
            <FormControlLabel
              key={badge}
              control={<Checkbox defaultChecked />}
              label={badge}
              sx={{ ...styles.badge, ...styles.checkbox }}
            />
          ))}
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Company description and values</Typography>
          <FormControlLabel 
            control={<Toggle />} 
            label="Disabled" 
            sx={formControlLabelStyles}
          />
        </Stack>
        <Box display="flex" gap={8} mt={2}>
          <ToggleCard
            label="Background"
            checked={backgroundChecked}
            onToggle={(_, checked) => setBackgroundChecked(checked)}
          >
            <Typography sx={styles.cardText}>
              Explain your company, what you do, and why trust in AI is essential to you.
            </Typography>
          </ToggleCard>
          <ToggleCard
            label="Core benefits"
            checked={coreBenefitsChecked}
            onToggle={(_, checked) => setCoreBenefitsChecked(checked)}
          >
            <Typography sx={styles.cardText}>
              Explain key benefits like efficiency, security, customer support, and ethical AI practices. You can also detail your AI offering functionality, use cases, and benefits to users.
            </Typography>
          </ToggleCard>
        </Box>
      </SectionPaper>

      <SectionPaper>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={styles.sectionTitle}>Privacy policy, terms of service, and contact information</Typography>
          <FormControlLabel 
            control={<Toggle defaultChecked />} 
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
                control={<Checkbox defaultChecked />} 
                label="Terms of service" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field placeholder="" width={458} sx={styles.textField} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={<Checkbox defaultChecked />} 
                label="Privacy policy" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field placeholder="" width={458} sx={styles.textField} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <FormControlLabel 
                control={<Checkbox defaultChecked />} 
                label="Company email" 
                sx={{ mr: 2, minWidth: 160, "& .MuiFormControlLabel-label": { fontSize: 13 }, ...styles.checkbox }} 
              />
              <Field placeholder="" width={458} sx={styles.textField} />
            </Stack>
          </Stack>
        </PrivacyFields>
      </SectionPaper>
      
      <CustomizableButton
        text="Save"
        variant="contained"
        sx={styles.saveButton}
      />
    </Box>
  );
};

export default AITrustCenterOverview; 