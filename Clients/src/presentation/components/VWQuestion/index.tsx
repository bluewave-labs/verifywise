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
import { useCallback, useContext, useMemo, useState } from "react";
import UppyUploadFile from "../../vw-v2-components/Inputs/FileUpload";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import createUppy from "../../../application/tools/createUppy";
import { updateEntityById } from "../../../application/repository/entity.repository";
import Alert, { AlertProps } from "../Alert";
import { handleAlert } from "../../../application/tools/alertUtils";
import { store } from "../../../application/redux/store";
import { apiServices } from "../../../infrastructure/api/networkServices";
import { ENV_VARs } from "../../../../env.vars";
import { FileData } from "../../../domain/File";

interface QuestionProps {
  question: Question;
}

const VWQuestion = ({ question }: QuestionProps) => {
  const { userId, currentProjectId } = useContext(VerifyWiseContext);
  const [values, setValues] = useState<Question>(question);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  const initialEvidenceFiles =
    question.evidence_files?.map((file) => JSON.parse(file)) || [];
  const [evidenceFiles, setEvidenceFiles] =
    useState<any[]>(initialEvidenceFiles);
  const [alert, setAlert] = useState<AlertProps | null>(null);

  const handleChangeEvidenceFiles = useCallback((files: FileData[]) => {
    setEvidenceFiles(files);
  }, []);

  const { auth: { authToken } } = store.getState();

  const createUppyProps = useMemo(
    () => ({
      onChangeFiles: handleChangeEvidenceFiles,
      allowedMetaFields: ["question_id", "user_id", "project_id", "delete"],
      meta: {
        question_id: question.id,
        user_id: userId,
        project_id: currentProjectId,
        delete: "[]",
      },
      routeUrl: "files",
      authToken,
    }),
    [question.id, userId, currentProjectId, handleChangeEvidenceFiles, authToken]
  );

  const [uppy] = useState(createUppy(createUppyProps));

  const handleSave = async () => {
    try {
      const response = await updateEntityById({
        routeUrl: `/questions/${question.id}`,
        body: values,
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

  const handleContentChange = (answer: string) => {
    // Remove <p> tags from the beginning and end of the answer
    const cleanedAnswer = answer.replace(/^<p>|<\/p>$/g, "");
    setValues({ ...values, answer: cleanedAnswer });
  };

  const handleRemoveFile = async (fileId: string) => {
    const state = store.getState();
    const authToken = state.auth.authToken;

    const formData = new FormData();
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      handleAlert({
        variant: "error",
        body: "Invalid file ID",
        setAlert,
      });
      return;
    }
    formData.append("delete", JSON.stringify([fileIdNumber]));
    formData.append("question_id", question.id?.toString() || "");
    formData.append("user_id", userId);
    if (currentProjectId) {
      formData.append("project_id", currentProjectId);
    }
    try {
      const response = await apiServices.post(
        `${ENV_VARs.URL}/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201 && response.data) {
        const newEvidenceFiles = evidenceFiles.filter(
          (file) => file.id !== fileId
        );
        setEvidenceFiles(newEvidenceFiles);

        handleAlert({
          variant: "success",
          body: "File deleted successfully",
          setAlert,
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      handleAlert({
        variant: "error",
        body: "Failed to delete file. Please try again.",
        setAlert,
      });
    }
  };

  return (
    <Box key={question.id} mt={10}>
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
          label={question.priority_level}
          sx={{
            backgroundColor:
              priorities[question.priority_level as PriorityLevel].color,
            color: "#FFFFFF",
            borderRadius: "4px",
          }}
          size="small"
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
      >
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
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
          >
            {`${evidenceFiles?.length ?? 0} evidence files attached`}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}>
          {question.is_required === true ? "required" : ""}
        </Typography>
      </Stack>
      <Dialog
        open={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
      >
        <UppyUploadFile
          uppy={uppy}
          files={evidenceFiles}
          onClose={() => setIsFileUploadOpen(false)}
          onRemoveFile={handleRemoveFile}
        />
      </Dialog>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </Box>
  );
};

export default VWQuestion;
