import { Box, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { Question } from "../../../domain/Question";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  priorities,
  PriorityLevel,
} from "../../pages/Assessment/NewAssessment/priorities";
import RichTextEditor from "../RichTextEditor";
import { useState } from "react";
import { updateEntityById } from "../../../application/repository/entity.repository";

const VWQuestion = ({ question }: { question: Question }) => {
  const [values, setValues] = useState<Question>(question);

  const handleSave = async () => {
    try {
      console.log("/questions values : ", values);
      const updatedQuestion = await updateEntityById({
        routeUrl: `/questions/${question.id}`,
        body: values,
      });
      setValues(updatedQuestion.data);
      console.log("Question updated successfully:", updatedQuestion.data);
    } catch (error) {
      console.error("Error updating question:", error);
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
        onContentChange={(answer: string) => {
          // Remove <p> tags from the beginning and end of the answer
          const cleanedAnswer = answer.replace(/^<p>|<\/p>$/g, "");
          setValues({ ...values, answer: cleanedAnswer });
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
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            sx={{
              mt: 2,
              borderRadius: 2,
              width: 155,
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
            onClick={() => {}}
          >
            Add/Remove evidence
          </Button>
        </Stack>
        <Typography sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}>
          {question.is_required === true ? "required" : ""}
        </Typography>
      </Stack>
    </Box>
  );
};

export default VWQuestion;
