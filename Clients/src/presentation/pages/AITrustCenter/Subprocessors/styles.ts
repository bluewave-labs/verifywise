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
    // Table styles
    tableContainer: {
      boxShadow: 'none',
    },
    tableCell: {
      fontWeight: 600,
      fontSize: 13,
    },
    tableDataCell: {
      fontSize: 13,
      color: '#475467',
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
    modal: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: '#fff',
      borderRadius: 2,
      boxShadow: 3,
      p: 6,
      minWidth: 350,
      maxWidth: 400,
      width: '100%',
      outline: 'none',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    modalTitle: {
      fontWeight: 600,
      fontSize: 16,
    },
    // Modal button styles
    modalButton: {
      mt: 2,
      alignSelf: 'flex-end',
      backgroundColor: '#13715B',
      border: '1px solid #13715B',
      color: '#fff',
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
    },
    modalButtonDisabled: {
      backgroundColor: '#ccc',
      border: '1px solid #ccc',
    },
  };
}; 