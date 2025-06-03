import { Stack, Typography } from "@mui/material";
import { Subtopic } from "../../../../domain/types/Subtopic";
import QuestionFrame from "../../../components/VWQuestion";
import { Question } from "../../../../domain/types/Question";

type QuestionsProps = {
  subtopic: Subtopic;
  setRefreshKey: () => void;
  currentProjectId: number;
  questionsData: Question[];
};

const Questions = ({
  subtopic,
  setRefreshKey,
  currentProjectId,
  questionsData,
}: QuestionsProps) => {
  return (
    <Stack mb={15}>
      <Typography sx={{ fontSize: 16, color: "#344054" }}>
        {subtopic.title}
      </Typography>
      {questionsData
        .sort(
          (a: Question, b: Question) => (a.order_no ?? 0) - (b.order_no ?? 0)
        )
        .map((question: Question) => (
          <div key={question.question_id}>
            <QuestionFrame
              question={question}
              setRefreshKey={setRefreshKey}
              currentProjectId={currentProjectId}
            />
          </div>
        ))}
    </Stack>
  );
};

export default Questions;
