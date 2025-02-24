import { useState, useContext } from "react";
import { Typography, Divider, Box, Stack, Button } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import Alert, { AlertProps } from "../../../components/Alert";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import FileUploadModal from "../../../components/Modals/FileUpload";
import { Project } from "../../../../application/hooks/useProjectData";
import { FileProps } from "../../../components/FileUpload/types";
import AssessmentItem from "./AssessmentItem/AssessmentItem";
import VWToast from "../../../vw-v2-components/Toast";
import { Topic } from "../../../../application/hooks/useAssessmentAnswers";
import AssessmentQuestions from "./AssessmentQuestions/AssessmentQuestions";
import { handleAlert } from "../../../../application/tools/alertUtils";

export interface AssessmentValue {
  topic: string;
  subtopic: {
    id: string;
    name: string; // title
    questions: {
      id: string;
      questionText: string;
      answer: string;
      answerType: string;
      evidenceFileRequired: boolean;
      hint: string;
      isRequired: boolean;
      priorityLevel: "high priority" | "medium priority" | "low priority";
      // evidenceFiles?: string[];
    }[];
  }[];
  file: FileProps[];
}

const AllAssessment = ({
  initialAssessmentsValues,
}: {
  initialAssessmentsValues: Topic[];
}) => {
  const { currentProjectId, dashboardValues } = useContext(VerifyWiseContext);
  const { projects } = dashboardValues;

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assessmentsValues, setAssessmentsValue] = useState<Topic[]>(
    initialAssessmentsValues
  );
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicIdToSave, setTopicIdToSave] = useState<number | null>(null);

  const currentProject: Project | null = currentProjectId
    ? projects.find(
        (project: Project) => project.id === Number(currentProjectId)
      )
    : null;
  const activeAssessmentId = currentProject?.assessment_id.toString();

  //modal
  const handleOpenFileUploadModal = () => setFileUploadModalOpen(true);
  const handleCloseFileUploadModal = () => {
    console.log("Closing file upload modal");
    setFileUploadModalOpen(false);
  };

  const handleSave = (topicIdToSave: number) => {
    setTopicIdToSave(topicIdToSave);
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    if (topicIdToSave === null) return;

    const assessmentToSave = assessmentsValues[activeTab];

    const formData = new FormData();

    formData.append("assessmentId", String(activeAssessmentId));
    formData.append("topic", JSON.stringify(assessmentToSave.title));
    formData.append("subtopic", JSON.stringify(assessmentToSave.subtopics));
    formData.append("topicId", topicIdToSave.toString());

    if (assessmentToSave.file && assessmentToSave.file.length > 0) {
      assessmentToSave.file.forEach((file: any, index: number) => {
        formData.append(`file[${index}]`, file as any);
      });
    } else {
      formData.append("file", new Blob(), "empty-file.txt");
    }

    setIsSubmitting(true);

    try {
      const response = await apiServices.post(
        "/assessments/saveAnswers",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        handleAlert({
          variant: "success",
          body: "Assessments saved successfully.",
          setAlert,
        });
      } else {
        handleAlert({
          variant: "error",
          body: "Error: Could not save answers.",
          setAlert,
        });
      }
    } catch (error) {
      handleAlert({
        variant: "error",
        body: "Error: Could not save answers.",
        setAlert,
      });
      console.error("Error saving assessments:", error);
    } finally {
      setIsModalOpen(false);
      setTopicIdToSave(null);
      setIsSubmitting(false);
    }
  };

  const handleListItemClick = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setActiveTab(index);
  };

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
        <AssessmentItem
          assessmentsValues={assessmentsValues}
          handleListItemClick={handleListItemClick}
          activeTab={activeTab}
        />
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
        <AssessmentQuestions
          assessmentsValues={assessmentsValues}
          activeTab={activeTab}
          setAssessmentsValue={setAssessmentsValue}
          handleOpenFileUploadModal={handleOpenFileUploadModal}
        />
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
            onClick={() => handleSave(assessmentsValues[activeTab].id)}
          >
            Save
            {/* {Topics[activeTab].title} */}
          </Button>
        </Stack>
      </Stack>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
      <FileUploadModal
        uploadProps={{
          open: fileUploadModalOpen,
          onClose: handleCloseFileUploadModal,
          onSuccess: () => {
            console.log("File uploaded successfully");
            handleCloseFileUploadModal();
          },
          allowedFileTypes: ["application/pdf"],
          assessmentId: activeAssessmentId ? Number(activeAssessmentId) : 0,
          topicId: assessmentsValues[activeTab].id,
          setAssessmentsValue,
          assessmentsValues,
        }}
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
      {isSubmitting && (
        <VWToast title="Processing your request. Please wait..." />
      )}
    </Box>
  );
};

export default AllAssessment;
