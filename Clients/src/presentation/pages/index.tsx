/**
 * This file is currently in use
 */

import { Stack } from "@mui/material";
import ComplianceTracker from "./ComplianceTracker/1.0ComplianceTracker";

const Playground = () => {
  return (
    <Stack
      sx={
        {
          // width: "100%",
          // display: "flex",
          // flexDirection: "row",
          // justifyContent: "center",
          // alignItems: "center",
          // minHeight: "100vh",
          // padding: "50px",
        }
      }
    >
      <ComplianceTracker />
    </Stack>
  );
};

export default Playground;
