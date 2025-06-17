import { Stack } from "@mui/material";
import Guider from "../components/Helpers/Guider";

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
        padding: "20px",
      }}
    >
      <Guider />
    </Stack>
  );
};

export default Playground;
