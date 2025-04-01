import {Stack, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

export const styles = {
  btnWrap: {
    paddingTop: 12,
    display: 'flex',
    alignItems: 'flex-end'
  },
  VWButton: {
    width: { xs: "100%", sm: 160 },
    backgroundColor: "#4C7DE7",
    color: "#fff",
    border: "1px solid #4C7DE7",
    gap: 2,
  },
  titleText: {
    fontSize: 16, 
    color: "#344054", 
    fontWeight: "bold"
  },
  baseText: {
    color: "#344054",
    fontSize: 13,
  }
}


export const fieldStyle = ( theme:any ) => ({ 
  fontWeight: 'bold',    
  backgroundColor: theme.palette.background.main,
  "& input": {
    padding: "0 14px",
  }
});