import { keyframes } from "@mui/system";

// Flash animation
export const flashAnimation = keyframes`
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(82, 171, 67, 0.2); // Light green color
  }
  100% {
    background-color: transparent;
  }
`;

export const useStyles = () => ({
  description: {
    fontSize: 14,
    color: '#667085',
    lineHeight: 1.5,
    mb: 3,
  },

  container: {
    mt: 3,
  },

  resourcesHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    mb: 2,
    padding: '10px 0',
  },

  title: {
    fontWeight: 600,
    fontSize: 16,
    color: '#344054',
  },

  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },

  toggleLabel: {
    fontSize: 13,
    color: '#344054',
    fontWeight: 600,
  },

  tableWrapper: {
    position: 'relative',
    mb: 3,
  },

  tableContainer: {
    borderRadius: 2,
    boxShadow: 'none',
    border: '1px solid #E5E7EB',
  },

  tableCell: {
    fontSize: 12,
    fontWeight: 600,
    color: '#667085',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  tableRow: (isFlashing: boolean) => ({
    '&:hover': {
      backgroundColor: '#F9FAFB',
    },
    '& .MuiTableCell-root': {
      padding: '8px 10px !important',
    },
    ...(isFlashing && {
      animation: `${flashAnimation} 2s ease-in-out`,
    }),
  }),

  resourceName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#344054',
  },

  resourceType: {
    fontSize: 13,
    color: '#667085',
  },

  visibilityIcon: {
    color: '#52AB43',
    fontSize: 20,
  },

  visibilityOffIcon: {
    color: '#F04438',
    fontSize: 20,
  },

  emptyStateText: {
    fontSize: 13,
    color: '#667085',
    fontStyle: 'italic',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },

  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  addButton: {
    alignSelf: "flex-end",
    width: "fit-content",
    gap: 2,
    backgroundColor: '#13715B',
    border: '1px solid #13715B',
    mt: 10,
  },

  // Modal styles
  modalPaper: {
    borderRadius: 2,
    padding: 0,
    boxShadow: '0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)',
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#344054',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalContent: {
    padding: '24px',
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: '#344054',
    mb: 1,
  },

  closeButton: {
    color: '#667085',
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
      opacity: 0.8,
    },
  },

  fieldStyle: {
    backgroundColor: '#FFFFFF',
    '& input': {
      padding: '0 14px',
    },
  },

  fileUploadButton: {
    mt: 10,
    backgroundColor: '#13715B',
    border: '1px solid #13715B',
    color: '#FFFFFF',
  },

  fileName: {
    fontSize: 13,
    color: '#52AB43',
    fontWeight: 500,
    mt: 1,
    ml: 1,
  },

  existingFileName: {
    fontSize: 13,
    color: '#667085',
    fontWeight: 400,
    mt: 1,
    ml: 1,
    fontStyle: 'italic',
  },

  modalActionButton: {
    backgroundColor: '#13715B',
    border: '1px solid #13715B',
    gap: 1,
    '&:hover': {
      backgroundColor: '#0F5A4A',
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      border: '1px solid #ccc',
      color: '#667085 !important',
    },
  },

  modalCancelButton: {
    border: '1px solid #D0D5DD',
    color: '#344054',
    backgroundColor: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#F9FAFB',
      border: '1px solid #667085',
    },
  },

  successAlert: {
    backgroundColor: '#ECFDF3',
    color: '#027A48',
    border: '1px solid #A6F4C7',
  },

  errorAlert: {
    backgroundColor: '#FEF3F2',
    color: '#B42318',
    border: '1px solid #FDA29B',
  },
}); 