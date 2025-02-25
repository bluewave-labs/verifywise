/**
 * This file is currently in use
 */

import { Stack } from "@mui/material";
import SmallStatsCard from "../components/Cards/SmallStatsCard";

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
      <SmallStatsCard />
    </Stack>
  );
};

export default Playground;
