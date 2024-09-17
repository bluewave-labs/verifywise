import { Stack } from "@mui/material";
import Alert from "../../components/Alert";

const Home = () => {
  return (
    <Stack gap={8}>
      <Alert
        variant="success"
        body="This is a filled success Alert."
        isToast={true}
        onClick={() => console.log("Click")}
        title="Success"
        hasIcon={true}
      />
      <Alert
        variant="info"
        body="This is a filled info Alert."
        isToast={true}
        onClick={() => console.log("Click")}
        title="info"
        hasIcon={true}
      />
      <Alert
        variant="error"
        body="This is a filled error Alert."
        isToast={true}
        onClick={() => console.log("Click")}
        title="error"
        hasIcon={true}
      />
      <Alert
        variant="warning"
        body="This is a filled warning Alert."
        isToast={true}
        onClick={() => console.log("Click")}
        title="warning"
        hasIcon={true}
      />
    </Stack>
  );
};

export default Home;
