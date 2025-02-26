/**
 * This file is currently in use
 */

import { Stack } from "@mui/material";
import VWProjectForm from "../vw-v2-components/Forms/ProjectForm";

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
      <VWProjectForm />
    </Stack>
  );
};

export default Playground;
