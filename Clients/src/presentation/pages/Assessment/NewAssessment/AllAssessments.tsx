/**
 * All colors used here:
 * priorities: FD7E14, EFB70E, ABBDA1
 * Listitem: 4C7DE7
 * Text: White, FFFFFF, 667085, 344054
 * Background: FBFAFA
 * Border: D0D5DD
 */

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
import { RiskManagementSystem } from "../../../structures/AssessmentTracker/risk-management-system.subtopic";
import { DataGovernance } from "../../../structures/AssessmentTracker/data-governance.subtopic";
import { TechnicalDocumentation } from "../../../structures/AssessmentTracker/technical-documentation.subtopic";
import { RecordKeeping } from "../../../structures/AssessmentTracker/record-keeping.subtopic";
import { TransparencyAndUserInformation } from "../../../structures/AssessmentTracker/transparency-user-information.subtopic";
import { HumanOversight } from "../../../structures/AssessmentTracker/human-oversight.subtopic";
import { AccuracyRobustnessCyberSecurity } from "../../../structures/AssessmentTracker/accuracy-robustness-cybersecurity.subtopic";
import { ConformityAssessment } from "../../../structures/AssessmentTracker/conformity-assessment.subtopic";
import { PostMarketMonitoring } from "../../../structures/AssessmentTracker/post-market-monitoring.subtopic";
import { BiasMonitoringAndMitigation } from "../../../structures/AssessmentTracker/bias-monitoring-and-mitigation.subtopic";
import { AccountabilityAndGovernance } from "../../../structures/AssessmentTracker/accountability-and-governance.subtopic";
import { Explainability } from "../../../structures/AssessmentTracker/explainability.subtopic";
import { EnvironmentalImpact } from "../../../structures/AssessmentTracker/environmental-impact.subtopic";

type PriorityLevel = "high priority" | "medium priority" | "low priority";

const priorities = {
  "high priority": { color: "#FD7E14" },
  "medium priority": { color: "#EFB70E" },
  "low priority": { color: "#ABBDA1" },
};

const assessments = [
  { id: 1, title: "RiskManagementSystem", component: RiskManagementSystem },
  { id: 2, title: "DataGovernance", component: DataGovernance },
  { id: 3, title: "TechnicalDocumentation", component: TechnicalDocumentation },
  { id: 4, title: "RecordKeeping", component: RecordKeeping },
  {
    id: 5,
    title: "TransparencyAndUserInformation",
    component: TransparencyAndUserInformation,
  },
  { id: 6, title: "HumanOversight", component: HumanOversight },
  {
    id: 7,
    title: "AccuracyRobustnessCyberSecurity",
    component: AccuracyRobustnessCyberSecurity,
  },
  { id: 8, title: "ConformityAssessment", component: ConformityAssessment },
  { id: 9, title: "PostMarketMonitoring", component: PostMarketMonitoring },
  {
    id: 10,
    title: "BiasMonitoringAndMitigation",
    component: BiasMonitoringAndMitigation,
  },
  {
    id: 11,
    title: "AccountabilityAndGovernance",
    component: AccountabilityAndGovernance,
  },
  { id: 12, title: "Explainability", component: Explainability },
  { id: 13, title: "EnvironmentalImpact", component: EnvironmentalImpact },
];

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

  // Assessment and ID
  // Topic and ID, Title
  // Subtopic and ID, Title
  // Question and ID, Question, Answer
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
      const assessment = updatedValues[topicid] || { subtopics: [] };

      if (!assessment.subtopics) {
        assessment.subtopics = [];
      }

      const subtopicIndex = assessment.subtopics.findIndex(
        (subtopicItem: any) => subtopicItem.subtopicId === subtopicId
      );

      if (subtopicIndex === -1) {
        assessment.subtopics.push({
          subtopicId,
          subtopic,
          questions: [
            {
              questionId,
              question,
              answer,
            },
          ],
        });
      } else {
        const questionIndex = assessment.subtopics[
          subtopicIndex
        ].questions.findIndex((q: any) => q.questionId === questionId);

        if (questionIndex === -1) {
          assessment.subtopics[subtopicIndex].questions.push({
            questionId,
            question,
            answer,
          });
        } else {
          assessment.subtopics[subtopicIndex].questions[questionIndex].answer =
            answer;
        }
      }

      updatedValues[topicid] = assessment;
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
                      assessmentsValues[Topics[activeTab].id]?.subtopics
                        ?.find(
                          (subtopicItem: any) =>
                            subtopicItem.subtopicId === subtopic.id
                        )
                        ?.questions.find(
                          (questionItem: any) =>
                            questionItem.questionId === question.id
                        )?.answer || ""
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
