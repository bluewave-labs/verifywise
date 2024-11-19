import { Stack } from "@mui/material";
import Avatar from "../components/Avatar/VWAvatar";
import RoleButtonGroup from "../components/ButtonGroup";

const Playground = () => {
  const user = {
    firstname: "Mohammad",
    lastname: "Khalilzadeh",
    pathToImage: "https://avatars.githubusercontent.com/u/140876993?v=4",
  };

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
