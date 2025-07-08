import React, { useRef, useState } from "react";
import { Box, Stack, Typography, Button as MUIButton } from "@mui/material";
import { useStyles } from './styles';
import Toggle from '../../../components/Inputs/Toggle';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import SaveIcon from '@mui/icons-material/Save';

// const COLOR_SWATCHES = [
//   '#F3F3F6', '#E9E6F7', '#E6F0FA', '#E6F7F2', '#FBE6F7', '#FBE6E6',
// ];

const AITrustCenterSettings: React.FC = () => {
  const styles = useStyles();
  // const [logo, setLogo] = useState<string | null>(null);
  // const [headerColor, setHeaderColor] = useState(COLOR_SWATCHES[2]);
  const [customColor, setCustomColor] = useState('#2C6392');
  const [trustTitle, setTrustTitle] = useState('');
  const [enableLastUpdated, setEnableLastUpdated] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSaveDisabled = false;

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

  // const handleColorSwatch = (color: string) => {
    // setHeaderColor(color);
    // setCustomColor(color);
  // };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    // setHeaderColor(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Save logic here
  };

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
              value={customColor}
              onChange={handleCustomColor}
              style={styles.customColorInput}
            />
            <Box sx={styles.customColorCircle(customColor)} />
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
            value={trustTitle}
            onChange={e => setTrustTitle(e.target.value)}
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
          <Toggle checked={enableLastUpdated} onChange={(_, checked) => setEnableLastUpdated(checked)} />
        </Box>
      </Box>

      {/* Save Button Row */}
      <Stack>
        <CustomizableButton
          sx={{
            alignSelf: "flex-end",
            width: "fit-content",
            backgroundColor: "#13715B",
            border: isSaveDisabled
              ? "1px solid rgba(0, 0, 0, 0.26)"
              : "1px solid #13715B",
            gap: 2,
          }}
          icon={<SaveIcon />}
          variant="contained"
          onClick={(event: any) => {
            handleSubmit(event);
          }}
          isDisabled={isSaveDisabled}
          text="Save"
        />
      </Stack>
    </Box>
  );
};

export default AITrustCenterSettings; 