import { Stack } from "@mui/material";
import VWButton from "../vw-v2-components/Buttons";

const Playground = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <VWButton />
    </Stack>
  );
};

export default Playground;
