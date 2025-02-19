import { useCallback, useEffect, useState } from "react";
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  listItemStyle,
  pageHeadingStyle,
  subHeadingStyle,
  topicsListStyle,
} from "./index.style";
import { getEntityById } from "../../../../application/repository/entity.repository";
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

const AssessmentTracker = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [progressData, setProgressData] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [topicsData, setTopicsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const storedProjectId = localStorage.getItem("selectedProjectId");
    setProjectId(storedProjectId);
  }, []);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!projectId) return;

      try {
        const response = await getEntityById({
          routeUrl: `/projects/assessment/progress/${projectId}`,
        });
        setProgressData(response.data);
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [projectId]);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!projectId) return;

      try {
        const response = await getEntityById({
          routeUrl: `/assessments/project/byid/${projectId}`,
        });
        setAssessmentData(response.data[0]);
      } catch (error) {
        console.error("Failed to fetch assessment data:", error);
      }
    };

    fetchAssessmentData();
  }, [projectId]);

  useEffect(() => {
    const fetchTopicsData = async () => {
      if (!assessmentData?.id) return;

      setLoadingTopics(true);
      try {
        const response = await getEntityById({
          routeUrl: `/topics/byassessmentid/${assessmentData.id}`,
        });
        setTopicsData(response.data);
      } catch (error) {
        console.error("Failed to fetch topics data:", error);
        setTopicsData(null);
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopicsData();
  }, [assessmentData]);

  const handleListItemClick = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const topicsList = useCallback(
    (topic: any, index: number) => (
      <ListItem key={index} disablePadding sx={listItemStyle}>
        <ListItemButton
          disableRipple
          selected={index === activeTab}
          onClick={() => handleListItemClick(index)}
          sx={{
            padding: 2,
            paddingLeft: 4,
            borderRadius: 2,
            backgroundColor: index === activeTab ? "#13715B" : "transparent",
            width: "100%",
            textWrap: "wrap",
          }}
        >
          <ListItemText
            primary={
              <Typography
                color={
                  index === activeTab ? "#fff" : theme.palette.text.primary
                }
                sx={{ fontSize: 13 }}
              >
                {topic.title}
              </Typography>
            }
          />
        </ListItemButton>
      </ListItem>
    ),
    [activeTab, handleListItemClick, theme.palette.text.primary]
  );

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
            <List>
              {loadingTopics ? (
                <VWSkeleton
                  height={30}
                  minHeight={30}
                  minWidth={260}
                  width={"100%"}
                  maxWidth={300}
                  variant="rectangular"
                />
              ) : topicsData ? (
                topicsData.map((topic: any, index: number) =>
                  topicsList(topic, index)
                )
              ) : (
                <Typography>Unable to get topics</Typography>
              )}
            </List>
          </Stack>
          <Divider orientation="vertical" flexItem />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default AssessmentTracker;
