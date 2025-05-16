import { Typography, Stack } from "@mui/material";

const ComingSoonMessage = () => {
  return (
    <Stack
      sx={{
        height: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      backgroundColor: "#F5F6F6",
      borderRadius: 2,
      p: 4,
    }}
  >
    <Typography variant="h6" sx={{ color: "#13715B", mb: 2 }}>
      Coming Soon!
    </Typography>
    <Typography sx={{ color: "#232B3A", textAlign: "center" }}>
      We're currently working on implementing this framework.
      <br />
        EU AI Act is currently available for your compliance and assessment needs.
      </Typography>
    </Stack>
  );
};

export default ComingSoonMessage;
