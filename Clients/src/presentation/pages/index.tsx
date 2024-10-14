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
        title="Alert"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="warning"
        title="Alert"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="error"
        title="Alert"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
      <Alert
        body="Here is a gentle confirmation that your action was successful."
        variant="info"
        title="Alert"
        onClick={() => console.log("Alert clicked!")}
        isToast={true}
      />
    </Stack>
  );
};

export default Playground;
