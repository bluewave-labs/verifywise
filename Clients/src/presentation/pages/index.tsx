import { Stack } from "@mui/material";
import VWChecks from "../vw-v2-components/Checks";

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
      <VWChecks title="Checkbox Title" />
    </Stack>
  );
};

export default Playground;
