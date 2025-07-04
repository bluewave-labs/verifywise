import React, { useRef, useState } from "react";
import { Box, Stack, Typography, Button as MUIButton } from "@mui/material";
import { useStyles } from './styles';
import Toggle from '../../../components/Inputs/Toggle';
import Field from '../../../components/Inputs/Field';
import CustomizableButton from '../../../vw-v2-components/Buttons';
import SaveIcon from '@mui/icons-material/Save';

const COLOR_SWATCHES = [
  '#F3F3F6', '#E9E6F7', '#E6F0FA', '#E6F7F2', '#FBE6F7', '#FBE6E6',
];

const DEFAULT_LOGO = 'https://via.placeholder.com/120x48?text=Logo';

const AITrustCenterSettings: React.FC = () => {
  const styles = useStyles();
  const [logo, setLogo] = useState<string | null>(null);
  const [headerColor, setHeaderColor] = useState(COLOR_SWATCHES[2]);
  const [customColor, setCustomColor] = useState('#2C6392');
  const [trustTitle, setTrustTitle] = useState('');
  const [enableLastUpdated, setEnableLastUpdated] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSaveDisabled = false;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleColorSwatch = (color: string) => {
    setHeaderColor(color);
    setCustomColor(color);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setHeaderColor(e.target.value);
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
        <Typography sx={styles.sectionDescription}>
          Configure how your AI Trust Center page will look.
        </Typography>
        {/* Logo Row */}
        <Box sx={styles.row}>
          <Box sx={styles.logoBox}>
            <img
              src={logo || DEFAULT_LOGO}
              alt="Company Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
            />
          </Box>
          <Box sx={styles.logoActions}>
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
        </Box>
        {/* Header Color Row */}
        <Box sx={styles.colorSwatchRow}>

          <Box>
            <Stack direction="column" gap={1}>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                Header color
              </Typography>
              <Typography sx={{ fontSize: 12 }}>
                Select or customize your header color
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Stack direction="column" gap={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, direction: 'row' }}>
                {COLOR_SWATCHES.map((color) => (
                  <Box key={color} sx={styles.colorSwatch(color, headerColor === color)} onClick={() => handleColorSwatch(color)} />
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'row' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>Custom color:</Typography>
                <input type="color" value={customColor} onChange={handleCustomColor} style={{ ...styles.customColorInput, padding: 0, border: 'none', background: 'none' }} />
                <Box sx={styles.colorSwatch(customColor, headerColor === customColor)}
                  style={{ display: 'inline-block', marginLeft: 8, verticalAlign: 'middle' }}
                  onClick={() => handleColorSwatch(customColor)}
                />
              </Box>
            </Stack>
          </Box>
        </Box>


        <Box sx={styles.colorSwatchRow}>
          <Box sx={{ flex: 0.5 }}>
            <Stack direction="column" gap={1}>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                Trust center title
              </Typography>
              <Typography sx={{ fontSize: 12 }}>
                This title will be shown on the top of the page.
              </Typography>
            </Stack>
          </Box>
          <Box>
            <Field
              placeholder="Company's AI Trust Center"
              value={trustTitle}
              onChange={e => setTrustTitle(e.target.value)}
              sx={styles.trustTitleInput}
            />
          </Box>
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
        <Box sx={{ ...styles.toggleRow}}>
          <Stack direction="column" gap={1} sx={{ flex: 0.5 }}>
            <Typography sx={styles.toggleLabel}>Enable last updated</Typography>
            <Typography sx={{ color: '#888', fontWeight: 400, fontSize: 12 }}>
              If enabled, the last updated time will be shown
            </Typography>
          </Stack>
          <Toggle checked={enableLastUpdated} onChange={(_, checked) => setEnableLastUpdated(checked)} />
        </Box>
      </Box>

      {/* Save Button Row */}
      <Stack sx={{ width: "100%", maxWidth: 800 }}>
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