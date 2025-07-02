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

export const BadgesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
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
  badge: {
    background: 'background.accent',
    borderRadius: 2,
    p: 1,
    fontWeight: 500,
  },
  textField: {
    minWidth: 458,
    background: 'background.default',
    borderRadius: 2,
    height: 34,
  },
  saveButton: {
    mt: 3,
    width: 120,
    backgroundColor: '#13715B',
    border: '1px solid #13715B',
    color: '#fff',
    borderRadius: '4px',
    height: 34,
    fontSize: 13,
    boxShadow: 'none',
    textTransform: 'inherit',
    '&:hover': {
      backgroundColor: '#13715B',
      border: '1px solid #13715B',
      boxShadow: 'none',
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