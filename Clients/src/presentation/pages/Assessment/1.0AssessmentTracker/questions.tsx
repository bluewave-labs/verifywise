import { useEffect, useState, useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { getEntityById } from "../../../../application/repository/entity.repository";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { Subtopic } from "../../../../domain/Subtopic";
import VWQuestion from "../../../components/VWQuestion";
import { Question } from "../../../../domain/Question";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

type QuestionsProps = {
  subtopic: Subtopic;
  setRefreshKey: () => void;
};

const Questions = ({ subtopic, setRefreshKey }: QuestionsProps) => {
  const { currentProjectId } = useContext(VerifyWiseContext);
  const [questionsData, setQuestionsData] = useState<Question[]>();
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);

  useEffect(() => {
    console.log('Questions: Resetting state for subtopic', subtopic?.id, 'project:', currentProjectId);
    // Reset state when project changes
    setQuestionsData(undefined);
  }, [currentProjectId]);

  useEffect(() => {
    const fetchQuestionsData = async () => {
      if (!subtopic?.id) return;

      console.log('Questions: Fetching data for subtopic', subtopic.id, 'project:', currentProjectId);
      setLoadingQuestions(true);
      try {
        const response = await getEntityById({
          routeUrl: `/questions/bysubtopic/${subtopic.id}`,
        });
        console.log('Questions: Received data for subtopic', subtopic.id, ':', response.data);
        setQuestionsData(response.data);
      } catch (error) {
        console.error("Failed to fetch questions data:", error);
        setQuestionsData([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestionsData();
  }, [subtopic?.id, currentProjectId]);

  return (
    <Stack mb={15} >
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
            <div key={question.id}>
              <VWQuestion question={question} setRefreshKey={setRefreshKey} />
            </div>
          ))
      ) : (
        <Typography>Unable to get questions</Typography>
      )}
    </Stack>
  );
};

export default Questions;
