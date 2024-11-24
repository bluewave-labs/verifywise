import { useState, useCallback } from "react";
import {
  Typography,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  Stack,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RichTextEditor from "../../../components/RichTextEditor";

import singleTheme from "../../../themes/v1SingleTheme";
import { Topic, Topics } from "../../../structures/AssessmentTracker/Topics";
import { assessments } from "./assessments";
import { priorities, PriorityLevel } from "./priorities";

const AllAssessment = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [assessmentsValues, setAssessmentsValue] = useState<any>({
    1: { topic: "RiskManagementSystem", subtopic: [] },
    2: { topic: "DataGovernance", subtopic: [] },
    3: { topic: "TechnicalDocumentation", subtopic: [] },
    4: { topic: "RecordKeeping", subtopic: [] },
    5: { topic: "TransparencyAndUserInformation", subtopic: [] },
    6: { topic: "HumanOversight", subtopic: [] },
    7: { topic: "AccuracyRobustnessCyberSecurity", subtopic: [] },
    8: { topic: "ConformityAssessment", subtopic: [] },
    9: { topic: "PostMarketMonitoring", subtopic: [] },
    10: { topic: "BiasMonitoringAndMitigation", subtopic: [] },
    11: { topic: "AccountabilityAndGovernance", subtopic: [] },
    12: { topic: "Explainability", subtopic: [] },
    13: { topic: "EnvironmentalImpact", subtopic: [] },
  });

  const handleSave = () => {
    console.log(assessmentsValues);
  };

  const handleAssessmentChange = (
    topicid: number,
    topic: string,
    subtopicId: any,
    subtopic: string,
    questionId: any,
    question: string,
    answer: string
  ) => {
    setAssessmentsValue((prevValues: any) => {
      const updatedValues = { ...prevValues };
      if (!updatedValues[topicid]) {
        updatedValues[topicid] = { topic, subtopic: [] };
      }
      const subtopicIndex = updatedValues[topicid].subtopic.findIndex(
        (st: any) => st.id === subtopicId
      );
      if (subtopicIndex === -1) {
        updatedValues[topicid].subtopic.push({
          id: subtopicId,
          title: subtopic,
          questions: [{ id: questionId, question, answer }],
        });
      } else {
        const questionIndex = updatedValues[topicid].subtopic[
          subtopicIndex
        ].questions.findIndex((q: any) => q.id === questionId);
        if (questionIndex === -1) {
          updatedValues[topicid].subtopic[subtopicIndex].questions.push({
            id: questionId,
            question,
            answer,
          });
        } else {
          updatedValues[topicid].subtopic[subtopicIndex].questions[
            questionIndex
          ].answer = answer;
        }
      }
      return updatedValues;
    });
  };

  const handleListItemClick = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const assessmentItem = useCallback(
    (index: number, topic: Topic) => (
      <ListItem
        key={index}
        disablePadding
        sx={{
          display: "block",
          "& .MuiListItemButton-root.Mui-selected": {
            backgroundColor: "#4C7DE7",
          },
          "& .MuiListItemButton-root.Mui-selected:hover": {
            backgroundColor: "#4C7DE7",
          },
        }}
      >
        <ListItemButton
          selected={index === activeTab}
          onClick={() => handleListItemClick(index)}
          disableRipple
          sx={{
            paddingLeft: 4,
            borderRadius: 2,
            backgroundColor: index === activeTab ? "#4C7DE7" : "transparent",
            width: 260,
            height: 30,
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
    <Box sx={{ display: "flex", height: "100vh", px: "8px !important" }}>
      <Stack
        minWidth={"fit-content"}
        maxWidth="max-content"
        px={8}
        sx={{ overflowY: "auto" }}
      >
        <Typography
          sx={{
            color: "#667085",
            fontSize: 11,
            my: 6,
          }}
        >
          High risk conformity assessment
        </Typography>
        <List>
          {Topics.map((topic, index) => assessmentItem(index, topic))}
        </List>
        <Typography
          sx={{
            color: "#667085",
            fontSize: 11,
            my: 6,
          }}
        >
          Files
        </Typography>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack
        minWidth="70%"
        width={"100%"}
        maxWidth={"100%"}
        py={2}
        px={8}
        sx={{ overflowY: "auto" }}
      >
        {Topics[activeTab].id === assessments[activeTab].id &&
          assessments[activeTab].component.map((subtopic) => (
            <Stack key={subtopic.id} mb={15}>
              <Typography sx={{ fontSize: 16, color: "#344054" }}>
                {subtopic.title}
              </Typography>
              {subtopic.questions.map((question) => (
                <Box key={question.id} mt={10}>
                  <Box
                    className={"tiptap-header"}
                    p={5}
                    display="flex"
                    alignItems="center"
                    bgcolor={"#FBFAFA"}
                    sx={{
                      border: "1px solid #D0D5DD",
                      borderBottom: "none",
                      borderRadius: "4px 4px 0 0",
                      gap: 4,
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: "#344054" }}>
                      {question.question}
                      {question.hint && (
                        <Box component="span" ml={2}>
                          <Tooltip title={question.hint}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </Tooltip>
                        </Box>
                      )}
                    </Typography>
                    <Chip
                      label={question.priorityLevel}
                      sx={{
                        backgroundColor:
                          priorities[question.priorityLevel as PriorityLevel]
                            .color,
                        color: "#FFFFFF",
                      }}
                      size="small"
                    />
                  </Box>

                  <RichTextEditor
                    key={`${Topics[activeTab].id}-${subtopic.id}-${question.id}`}
                    onContentChange={(content: string) => {
                      const cleanedContent = content
                        .replace(/^<p>/, "")
                        .replace(/<\/p>$/, "");

                      handleAssessmentChange(
                        Topics[activeTab].id,
                        Topics[activeTab].title,
                        `${Topics[activeTab].id}-${subtopic.id}`,
                        subtopic.title,
                        `${Topics[activeTab].id}-${subtopic.id}-${question.id}`,
                        question.question,
                        cleanedContent
                      );
                    }}
                    headerSx={{
                      borderRadius: 0,
                      BorderTop: "none",
                      borderColor: "#D0D5DD",
                    }}
                    bodySx={{
                      borderColor: "#D0D5DD",
                      borderRadius: "0 0 4px 4px",

                      "& .ProseMirror > p": {
                        margin: 0,
                      },
                    }}
                    initialContent={
                      assessmentsValues[Topics[activeTab].id]?.subtopic
                        ?.find(
                          (st: any) =>
                            st.id === `${Topics[activeTab].id}-${subtopic.id}`
                        )
                        ?.questions?.find(
                          (q: any) =>
                            q.id ===
                            `${Topics[activeTab].id}-${subtopic.id}-${question.id}`
                        )
                        ?.answer.trim() || "".trim()
                    }
                  />
                  <Stack
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        width: 120,
                        height: 25,
                        fontSize: 11,
                        border: "1px solid #D0D5DD",
                        backgroundColor: "white",
                        color: "#344054",
                      }}
                      disableRipple={
                        theme.components?.MuiButton?.defaultProps?.disableRipple
                      }
                    >
                      Add evidence
                    </Button>
                    <Typography
                      sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}
                    >
                      {question.evidenceFile === "Not required"
                        ? "required"
                        : ""}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ))}
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <Button
            sx={{
              ...singleTheme.buttons.primary,
              color: "#FFFFFF",
              width: 140,
            }}
            onClick={() => handleSave()}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AllAssessment;
