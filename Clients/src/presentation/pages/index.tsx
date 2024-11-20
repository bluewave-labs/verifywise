import { Stack } from "@mui/material";
import RoleButtonGroup from "../components/ButtonGroup";

const Playground = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
    <RoleButtonGroup />
    </Stack>
  );
};

export default Playground;
