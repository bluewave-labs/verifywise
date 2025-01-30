import { Stack } from "@mui/material";
import VWToast from "../vw-v2-components/Toast";

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
        backgroundColor: "#000",
      }}
    >
      <VWToast />
    </Stack>
  );
};

export default Playground;
