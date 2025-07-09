import { useTheme } from '@mui/material/styles';

export const useStyles = () => {
  const theme = useTheme();

  return {
    title: {
      fontWeight: 600,
      marginBottom: theme.spacing(2),
    },
    description: {
      color: theme.palette.text.secondary,
      fontSize: 16,
    },
  };
}; 