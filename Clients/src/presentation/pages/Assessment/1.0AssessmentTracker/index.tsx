import { useCallback, useContext, useState, useEffect } from "react";
import {
  Box,
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
import StatsCard from "../../../components/Cards/StatsCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import Questions from "./questions";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useAssessmentProgress from "../../../../application/hooks/useAssessmentProgress";
import useAssessmentData from "../../../../application/hooks/useAssessmentData";
import useAssessmentTopics from "../../../../application/hooks/useAssessmentTopcis";
import useAssessmentSubtopics from "../../../../application/hooks/useAssessmentSubtopics";
import PageTour from "../../../components/PageTour";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import AssessmentSteps from "./AssessmentSteps";

const AssessmentTracker = () => {
  const theme = useTheme();
  const [refreshKey, setRefreshKey] = useState(false);
  const { currentProjectId } = useContext(VerifyWiseContext);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [runAssessmentTour, setRunAssessmentTour] = useState(false);

  const { assessmentProgress, loading: loadingAssessmentProgress } = useAssessmentProgress({ selectedProjectId: currentProjectId || "", refreshKey });
  const { assessmentData, loading: loadingAssessmentData } = useAssessmentData({ selectedProjectId: currentProjectId || "" });
  const { assessmentTopics, loading: loadingAssessmentTopics } = useAssessmentTopics({ assessmentId: assessmentData?.id });
  const { assessmentSubtopics, loading: loadingAssessmentSubtopic } = useAssessmentSubtopics({ activeAssessmentTopicId: assessmentTopics?.[activeTab]?.id });

  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({ countToTrigger: 2,  });

  useEffect(() => {
    if (allVisible) {    
      setRunAssessmentTour(true);
    }
  }, [allVisible]);

  // Reset active tab when project changes
  useEffect(() => {
    setActiveTab(0);
    setRefreshKey((prev) => !prev); // Force refresh when project changes
  }, [currentProjectId]);

  const handleListItemClick = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const topicsList = useCallback(
    (topic: any, index: number) => (
      <ListItem key={topic.id || index} disablePadding sx={listItemStyle}>
        <ListItemButton
          disableRipple
          selected={index === activeTab}
          onClick={() => handleListItemClick(index)}
          sx={{
            padding: 1,
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

  // Show loading state if we're loading the initial assessment data
  if (loadingAssessmentData) {
    return (
      <Stack sx={{ padding: 2 }}>
        <VWSkeleton height={400} variant="rectangular" />
      </Stack>
    );
  }

  // Show message if no project is selected
  if (!currentProjectId) {
    return (
      <Stack sx={{ padding: 2 }}>
        <Typography>Please select a project to view assessments</Typography>
      </Stack>
    );
  }

  return (
    <Stack className="assessment-tracker">
      <PageTour
        run={runAssessmentTour}
        steps={AssessmentSteps}
        onFinish={() => {
          localStorage.setItem("assessment-tour", "true");
          setRunAssessmentTour(false);
        }}
        tourKey="assessment-tour"
      />
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
          data-joyride-id="assessment-progress-bar"
          ref={refs[0]}
        >
          {loadingAssessmentProgress ? (
            <VWSkeleton
              height={82}
              minHeight={82}
              minWidth={300}
              width={"100%"}
              key={1400}
              variant="rectangular"
            />
          ) : assessmentProgress ? (
            <StatsCard
              total={assessmentProgress.totalQuestions}
              completed={assessmentProgress.answeredQuestions}
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
        <Box sx={{ display: "flex", height: "100vh", paddingX: "8px" }}>
          <Stack sx={topicsListStyle}>
            <Typography
              sx={subHeadingStyle}
              data-joyride-id="assessment-topics"
              ref={refs[1]}
            >
              High risk conformity assessment
            </Typography>
            <List>
              {loadingAssessmentTopics ? (
                <VWSkeleton
                  height={30}
                  minHeight={30}
                  minWidth={260}
                  width={"100%"}
                  maxWidth={300}
                  variant="rectangular"
                />
              ) : assessmentTopics ? (
                assessmentTopics.map((topic: any, index: number) =>
                  topicsList(topic, index)
                )
              ) : (
                <Typography>Unable to get topics</Typography>
              )}
            </List>
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack
            minWidth={"60%"}
            width={"100%"}
            maxWidth={1400}
            paddingY={2}
            paddingX={8}
            sx={{ overflowY: "auto" }}
          >
            {loadingAssessmentSubtopic ? (
              <VWSkeleton
                height={30}
                minHeight={30}
                minWidth={260}
                width={"100%"}
                maxWidth={300}
                variant="rectangular"
              />
            ) : assessmentSubtopics ? (
              assessmentSubtopics.map((subtopic: any, index: number) => (
                <div key={`subtopic-${subtopic.id || index}`}>
                  <Questions
                    subtopic={subtopic}
                    setRefreshKey={() => setRefreshKey((prev) => !prev)}
                  />
                </div>
              ))
            ) : (
              <Typography>Unable to get subtopics</Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
};

export default AssessmentTracker;
