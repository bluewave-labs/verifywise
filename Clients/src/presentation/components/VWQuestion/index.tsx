import {
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
  Typography,
  Dialog,
} from "@mui/material";
import { Question } from "../../../domain/Question";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  priorities,
  PriorityLevel,
} from "../../pages/Assessment/NewAssessment/priorities";
import RichTextEditor from "../RichTextEditor";
import { useState } from "react";
import { updateEntityById } from "../../../application/repository/entity.repository";
import UppyUploadFile from "../../vw-v2-components/Inputs/FileUpload";
import Alert, { AlertProps } from "../Alert";
import { handleAlert } from "../../../application/tools/alertUtils";
import Uppy from "@uppy/core";

const VWQuestion = ({ question }: { question: Question }) => {
  const [values, setValues] = useState<Question>(question);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [uppy] = useState(() => new Uppy());

  const handleSave = async () => {
    console.log("Clicked");
    const updatedQuestion = {
      answer: values.answer ? values.answer.replace(/^<p>|<\/p>$/g, "") : "",
      evidence_files: evidenceFiles,
    };

    console.log(updatedQuestion);

    try {
      const response = await updateEntityById({
        routeUrl: `/questions/${question.id}`,
        body: updatedQuestion,
      });
      if (response.status === 202) {
        setValues(response.data.data);
        console.log("Question updated successfully:", response.data);
        handleAlert({
          variant: "success",
          body: "Question updated successfully",
          setAlert,
        });
      } else {
        handleAlert({
          variant: "error",
          body: "Something went wrong, please try again",
          setAlert,
        });
      }
    } catch (error) {
      console.error("Error updating question:", error);
      handleAlert({
        variant: "error",
        body: "Something went wrong, please try again",
        setAlert,
      });
    }
  };

  const handleFileUploadConfirm = (files: any[]) => {
    setEvidenceFiles(files);
    setIsFileUploadOpen(false);
    // Add logic to send files to the backend if needed
  };

  const handleContentChange = (answer: string) => {
    // Remove <p> tags from the beginning and end of the answer
    const cleanedAnswer = answer.replace(/^<p>|<\/p>$/g, "");
    setValues({ ...values, answer: cleanedAnswer });
  };

  return (
    <Box key={question.id} mt={10} id={`question-box-${question.id}`}>
      <Box
        sx={{
          display: "flex",
          padding: 5,
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#FBFAFA",
          border: "1px solid #D0D5DD",
          borderBottom: "none",
          borderRadius: "4px 4px 0 0",
          gap: 4,
        }}
        id={`question-header-${question.id}`}
      >
        <Typography
          sx={{ fontSize: 13, color: "#344054" }}
          id={`question-text-${question.id}`}
        >
          {question.question}
          {question.hint && (
            <Box component="span" ml={2} id={`hint-icon-${question.id}`}>
              <Tooltip
                title={question.hint}
                sx={{ fontSize: 12 }}
                id={`hint-tooltip-${question.id}`}
              >
                <InfoOutlinedIcon
                  fontSize="inherit"
                  id={`info-icon-${question.id}`}
                />
              </Tooltip>
            </Box>
          )}
        </Typography>
        <Chip
          label={question.priority_level}
          sx={{
            backgroundColor:
              priorities[question.priority_level as PriorityLevel].color,
            color: "#FFFFFF",
            borderRadius: "4px",
          }}
          size="small"
          id={`priority-chip-${question.id}`}
        />
      </Box>
      <RichTextEditor
        key={question.id}
        onContentChange={handleContentChange}
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
        initialContent={question.answer}
      />
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        id={`action-stack-${question.id}`}
      >
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
          id={`button-stack-${question.id}`}
        >
          <Button
            variant="contained"
            sx={{
              mt: 2,
              borderRadius: 2,
              width: "fit-content",
              height: 25,
              fontSize: 11,
              border: "1px solid #13715B",
              backgroundColor: "#13715B",
              color: "white",
            }}
            disableRipple
            onClick={handleSave}
            id={`save-button-${question.id}`}
          >
            Save
          </Button>
          <Button
            variant="contained"
            sx={{
              mt: 2,
              borderRadius: 2,
              width: 155,
              height: 25,
              fontSize: 11,
              border: "1px solid #D0D5DD",
              backgroundColor: "white",
              color: "#344054",
            }}
            disableRipple
            onClick={() => setIsFileUploadOpen(true)}
            id={`file-upload-button-${question.id}`}
          >
            Add/Remove evidence
          </Button>
          <Typography
            sx={{
              fontSize: 11,
              color: "#344054",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              margin: "auto",
              textWrap: "wrap",
            }}
            id={`evidence-count-${question.id}`}
          >
            {`${question.evidence_files?.length ?? 0} evidence files attached`}
          </Typography>
        </Stack>
        <Typography
          sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}
          id={`required-label-${question.id}`}
        >
          {question.is_required === true ? "required" : ""}
        </Typography>
      </Stack>
      <Dialog
        open={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        id={`file-upload-dialog-${question.id}`}
      >
        <UppyUploadFile
          uppy={uppy}
          evidence_files={evidenceFiles}
          onClose={() => setIsFileUploadOpen(false)}
          onConfirm={handleFileUploadConfirm}
        />
      </Dialog>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </Box>
  );
};

export default VWQuestion;
