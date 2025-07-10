import { useTheme } from '@mui/material/styles';

export const useStyles = () => {
  const theme = useTheme();

  return {
    title: {
      fontWeight: 600,
      marginBottom: theme.spacing(2),
      fontSize: 13,
    },
    description: {
      color: theme.palette.text.secondary,
      fontSize: 13,
      marginBottom: theme.spacing(3),
    },
    container: {
      background: '#fff',
      borderRadius: theme.shape.borderRadius,
      boxShadow: '0 1px 4px rgba(16,30,54,0.04)',
      padding: theme.spacing(4),
      marginTop: theme.spacing(2),
    },
    subprocessorsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(2),
    },
    toggleLabel: {
      fontWeight: 600,
      fontSize: 13,
      color: theme.palette.text.primary,
      marginRight: 5,
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: theme.spacing(2),
    },
  };
}; 