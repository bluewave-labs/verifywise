import React, { useRef } from "react";
import { Box, Stack, Typography, Button as MUIButton, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useStyles } from './styles';
import Toggle from '../../../components/Inputs/Toggle';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import SaveIcon from '@mui/icons-material/Save';
import { useAITrustCentreOverview } from "../../../../application/hooks/useAITrustCentreOverview";

const AITrustCenterSettings: React.FC = () => {
  const styles = useStyles();
  const { loading, error, updateOverview, fetchOverview } = useAITrustCentreOverview();
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState<any>(null);
  const [formData, setFormData] = React.useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  React.useEffect(() => {
    if (formData && originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalData]);

  // Generic handler for form field changes
  const handleFieldChange = (section: string, field: string, value: boolean | string) => {
    setFormData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      // reader.onload = (ev) => setLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    // setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  const handleSave = async () => {
    if (!formData) return;
    
    try {
      console.log('Saving AI Trust Centre data from Settings', formData);
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

  const handleSuccessClose = () => {
    setSaveSuccess(false);
  };

  // Show loading state while data is being fetched
  if (loading || !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Typography color="error">Error loading AI Trust Center settings</Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      {/* Appearance Card */}
      <Box sx={styles.card}>
        <Typography sx={styles.sectionTitle}>Appearance</Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          rowGap: '50px',
          columnGap: '250px',
          alignItems: 'center',
          mt: 2
        }}>
          {/* Company Logo Row */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Company logo</Typography>
            <Typography sx={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              This logo will be shown in the AI Trust Center page
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 120,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)',
              color: '#333',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
            </Box>
            <MUIButton
              variant="outlined"
              component="label"
              sx={styles.replaceButton}
            >
              Replace
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleLogoChange}
              />
            </MUIButton>
            <MUIButton
              variant="outlined"
              sx={styles.removeButton}
              onClick={handleRemoveLogo}
            >
              Remove
            </MUIButton>
          </Box>

          {/* Header Color Row */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Header color</Typography>
            <Typography sx={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              Select or customize your top header color
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Typography sx={styles.customColorLabel}>Custom color:</Typography>
            <input
              type="text"
              value={formData?.info?.header_color}
              onChange={e => handleFieldChange('info', 'header_color', e.target.value)}
              style={styles.customColorInput}
            />
            <Box sx={styles.customColorCircle(formData?.info?.header_color)} />
          </Box>

          {/* Trust Center Title Row */}
          <Box sx={{ mb: 20 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Trust center title</Typography>
            <Typography sx={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              This title will be shown in the AI Trust Center page
            </Typography>
          </Box>
          <Field
            placeholder="Company's AI Trust Center"
            value={formData?.info?.title}
            onChange={e => handleFieldChange('info', 'title', e.target.value)}
            sx={styles.trustTitleInput}
          />
        </Box>
      </Box>

      {/* Visibility Card */}
      <Box sx={styles.card}>
        <Box sx={{mb:10}}>
        <Typography sx={styles.sectionTitle}>Visibility</Typography>
        </Box>
        <Box sx={{ ...styles.toggleRow }}>
          <Stack direction="column" gap={1} sx={{ flex: 0.5 }}>
            <Typography sx={styles.toggleLabel}>Enable AI Trust Center</Typography>
            <Typography sx={{ color: '#888', fontWeight: 400, fontSize: 12 }}>
              If enabled, page will be available under <b>/ai-trust-center</b> directory.
            </Typography>
          </Stack>
          <Toggle checked={formData?.info?.visible || false} onChange={(_, checked) => handleFieldChange('info', 'visible', checked)} />
        </Box>
      </Box>

      {/* Save Button Row */}
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
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AITrustCenterSettings; 