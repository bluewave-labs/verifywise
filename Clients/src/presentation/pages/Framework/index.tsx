import { Stack, Typography } from "@mui/material";
import { useContext, useEffect } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";

const Framework = () => {
  const { changeComponentVisibility } = useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("framework", true);
    }
  }, [allVisible, changeComponentVisibility]);

  return (
    <Stack
      className="framework-page"
      sx={{
        minHeight: "100vh",
        padding: 3,
        backgroundColor: "#FCFCFD",
      }}
      ref={refs[0]}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          color: "#1A1A1A",
          marginBottom: 2,
        }}
      >
        Framework
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "#666666",
        }}
      >
        Framework page content will be implemented here.
      </Typography>
    </Stack>
  );
};

export default Framework;
