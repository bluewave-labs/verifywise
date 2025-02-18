import { useEffect, useState } from "react";
import { Divider, List, Stack, Typography, useTheme } from "@mui/material";
import {
  pageHeadingStyle,
  subHeadingStyle,
  topicsListStyle,
} from "./index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

const AssessmentTracker = () => {
  const theme = useTheme();
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await getEntityById({
          routeUrl: "/projects/assessment/progress/3",
        });
        setProgressData(response.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

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
        <Stack
          sx={{ maxWidth: 1400, marginTop: "10px", gap: theme.spacing(10) }}
        >
          {loading ? (
            <VWSkeleton
              height={82}
              minHeight={82}
              minWidth={300}
              width={"100%"}
              key={1400}
              variant="rectangular"
            />
          ) : progressData ? (
            <StatsCard
              total={progressData.totalQuestions}
              completed={progressData.answeredQuestions}
              title="Questions"
              progressbarColor="#13715B"
            />
          ) : (
            <Typography>
              Unable to fetch statistical values from the server
            </Typography>
          )}
        </Stack>
        <Divider sx={{ marginY: 10 }} />
        <Stack sx={{ display: "flex", height: "100vh", paddingX: "8px" }}>
          <Stack sx={topicsListStyle}>
            <Typography sx={subHeadingStyle}>
              High risk conformity assessment
            </Typography>
            <List></List>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default AssessmentTracker;
