import { useTheme } from '@mui/material/styles';

export const useStyles = () => {
  const theme = useTheme();

  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(4),
      fontSize: 13,
      width: '100%',
      margin: '0 auto',
    },
    card: {
      background: theme.palette.background.paper,
      border: `1.5px solid ${theme.palette.border.light}`,
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(8,8),
      marginBottom: theme.spacing(4),
      boxShadow: 'none',
    },
    sectionTitle: {
      fontWeight: 600,
      fontSize: 15,
      marginBottom: theme.spacing(2),
      color: theme.palette.text.primary,
    },
    sectionDescription: {
      color: theme.palette.text.secondary,
      fontSize: 13,
      marginBottom: theme.spacing(3),
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(3),
      marginBottom: theme.spacing(3),
    },
    logoBox: {
      width: 120,
      height: 48,
      borderRadius: 2,
      background: 'linear-gradient(90deg, #A6C1EE 0%, #FBC2EB 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(2),
      border: `1px solid ${theme.palette.border.light}`,
    },
    logoActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    },
    colorSwatchRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
      flex:0.5
    },
    colorSwatch: (color: string, selected: boolean) => ({
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: color,
      border: selected ? `2px solid #2C6392` : `1.5px solid ${theme.palette.border.light}`,
      cursor: 'pointer',
      boxSizing: 'border-box',
      display: 'inline-block',
    }),
    customColorInput: {
      width: 90,
      height: 34,
      fontSize: 13,
      marginLeft: theme.spacing(2),
      borderRadius: 2,
      border: `1px solid ${theme.palette.border.light}`,
      padding: theme.spacing(0.5, 1),
    },
    trustTitleInput: {
      width: 340,
      fontSize: 13,
      marginTop: theme.spacing(2),
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(10),
    },
    toggleLabel: {
      fontSize: 13,
      color: theme.palette.text.primary,
      fontWeight: 500,
    },
    saveButtonRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: theme.spacing(4),
    },
    saveButton: {
      width: 120,
      height: 34,
      fontSize: 13,
      backgroundColor: '#13715B',
      border: '1px solid #13715B',
      color: '#fff',
      borderRadius: 4,
      boxShadow: 'none',
      textTransform: 'inherit',
      '&:hover': {
        backgroundColor: '#13715B',
        border: '1px solid #13715B',
        boxShadow: 'none',
      },
    },
    removeButton: {
      color: theme.palette.error.main,
      border: `1px solid ${theme.palette.error.main}`,
      fontSize: 13,
      marginLeft: theme.spacing(1),
      height: 34,
      borderRadius: 4,
      background: 'transparent',
      '&:hover': {
        background: theme.palette.error.light,
      },
    },
    replaceButton: {
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.border.light}`,
      fontSize: 13,
      height: 34,
      borderRadius: 4,
      background: 'transparent',
      '&:hover': {
        background: theme.palette.background.accent,
      },
    },
    disabledInput: {
      background: theme.palette.background.default,
      color: theme.palette.text.disabled,
    },
  };
}; 