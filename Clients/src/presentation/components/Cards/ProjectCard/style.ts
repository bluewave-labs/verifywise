import { Theme } from "@mui/material";

export const projectCardStyle = (theme: Theme) => ({
  border: `1px solid ${theme.palette.border.dark}`,
  borderRadius: "4px",
  padding: "16px",
  minWidth: 300,
  width: "100%",
  maxWidth: "100&",
  background: `linear-gradient(135deg, ${theme.palette.background.main} 0%, ${theme.palette.background.accent} 100%)`,
});

export const projectCardTitleStyle = (theme: Theme) => ({
  fontSize: 13,
  color: theme.palette.text.primary,
  fontWeight: 600,
});

export const frameworkLogo = {
  width: 20,
  height: 20,
  borderRadius: "50%",
};

export const progressStyle = (theme: Theme) => ({
  color: theme.palette.text.accent,
  fontSize: 11,
  fontWeight: 400,
});

export const projectCardSpecsStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};

export const projectCardSpecKeyStyle = (theme: Theme) => ({ fontSize: 11, color: theme.palette.text.accent });

export const projectCardSpecValueStyle = (theme: Theme) => ({ fontSize: 13, color: theme.palette.text.secondary });

export const viewProjectButtonStyle = (theme: Theme) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.background.main,
  fontSize: 13,
  fontWeight: 600,
  px: 3,
  mt: 1,
  height: 34,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  border: "none",
});

export const euAiActChipStyle = (theme: Theme) => ({
  backgroundColor: '#014576',
  color: theme.palette.background.main,
  fontWeight: 600,
  fontSize: 11,
  height: 28,
  borderRadius: "4px",
  mb: 1,
  textTransform: 'none',
  minWidth: 'auto',
  padding: '0 6px 0 10px',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#014576',
    boxShadow: 'none',
  },
  '&:active': {
    backgroundColor: '#014576',
    boxShadow: 'none',
  },
  '&:focus': {
    backgroundColor: '#014576',
    boxShadow: 'none',
  },
  '& .MuiButton-endIcon': {
    marginLeft: '4px',
  },
});

export const iso42001ChipStyle = (theme: Theme) => ({
  backgroundColor: '#0ca5af',
  color: theme.palette.background.main,
  fontWeight: 600,
  fontSize: 11,
  height: 28,
  borderRadius: "4px",
  mb: 1,
  textTransform: 'none',
  minWidth: 'auto',
  padding: '0 6px 0 10px',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#0ca5af',
    boxShadow: 'none',
  },
  '&:active': {
    backgroundColor: '#0ca5af',
    boxShadow: 'none',
  },
  '&:focus': {
    backgroundColor: '#0ca5af',
    boxShadow: 'none',
  },
  '& .MuiButton-endIcon': {
    marginLeft: '4px',
  },
});
