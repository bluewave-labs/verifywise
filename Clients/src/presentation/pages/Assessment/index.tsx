import { Stack, Button, Typography, useTheme, styled, Paper } from "@mui/material";

const Assessment = () => {

  const theme = useTheme();

  const paperStyle = {
    backgroundColor: theme.palette.background.alt,
    ...theme.typography.body2,
    padding: theme.spacing(1),
    border: "1px solid",
    borderColor: theme.palette.border,
    boxShadow: "none",
    paddingRight: "150px",
    paddingLeft: "25px",
    paddingTop: "10px",
    paddingBottom: "10px",
  }

  const buttonStyles = {
      width: "157px",
      height: "34px",
      marginTop: "30px",
      textTransform: 'none',
      border: "1px solid",
      borderColor: theme.palette.status.info.border,
      borderRadius: "4px",
      boxShadow: "none",
      gap: "8px",
      paddingTop: "10px",
      paddingBottom: "10px",
      paddingLeft: "16px",
      paddingRight: "16px",
    } as const;

  return (
    <div className="assessment-page">
      <Stack gap={theme.spacing(2)} sx={{ marginTop: "50px", marginLeft: "30px" }}>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text.primary} fontFamily={"inter"}>
          Assessment tracker
        </Typography>
        <Stack direction={"row"} gap={theme.spacing(10)} sx={{ marginTop: "20px" }}>
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent} fontFamily={"inter"}>Assessment completion</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text.primary} fontFamily={"inter"}>85%</Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent} fontFamily={"inter"}>Pending assessments</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text.primary} fontFamily={"inter"}>2</Typography>
          </Paper>
          <Paper sx={paperStyle}>
            <Typography fontSize={"12px"} color={theme.palette.text.accent} fontFamily={"inter"}>Approved assessments</Typography>
            <Typography fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text.primary} fontFamily={"inter"}>12</Typography>
          </Paper>
        </Stack>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"16px"} color={theme.palette.text.primary} sx={{ marginTop: "50px" }} fontFamily={"inter"}>
          Ongoing assessments
        </Typography>
        <Typography fontSize={"14px"} fontFamily={"inter"} color={theme.palette.text.secondary}>
          Those are the assessments you started. Each assessment has a completion
          status on the left hand side of the table.
        </Typography>
        <Stack>
          <Button variant='contained' size='medium' sx={buttonStyles}>
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