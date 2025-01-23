import { Stack } from "@mui/material";
import VWAlert from "../vw-v2-components/Alerts";

const Playground = () => {
  return (
    <Stack
      sx={{
        margin: "auto",
        padding: 20,
        width: "80%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <VWAlert status="error" />
    </Stack>
  );
};

export default Playground;
