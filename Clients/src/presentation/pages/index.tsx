import { Stack } from "@mui/material";
import StatsCard from "../components/Cards/StatsCard";

const Playground = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "50px",
      }}
    >
      <StatsCard
        title={"subControls"}
        completed={75}
        total={100}
        progressbarColor={"#13715B"}
      />
    </Stack>
  );
};

export default Playground;
