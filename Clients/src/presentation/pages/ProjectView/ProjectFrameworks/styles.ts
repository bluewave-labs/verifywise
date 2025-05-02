import { SxProps, Theme } from '@mui/material';

export const containerStyle: SxProps<Theme> = {
  width: '100%',
  mt: 2,
};

export const headerContainerStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
};

export const frameworkTabsContainerStyle: SxProps<Theme> = {
  display: 'flex',
  border: (theme) => `1px solid ${theme.palette.divider}`,
  borderRadius: '4px',
  overflow: 'hidden',
  height: 43,
  bgcolor: 'background.paper'
};

export const getFrameworkTabStyle = (isActive: boolean, isLast: boolean): SxProps<Theme> => ({
  cursor: 'pointer',
  px: 5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  bgcolor: isActive ? 'action.hover' : 'background.paper',
  color: 'text.primary',
  fontFamily: (theme) => theme.typography.fontFamily,
  fontSize: (theme) => theme.typography.caption.fontSize,
  borderRight: (theme) => isLast ? 'none' : `1px solid ${theme.palette.divider}`,
  fontWeight: (theme) => theme.typography.body2.fontWeight,
  transition: 'background 0.2s',
  userSelect: 'none',
  width: '142px',
});

export const addButtonStyle: SxProps<Theme> = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 400,
  backgroundColor: '#13715B',
  border: '1px solid #13715B',
  color: '#fff',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontSize: 13,
  '&:hover': {
    backgroundColor: '#10614d',
  },
};

export const tabListStyle: SxProps<Theme> = {
  minHeight: '20px',
  '& .MuiTabs-flexContainer': {
    columnGap: '34px',
  },
}; 