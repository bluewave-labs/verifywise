import { Stack } from "@mui/material";
import VWSkeleton from "../vw-v2-components/Skeletons";

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
      <VWSkeleton />
    </Stack>
  );
};

export default Playground;
