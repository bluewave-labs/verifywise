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
      <Guider
        link="https://www.iso.org/standard/81230.html"
        title="ISO 42001"
        description="ISO/IEC 42001 aims to ensure that AI systems are developed and used responsibly by promoting trust, transparency, and accountability."
      />
    </Stack>
  );
};

export default Playground;
