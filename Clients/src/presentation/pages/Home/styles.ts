import { Box, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

export const NoProjectBox = styled(Box)(({ theme }) => ({ 
  display: "block",
  width: "100%",
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: 2,
  backgroundColor: theme.palette.background.main,
  paddingTop: "68px",
  paddingBottom: "79px",
}));

export const StyledStack = styled(Stack)(({ theme }) => ({ 
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: 2,
  backgroundColor: theme.palette.background.main,
  minWidth: 300,
  width: "100%",
  maxWidth: "100%",
  padding: "10px 20px",
}));

export const styles = {
    title: {
      color: "#1A1919",
      fontSize: 16,
      fontWeight: 600,
    },
    projectBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      mb: 9,
    },
    title2: {
      color: "#1A1919",
      fontSize: 16,
      fontWeight: 500,
      pb: 8.5,
      mt: 17,
    },
    gridTitle: {
      fontSize: 12,
      color: "#8594AC",
      pb: 1.5,
    },
    gridValue: {
      fontSize: 16,
      fontWeight: 600,
      color: '#2D3748',
    }
}