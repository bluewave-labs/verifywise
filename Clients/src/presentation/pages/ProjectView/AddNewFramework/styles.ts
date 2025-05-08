import { SxProps, Theme } from '@mui/material';

export const modalContainerStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#fff',
  borderRadius: 3,
  boxShadow: 6,
  maxWidth: 480,
  width: '100%',
  mx: 2,
  maxHeight: '90vh',
  overflow: 'auto',
  animation: 'scaleIn 0.2s',
  padding: '20px',
};

export const modalHeaderStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #E5E7EB',
  p: 2,
};

export const modalCloseButtonStyle: SxProps<Theme> = {
  color: '#6B7280',
  '&:hover': { color: '#232B3A', background: '#e3f5e6' },
  p: 1,
};

export const modalDescriptionStyle: SxProps<Theme> = {
  color: '#6B7280',
  mb: 6,
  fontSize: 14,
  textAlign: 'left',
  mt: 6,
};

export const frameworkCardStyle: SxProps<Theme> = {
  border: '1.5px solid #13715B',
  borderRadius: 2,
  background: '#e3f5e6',
  p: 2.5,
  transition: 'background 0.2s',
};

export const frameworkCardTitleStyle: SxProps<Theme> = {
  fontWeight: 500,
  color: '#232B3A',
  fontSize: 16,
};

export const frameworkCardAddedStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  color: '#13715B',
  gap: 1,
  fontSize: 14,
};

export const frameworkCardDescriptionStyle: SxProps<Theme> = {
  color: '#6B7280',
  fontSize: 14,
  textAlign: 'left',
  mb: 2,
};

export const modalDoneButtonStyle: SxProps<Theme> = {
  px: 4,
  py: 1,
  fontWeight: 500,
  borderRadius: 2,
  boxShadow: 'none',
  fontSize: 15,
  backgroundColor: '#13715B',
  color: '#fff',
  border: '1px solid #13715B',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  '&:hover': {
    backgroundColor: '#10614d',
  },
}; 