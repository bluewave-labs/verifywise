import React, { useRef } from "react";
import { Box, Stack, Typography, Button as MUIButton, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useStyles } from './styles';
import Toggle from '../../../components/Inputs/Toggle';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import SaveIcon from '@mui/icons-material/Save';
import DualButtonModal from '../../../vw-v2-components/Dialogs/DualButtonModal';
import { useAITrustCentreOverviewQuery, useAITrustCentreOverviewMutation } from "../../../../application/hooks/useAITrustCentreOverviewQuery";
import { uploadAITrustCentreLogo, deleteAITrustCentreLogo } from "../../../../application/repository/aiTrustCentre.repository";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { getAuthToken } from "../../../../application/redux/auth/getAuthToken";
import { apiServices } from "../../../../infrastructure/api/networkServices";

const AITrustCenterSettings: React.FC = () => {
  const styles = useStyles();
  const { data: overviewData, isLoading: loading, error } = useAITrustCentreOverviewQuery();
  const updateOverviewMutation = useAITrustCentreOverviewMutation();
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [logoRemoveSuccess, setLogoRemoveSuccess] = React.useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = React.useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState<any>(null);
  const [formData, setFormData] = React.useState<any>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [logoLoading, setLogoLoading] = React.useState(false);
  const [logoRemoving, setLogoRemoving] = React.useState(false);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [isRemoveLogoModalOpen, setIsRemoveLogoModalOpen] = React.useState(false);
  const [selectedLogoPreview, setSelectedLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch logo and convert Buffer to Blob URL
  const fetchLogoAsBlobUrl = async (tenantId: string): Promise<string | null> => {
    try {
      const authToken = getAuthToken();
      const response = await apiServices.get(`/aiTrustCentre/${tenantId}/logo`, {
        responseType: 'json',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const responseData = response.data as any;
      if (responseData?.data?.logo?.content?.data) {
        // Convert Buffer data to Uint8Array
        const bufferData = new Uint8Array(responseData.data.logo.content.data);
        // Create Blob from the buffer data
        const blob = new Blob([bufferData], { type: 'image/png' }); // Assuming PNG, adjust as needed
        // Create object URL
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      }
      return null;
    } catch (error) {
      console.error('Error fetching logo:', error);
      return null;
    }
  };

  // Process overview data and fetch logo when data is available
  React.useEffect(() => {
    if (overviewData) {
      const processData = async () => {
        // Always check if a logo exists for this tenant
        const authToken = getAuthToken();
        const tokenData = extractUserToken(authToken);
        const tenantId = tokenData?.tenantId;
        
        if (tenantId) {
          setLogoLoading(true);
          try {
            const logoBlobUrl = await fetchLogoAsBlobUrl(tenantId);
            if (logoBlobUrl) {
              // Logo exists, update the overview data
              const updatedData = {
                ...overviewData,
                info: {
                  ...overviewData.info,
                  logo_url: logoBlobUrl,
                },
              };
              setFormData(updatedData);
              setOriginalData(updatedData);
            } else {
              // No logo found, use the original data
              setFormData(overviewData);
              setOriginalData(overviewData);
            }
          } catch (error) {
            console.log('No existing logo found or error fetching logo:', error);
            // Use the original data even if logo fetch fails
            setFormData(overviewData);
            setOriginalData(overviewData);
          } finally {
            setLogoLoading(false);
          }
        } else {
          // No tenant ID, use the original data
          setFormData(overviewData);
          setOriginalData(overviewData);
        }
      };
      
      processData();
    }
  }, [overviewData]);

  React.useEffect(() => {
    if (formData && originalData) {
      // Create copies without logo_url to exclude logo changes from unsaved changes
      const formDataWithoutLogo = {
        ...formData,
        info: formData.info ? {
          ...formData.info,
          logo_url: undefined
        } : undefined
      };
      
      const originalDataWithoutLogo = {
        ...originalData,
        info: originalData.info ? {
          ...originalData.info,
          logo_url: undefined
        } : undefined
      };
      
      const hasChanges = JSON.stringify(formDataWithoutLogo) !== JSON.stringify(originalDataWithoutLogo);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalData]);

  // Cleanup function to revoke object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (selectedLogoPreview) {
        URL.revokeObjectURL(selectedLogoPreview);
      }
      // Also revoke the logo URL if it's a Blob URL
      if (formData?.info?.logo_url && formData.info.logo_url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.info.logo_url);
      }
    };
  }, [selectedLogoPreview, formData?.info?.logo_url]);

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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        setLogoError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setLogoError('File size must be less than 5MB');
        return;
      }

      // Create preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setSelectedLogoPreview(previewUrl);
      setLogoError(null);
      
      // Upload the file
      setLogoUploading(true);
      
      try {
        const response = await uploadAITrustCentreLogo(file);
        
        // Update the form data with the new logo URL if provided in response
        if (response?.data?.logo) {
          // Get tenant ID from JWT token
          const authToken = getAuthToken();
          const tokenData = extractUserToken(authToken);
          const tenantId = tokenData?.tenantId;
          
          if (tenantId) {
            // Fetch the logo and convert to Blob URL
            const logoBlobUrl = await fetchLogoAsBlobUrl(tenantId);
            
            if (logoBlobUrl) {
              const updatedFormData = {
                ...formData,
                info: {
                  ...formData?.info,
                  logo_url: logoBlobUrl,
                },
              };
              setFormData(updatedFormData);
              setOriginalData(updatedFormData);
            } else {
              setLogoError('Failed to load uploaded logo');
            }
          } else {
            console.error('Could not extract tenant ID from token');
            setLogoError('Failed to get tenant information');
          }
        } else {
          console.log('No logo ID in response');
        }
        
        // Clear the preview since we now have the uploaded URL
        if (selectedLogoPreview) {
          URL.revokeObjectURL(selectedLogoPreview);
        }
        setSelectedLogoPreview(null);
        
        // Show success message from API response
        if (response?.data?.message) {
          setLogoUploadSuccess(response.data.message);
        } else {
          setLogoUploadSuccess('Company logo uploaded successfully');
        }
      } catch (error: any) {
        console.error('Error uploading logo:', error);
        setLogoError(error.message || 'Failed to upload logo');
        // Clear the preview on error
        if (selectedLogoPreview) {
          URL.revokeObjectURL(selectedLogoPreview);
        }
        setSelectedLogoPreview(null);
      } finally {
        setLogoUploading(false);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveLogo = async () => {
    setIsRemoveLogoModalOpen(true);
  };

  const handleRemoveLogoCancel = () => {
    setIsRemoveLogoModalOpen(false);
  };

  const handleRemoveLogoConfirm = async () => {
    setLogoRemoving(true);
    try {
      // Call the delete logo API
      await deleteAITrustCentreLogo();
      
      // Clear the logo URL from form data
      const updatedFormData = {
        ...formData,
        info: {
          ...formData?.info,
          logo_url: null,
        },
      };
      
      setFormData(updatedFormData);
      setOriginalData(updatedFormData);
      
      // Clear any preview
      if (selectedLogoPreview) {
        URL.revokeObjectURL(selectedLogoPreview);
        setSelectedLogoPreview(null);
      }
      
      // Also revoke the current logo URL if it's a Blob URL
      if (formData?.info?.logo_url && formData.info.logo_url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.info.logo_url);
      }
      
      setIsRemoveLogoModalOpen(false);
      setLogoRemoveSuccess(true);
    } catch (error) {
      console.error('Error removing logo:', error);
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setLogoRemoving(false);
    }
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
      
      // Call the updateOverview mutation
      await updateOverviewMutation.mutateAsync(dataToSave);
      
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

  const handleLogoRemoveSuccessClose = () => {
    setLogoRemoveSuccess(false);
  };

  const handleLogoUploadSuccessClose = () => {
    setLogoUploadSuccess(null);
  };

  const handleLogoErrorClose = () => {
    setLogoError(null);
    // Clear any preview when there's an error
    if (selectedLogoPreview) {
      URL.revokeObjectURL(selectedLogoPreview);
      setSelectedLogoPreview(null);
    }
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
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              border: '2px dashed #ddd',
              backgroundColor: '#fafafa',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f5f5f5'
              }
            }}>
              {logoUploading || logoLoading ? (
                <CircularProgress size={24} />
              ) : selectedLogoPreview ? (
                <Box
                  component="img"
                  src={selectedLogoPreview}
                  alt="Selected Logo Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 1
                  }}
                />
              ) : formData?.info?.logo_url ? (
                <Box
                  component="img"
                  src={formData.info.logo_url}
                  alt="Company Logo"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 1
                  }}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
                      L
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: '#888', textAlign: 'center' }}>
                    Logo
                  </Typography>
                </Box>
              )}
            </Box>
            <MUIButton
              variant="outlined"
              component="label"
              sx={styles.replaceButton}
              disabled={logoUploading || logoLoading}
            >
              {logoUploading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Uploading...
                </>
              ) : logoLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : (
                'Replace'
              )}
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
              disabled={logoRemoving || logoUploading || logoLoading}
            >
              {logoRemoving ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </MUIButton>
          </Box>

          {/* Header Color Row */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Header color</Typography>
            <Typography sx={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              Select or customize your top header color
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <Typography sx={styles.customColorLabel}>Custom color:</Typography>
            <input
              type="text"
              value={formData?.info?.header_color}
              onChange={e => handleFieldChange('info', 'header_color', e.target.value)}
              style={styles.customColorInput}
            />
            {/* Color picker input positioned to the right and down */}
            <input
              type="color"
              value={formData?.info?.header_color || '#000000'}
              onChange={e => handleFieldChange('info', 'header_color', e.target.value)}
              style={{
                position: 'absolute',
                top: '40px',
                left: '200px',
                opacity: 0,
                width: '1px',
                height: '1px',
                border: 'none',
                padding: 0,
                margin: 0,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
              }}
              id="color-picker"
            />
            {/* Clickable color circle that triggers color picker */}
            <Box 
              sx={{
                ...styles.customColorCircle(formData?.info?.header_color),
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease',
                }
              }}
              onClick={() => document.getElementById('color-picker')?.click()}
            />
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
          <Stack direction="column" gap={1}>
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
      
      {/* Success Snackbar */}
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

      {/* Logo Remove Success Snackbar */}
      <Snackbar
        open={logoRemoveSuccess}
        autoHideDuration={4000}
        onClose={handleLogoRemoveSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleLogoRemoveSuccessClose} 
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
          Logo removed successfully
        </Alert>
      </Snackbar>

      {/* Logo Upload Success Snackbar */}
      <Snackbar
        open={!!logoUploadSuccess}
        autoHideDuration={4000}
        onClose={handleLogoUploadSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleLogoUploadSuccessClose} 
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
          {logoUploadSuccess}
        </Alert>
      </Snackbar>

      {/* Error Snackbar for Logo Upload */}
      <Snackbar
        open={!!logoError}
        autoHideDuration={6000}
        onClose={handleLogoErrorClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleLogoErrorClose} 
          severity="error" 
          sx={{ 
            width: '100%',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            '& .MuiAlert-icon': {
              color: '#dc2626',
            }
          }}
        >
          {logoError}
        </Alert>
      </Snackbar>

      {/* Remove Logo Confirmation Modal */}
      {isRemoveLogoModalOpen && (
        <DualButtonModal
          title="Confirm Logo Removal"
          body={
            <Typography fontSize={13}>
              Are you sure you want to remove the company logo? This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText={logoRemoving ? "Removing..." : "Remove"}
          onCancel={handleRemoveLogoCancel}
          onProceed={handleRemoveLogoConfirm}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </Box>
  );
};

export default AITrustCenterSettings; 