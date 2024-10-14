import { Stack } from "@mui/material";
import Alert from "../components/Alert";

const Playground = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="success"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="warning"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="error"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="info"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
    </Stack>
  );
};

export default Playground;
