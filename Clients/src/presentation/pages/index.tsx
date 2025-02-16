import { Stack } from "@mui/material";
import VWSkeleton from "../vw-v2-components/Skeletons";

const Playground = () => {
  return (
    <Stack
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "50px",
      }}
    >
      <VWSkeleton
        minHeight={"48px"}
        minWidth={"300px"}
        width={"100%"}
        maxWidth={"100%"}
        variant="rectangular"
      />
    </Stack>
  );
};

export default Playground;
