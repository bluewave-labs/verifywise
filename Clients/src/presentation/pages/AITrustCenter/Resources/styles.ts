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
    resourcesHeader: {
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
    resourceList: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(2),
    },
    resourceRow: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 36,
      margin: 0,
      padding: 0,
      justifyContent: 'flex-start',
    },
    resourceLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      flex: 0.5,
    },
    checkIcon: {
      color: '#12B76A',
      fontSize: 22,
      verticalAlign: 'middle',
      display: 'flex',
      alignItems: 'center',
    },
    resourceName: {
      fontWeight: 500,
      fontSize: 13,
      color: '#475467',
      marginLeft: 0,
    },
    resourceActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      minWidth: 320,
      justifyContent: 'flex-start',
    },
    addFileBtn: {
      alignSelf: 'flex-end',
      width: 'fit-content',
      backgroundColor: '#13715B',
      gap: 2,
      border: 'none',
      height: 28,
      fontSize: 13,
      borderRadius: 2,
      textTransform: 'none',
      boxShadow: 'none',
      margin: 0,
    },
    fileInfo: {
      fontSize: 15,
      color: '#475467',
      fontWeight: 400,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      height: 36,
    },
    deleteIcon: {
      color: '#98A2B3',
      margin: 0,
      padding: 4,
      display: 'flex',
      alignItems: 'center',
      borderRadius: 4,
      background: 'transparent',
    },
    saveBtn: {
      alignSelf: 'flex-end',
      width: 'fit-content',
      backgroundColor: '#13715B',
      border: '1px solid #13715B',
      gap: 2,
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: theme.spacing(2),
    },
  };
}; 