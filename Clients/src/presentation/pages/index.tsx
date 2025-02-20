import { Stack } from "@mui/material";
import UppyUploadFile from "../vw-v2-components/Inputs/FileUpload";

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
      <UppyUploadFile />
    </Stack>
  );
};

export default Playground;
