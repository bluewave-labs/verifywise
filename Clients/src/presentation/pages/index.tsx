/**
 * This file is currently in use
 */

import { Stack } from "@mui/material";
import ISO42001 from "./ISO";

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
      <ISO42001 />
    </Stack>
  );
};

export default Playground;
