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
    resourceName: {
      fontWeight: 500,
      fontSize: 13,
      color: '#475467',
      marginLeft: 0,
    },
    resourceType: {
      fontSize: 13,
      color: '#475467',
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
    // Table styles
    tableContainer: {
      boxShadow: 'none',
    },
    tableCell: {
      fontWeight: 600,
      fontSize: 13,
    },
    // Overlay styles
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      bgcolor: 'rgba(255,255,255,0.6)',
      zIndex: 2,
      pointerEvents: 'none',
      borderRadius: 2,
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'rgba(0,0,0,0.12)',
      zIndex: 1300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      bgcolor: '#fff',
      borderRadius: 2,
      boxShadow: 3,
      p: 6,
      minWidth: 350,
      maxWidth: 400,
      width: '100%',
      position: 'relative',
    },
    // Modal input styles
    modalInput: {
      width: '100%',
      padding: '8px',
      borderRadius: 4,
      border: '1px solid #E0E0E0',
      fontSize: 13,
    },
    modalInputDisabled: {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
    modalInputEnabled: {
      backgroundColor: '#fff',
      color: '#000',
      cursor: 'text',
    },
    // Modal button styles
    modalButton: {
      backgroundColor: '#13715B',
      border: '1px solid #13715B',
      cursor: 'pointer',
    },
    modalButtonDisabled: {
      backgroundColor: '#ccc',
      border: '1px solid #ccc',
      cursor: 'not-allowed',
    },
  };
}; 