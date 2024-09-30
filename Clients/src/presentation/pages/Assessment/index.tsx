import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { Paper, styled, Typography, useTheme } from "@mui/material";
import "./index.css"

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#f9fafc',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  border:"1px solid #EAECF0",
  boxShadow: "none",
  paddingRight: "150px",
  paddingLeft: "25px",
  paddingTop: "10px",
  paddingBottom: "10px",
}));

const Assessment = () => {
  const theme = useTheme();
  return (
    <div className="assessment-page">
      <Stack gap={theme.spacing(2)} sx={{marginTop: "50px", marginLeft: "30px"}}>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text} fontFamily={"inter"}>
          Assessment tracker
        </Typography>
        <Stack direction={"row"} spacing={10} sx={{marginTop: "20px"}}>
          <Item>
            <Typography sx={{fontSize:"12px", color:"#A0AEC0"}} fontFamily={"inter"}>Assessment completion</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color='#2D3748' fontFamily={"inter"}>85%</Typography>
          </Item>      
          <Item sx={{fontSize:"12px"}}>
            <Typography sx={{fontSize:"12px", color:"#A0AEC0"}} fontFamily={"inter"}>Pending assessments</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color='#2D3748' fontFamily={"inter"}>2</Typography>
          </Item>
          <Item sx={{fontSize:"12px"}}>
            <Typography sx={{fontSize:"12px", color:"#A0AEC0"}} fontFamily={"inter"}>Approved assessments</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color='#2D3748' fontFamily={"inter"}>12</Typography>
          </Item>
        </Stack>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"16px"} color='#1A1919' sx={{marginTop: "50px"}} fontFamily={"inter"}>
          Ongoing assessments
        </Typography>
        <Typography fontSize={"14px"} fontFamily={"inter"} color='#344054'>
          Those are the assessments you started. Each assessment has a completion
          status on the left hand side of the table.
        </Typography>
        <Stack>
          <Button variant='contained' size='medium' style={{
            width: "157px",
            height: "34px",
            marginTop: "30px",
            textTransform: 'none',
            border:"1px solid #175CD3",
            borderRadius:"4px",
            boxShadow:"none",
            gap: "8px",
            paddingTop:"10px",
            paddingBottom:"10px",
            paddingLeft:"16px",
            paddingRight:"16px",
            }}>
            <Typography fontFamily={"inter"} fontSize={"13px"} fontWeight={"400"} lineHeight={"20px"} textAlign={"left"}>
              Go to assessments
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </div>
    
  );
};

export default Assessment;
