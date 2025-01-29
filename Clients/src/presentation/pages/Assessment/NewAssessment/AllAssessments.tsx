import { useState, useCallback, useEffect } from "react";
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
import { apiServices } from "../../../../infrastructure/api/networkServices";
import Alert from "../../../components/Alert";
import FileUploadComponent from "../../../components/FileUpload";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

interface AssessmentValue {
  topic: string;
  subtopic: {
    id: string;
    title: string;
    questions: {
      id: string;
      question: string;
      answer: string;
      answerType: string;
      evidenceFileRequired: boolean;
      hint: string;
      isRequired: boolean;
      priorityLevel: "high priority" | "medium priority" | "low priority";
      evidenceFiles?: string[];
    }[];
  }[];
}

const AllAssessment = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);

  const [assessmentsValues, setAssessmentsValue] = useState<
    Record<number, AssessmentValue>
  >({
    0: { topic: "Project Scope", subtopic: [] },
    1: { topic: "Risk Management System", subtopic: [] },
    2: { topic: "Data Governance", subtopic: [] },
    3: { topic: "Technical Documentation", subtopic: [] },
    4: { topic: "Record Keeping", subtopic: [] },
    5: { topic: "Transparency and User Information", subtopic: [] },
    6: { topic: "Human Oversight", subtopic: [] },
    7: { topic: "Accuracy, Robustness, Cyber Security", subtopic: [] },
    8: { topic: "Conformity Assessment", subtopic: [] },
    9: { topic: "Post Market Monitoring", subtopic: [] },
    10: { topic: "Bias Monitoring and Mitigation", subtopic: [] },
    11: { topic: "Accountability and Governance", subtopic: [] },
    12: { topic: "Explainability", subtopic: [] },
    13: { topic: "Environmental Impact", subtopic: [] },
  });

  const [_, setAllQuestionsToCheck] = useState<{ title: string }[]>([]);

  //modal
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const handleOpenFileUploadModal = () => setFileUploadModalOpen(true);
  const handleCloseFileUploadModal = () => {
    console.log("Closing file upload modal");
    setFileUploadModalOpen(false);
  };

  const activeAssessmentId = Topics[activeTab]?.id;

  const [alert, setAlert] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicToSave, setTopicToSave] = useState<number | null>(null);

  const handleSave = (topicToSave: number) => {
    setTopicToSave(topicToSave);
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    if (topicToSave === null) return;

    const assessmentToSave = assessmentsValues[topicToSave];

    console.log(assessmentToSave);

    try {
      const response = await apiServices.post(
        "/assessments/saveAnswers",
        assessmentToSave
      );
      console.log("Assessments saved successfully:", response);
    } catch (error) {
      console.error("Error saving assessments:", error);
    } finally {
      setIsModalOpen(false);
      setTopicToSave(null);
    }
  };

  const handleAssessmentChange = useCallback(
    (
      // topic relateds
      topicid: number,
      topic: string,
      // subtopic relateds
      subtopicId: string,
      subtopic: string,
      // question relateds
      questionId: string,
      question: string,
      answer: string,
      answerType: string,
      evidenceFileRequired: boolean,
      hint: string,
      isRequired: boolean,
      priorityLevel: "high priority" | "medium priority" | "low priority",
      evidenceFiles?: string[]
    ) => {
      console.log("Values are: ", {
        topicId: Topics[activeTab].id,
        topicTitle: Topics[activeTab].title,
        subtopicId,
        subtopicTitle: subtopic,
        questionId: questionId,
        question: question,
        answer: answer,
        answerType: answerType,
        evidenceFileRequired: evidenceFileRequired,
        hint: hint,
        isRequired: isRequired,
        priorityLevel: priorityLevel,
        evidenceFiles: evidenceFiles,
      });
      setAssessmentsValue((prevValues) => {
        const updatedValues = { ...prevValues };
        if (!updatedValues[topicid]) {
          updatedValues[topicid] = { topic, subtopic: [] };
        }
        const subtopicIndex = updatedValues[topicid].subtopic.findIndex(
          (st) => st.id === subtopicId
        );
        if (subtopicIndex === -1) {
          updatedValues[topicid].subtopic.push({
            id: subtopicId,
            title: subtopic,
            questions: [
              {
                id: questionId,
                question,
                answer,
                answerType,
                evidenceFileRequired,
                hint,
                isRequired,
                priorityLevel,
                evidenceFiles,
              },
            ],
          });
        } else {
          const questionIndex = updatedValues[topicid].subtopic[
            subtopicIndex
          ].questions.findIndex((q) => q.id === questionId);
          if (questionIndex === -1) {
            updatedValues[topicid].subtopic[subtopicIndex].questions.push({
              id: questionId,
              question,
              answer,
              answerType,
              evidenceFileRequired,
              hint,
              isRequired,
              priorityLevel,
              evidenceFiles,
            });
          } else {
            updatedValues[topicid].subtopic[subtopicIndex].questions[
              questionIndex
            ].answer = answer;
          }
        }
        return updatedValues;
      });
    },
    []
  );

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

  const renderQuestions = useCallback(
    (subtopicId: string, subtopicTitle: string, questions: any[]) => {
      const renderedQuestions = questions.map((question) => (
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
                  <Tooltip title={question.hint} sx={{ fontSize: 12 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </Tooltip>
                </Box>
              )}
            </Typography>
            <Chip
              label={question.priorityLevel}
              sx={{
                backgroundColor:
                  priorities[question.priorityLevel as PriorityLevel].color,
                color: "#FFFFFF",
              }}
              size="small"
            />
          </Box>

          <RichTextEditor
            key={`${Topics[activeTab].id}-${subtopicId}-${question.id}`}
            onContentChange={(content: string) => {
              const cleanedContent =
                " " + content.replace(/^<p>/, "").replace(/<\/p>$/, "");

              console.log("Question details:", {
                evidenceFileRequired: question.evidenceFileRequired,
                isRequired: question.isRequired,
                evidenceFiles: question.evidenceFiles,
              });

              handleAssessmentChange(
                // topic relateds
                Topics[activeTab].id,
                Topics[activeTab].title,
                // subtopic relateds
                subtopicId,
                subtopicTitle,
                // question relateds
                `${Topics[activeTab].id}-${subtopicId}-${question.id}`,
                question.question,
                cleanedContent,
                question.answerType,
                question.evidenceFileRequired,
                question.hint,
                question.isRequired,
                question.priorityLevel,
                question.evidenceFiles
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
                ?.find((st) => st.id === subtopicId)
                ?.questions?.find(
                  (q) =>
                    q.id ===
                    `${Topics[activeTab].id}-${subtopicId}-${question.id}`
                )
                ?.answer.trim() || " "
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
              onClick={handleOpenFileUploadModal}
            >
              Add evidence
            </Button>
            <Typography
              sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}
            >
              {question.isRequired === true ? "required" : ""}
            </Typography>
          </Stack>
        </Box>
      ));

      return renderedQuestions;
    },
    [
      activeTab,
      assessmentsValues,
      handleAssessmentChange,
      theme.components?.MuiButton?.defaultProps?.disableRipple,
    ]
  );

  // Collect all questions across all tabs
  useEffect(() => {
    const allQuestions = Topics.flatMap(
      (topic) =>
        assessments[topic.id]?.component?.flatMap((subtopic) =>
          subtopic.questions.map((question) => ({
            title: question.question,
          }))
        ) || []
    );

    setAllQuestionsToCheck(allQuestions);
  }, [assessments]);

  // TODO: remove this after testing
  // console.log("All Questions List:", allQuestionsToCheck); // Log the all questions list

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
        {Topics[activeTab].id === assessments[activeTab]?.id &&
          assessments[activeTab]?.component.map((subtopic) => (
            <Stack key={subtopic.id} mb={15}>
              <Typography sx={{ fontSize: 16, color: "#344054" }}>
                {subtopic.title}
              </Typography>
              {renderQuestions(
                `${Topics[activeTab].id}-${subtopic.id}`,
                subtopic.title,
                subtopic.questions
              )}
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
              ...singleTheme.buttons.primary.contained,
              color: "#FFFFFF",
              width: 140,
              "&:hover": {
                backgroundColor: "#175CD3 ",
              },
            }}
            onClick={() => handleSave(Topics[activeTab].id)}
          >
            Save
            {/* {Topics[activeTab].title} */}
          </Button>
        </Stack>
      </Stack>
      {alert.show && (
        <Alert
          variant="error"
          title="Validation Error"
          body={alert.message}
          isToast={true}
          onClick={() => setAlert({ show: false, message: "" })}
        />
      )}
      {/* FileUploadComponent*/}

      <FileUploadComponent
        open={fileUploadModalOpen}
        onSuccess={() => {
          console.log("File uploaded successfully");
          handleCloseFileUploadModal();
        }}
        onError={(message) => console.log("Error uploading file: ", message)}
        onStart={() => console.log("File upload started")}
        onClose={handleCloseFileUploadModal}
        allowedFileTypes={["application/pdf"]}
        assessmentId={activeAssessmentId}
      />
      {isModalOpen && (
        <DualButtonModal
          title="Confirm Save"
          body={
            <Typography>Are you sure you want to save the changes?</Typography>
          }
          cancelText="Cancel"
          proceedText="Confirm"
          onCancel={() => setIsModalOpen(false)}
          onProceed={confirmSave}
          proceedButtonColor="primary"
          proceedButtonVariant="contained"
          TitleFontSize={13}
        />
      )}
    </Box>
  );
};

export default AllAssessment;
