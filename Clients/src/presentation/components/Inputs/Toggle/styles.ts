import { Theme } from "@mui/material";

export const getToggleStyles = (theme: Theme) => ({
  width: 40,
  height: 22,
  padding: '2px 0',
  display: 'flex',
  alignItems: 'center',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#13715B',
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    margin: 0,
  },
  '& .MuiSwitch-track': {
    borderRadius: 11,
    backgroundColor: theme.palette.border.light,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 200,
    }),
  }
});