import { useEffect, useState, useRef } from "react";
import { Stack, Typography } from "@mui/material";
import { getEntityById } from "../../../../application/repository/entity.repository";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { Subtopic } from "../../../../domain/Subtopic";
import VWQuestion from "../../../components/Question";
import { Question } from "../../../../domain/Question";

type QuestionsProps = {
  subtopic: Subtopic;
  index: number;
};

const Questions = ({ subtopic, index }: QuestionsProps) => {
  const [questionsData, setQuestionsData] = useState<Question[]>();
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuestionsData = async () => {
      if (!subtopic?.id) return;

      setLoadingQuestions(true);
      try {
        const response = await getEntityById({
          routeUrl: `/questions/bysubtopic/${subtopic.id}`,
        });
        console.log("response.data : ", response.data);
        setQuestionsData(response.data);
      } catch (error) {
        console.error("Failed to fetch questions data:", error);
        setQuestionsData([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestionsData();
  }, [subtopic]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [questionsData]);

  return (
    <Stack key={index} mb={15} ref={containerRef}>
      <Typography sx={{ fontSize: 16, color: "#344054" }}>
        {subtopic.title}
      </Typography>
      {loadingQuestions ? (
        <VWSkeleton
          height={50}
          minHeight={50}
          minWidth={260}
          width={"100%"}
          maxWidth={"100%"}
          variant="rectangular"
        />
      ) : Array.isArray(questionsData) ? (
        questionsData
          .sort(
            (a: Question, b: Question) => (a.order_no ?? 0) - (b.order_no ?? 0)
          )
          .map((question: any) => (
            <VWQuestion key={question.id} question={question} />
          ))
      ) : (
        <Typography>Unable to get questions</Typography>
      )}
    </Stack>
  );
};

export default Questions;
