import { Stack } from "@mui/material";
import Avatar from "../components/Avatar/VWAvatar";
import FileUploadComponent from "../components/FileUpload";
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
      <Stack
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Avatar size="small" />
        <Avatar size="medium" />
        <Avatar size="large" />
      </Stack>
      <Stack
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Avatar size="small" user={user} />
        <Avatar size="medium" user={user} />
        <Avatar size="large" user={user} />
      </Stack>
      <RoleButtonGroup />
      <FileUploadComponent />
    </Stack>
    
  );
};

export default Playground;
