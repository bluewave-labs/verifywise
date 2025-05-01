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
  border: '1px solid #BFC9C5',
  borderRadius: '4px',
  overflow: 'hidden',
  height: 43,
  bgcolor: '#fff',
};

export const getFrameworkTabStyle = (isActive: boolean, isLast: boolean): SxProps<Theme> => ({
  cursor: 'pointer',
  px: 5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  bgcolor: isActive ? '#F5F6F6' : '#fff',
  color: '#232B3A',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  fontSize: 13,
  borderRight: isLast ? 'none' : '1px solid #BFC9C5',
  fontWeight: 400,
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