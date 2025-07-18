import { styled } from "@mui/material/styles";
import { Box, Card, Theme } from "@mui/material";

export const SectionPaper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  padding: theme.spacing(8),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  border: `1.5px solid ${theme.palette.border.light}`,
}));

export const CardActive = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.accent,
  minHeight: 140,
  border: `1.5px solid ${theme.palette.border.light}`,
  flex: 1,
}));

export const CardDisabled = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.default,
  border: `1.5px solid ${theme.palette.border.light}`,
  opacity: 0.6,
  minHeight: 140,
  flex: 1,
}));

export const PrivacyFields = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  flexWrap: 'wrap',
}));

export const styles = {
  description: {
    color: 'text.secondary',
    mb: 4,
    fontSize: 13,
  },

  sectionTitle: {
    fontWeight: 600,
    fontSize: 16,
  },

  sectionDescription: {
    color: 'text.secondary',
    my: 2,
    fontSize: 13,
  },

  cardText: {
    color: 'text.secondary',
    fontSize: 13,
    mt: 2,
  },

  checkbox: {
    "& .MuiCheckbox-root": {
      color: '#13715B',
      '&.Mui-checked': {
        color: '#13715B',
      },
      '&:hover': {
        backgroundColor: 'rgba(19, 113, 91, 0.04)',
      },
    },
  },

  badge: {
    background: 'background.accent',
    borderRadius: 2,
    p: 0,
    m: 0,
    mr: 0,
    minWidth: 160,
    flex: '0 0 160px',
    fontWeight: 500,
    "& .MuiFormControlLabel-label": {
      fontSize: 13,
    },
  },

  badgesContainer: {
    maxWidth: 700,
  },

  // TextField styles moved from inline
  textField: {
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
      fontSize: 13,
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '4px',
        '&:hover': {
          background: '#a8a8a8',
        },
      },
    },
    '& .MuiInputBase-root.Mui-disabled': {
      backgroundColor: '#f5f5f5',
      '& .MuiInputBase-input': {
        color: '#666',
        cursor: 'not-allowed',
      },
    }
  },

  // Save button styles
  saveButton: {
    alignSelf: "flex-end",
    width: "fit-content",
    gap: 2,
  },

  // Field styles for privacy section
  privacyField: {
    backgroundColor: 'background.main',
    "& input": {
      padding: "0 14px",
    },
  },
}; 

export const getFormControlLabelStyles = (theme: Theme) => ({
  margin: 0,
  '& .MuiFormControlLabel-label': {
    marginLeft: 8,
    marginRight: 0,
    color: theme.palette.text.secondary,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.5,
  },
}); 