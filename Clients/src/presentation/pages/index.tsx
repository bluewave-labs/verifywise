import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Playground = () => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        minHeight: "100vh",
        padding: "20px",
        gap: 3,
        backgroundColor: theme.palette.background.alt,
      }}
    ></Stack>
  );
};

export default Playground;
