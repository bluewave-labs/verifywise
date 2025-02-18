import { useEffect, useState } from "react";
import { Stack, Typography, useTheme } from "@mui/material";
import { pageHeadingStyle } from "./index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";

const AssessmentTracker = () => {
  const theme = useTheme();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getEntityById({
          routeUrl: "/projects/assessment/progress/3",
        });
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  console.log("userData : ", userData);
  return (
    <Stack className="assessment-tracker">
      <Stack
        className="assessment-tracker-holder"
        sx={{
          gap: theme.spacing(2),
          backgroundColor: theme.palette.background.alt,
        }}
      >
        <Typography sx={pageHeadingStyle}>Assessment tracker</Typography>
      </Stack>
    </Stack>
  );
};

export default AssessmentTracker;
