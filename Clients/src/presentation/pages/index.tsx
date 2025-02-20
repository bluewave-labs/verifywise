import { Stack } from "@mui/material";
import AssessmentTracker from "./Assessment/1.0AssessmentTracker";

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
      <AssessmentTracker />
    </Stack>
  );
};

export default Playground;
