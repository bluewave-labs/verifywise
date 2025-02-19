import { useEffect, useState, useRef } from "react";
import { Box, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { getEntityById } from "../../../../application/repository/entity.repository";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { priorities, PriorityLevel } from "../NewAssessment/priorities";
import RichTextEditor from "../../../components/RichTextEditor";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

type QuestionsProps = {
  subtopic: any;
  index: number;
};

const Questions = ({ subtopic, index }: QuestionsProps) => {
  const [questionsData, setQuestionsData] = useState<any>(null);
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
        setQuestionsData(response.data);
      } catch (error) {
        console.error("Failed to fetch questions data:", error);
        setQuestionsData(null);
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
      ) : questionsData ? (
        questionsData!.map((question: any, qIndex: number) => (
          <Box key={qIndex} mt={10}>
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
              key={qIndex}
              onContentChange={(answer: string) => {
                console.log(answer);
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
              initialContent={""}
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
                  onClick={() => {}}
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
              <Typography
                sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}
              >
                {question.is_required === true ? "required" : ""}
              </Typography>
            </Stack>
          </Box>
        ))
      ) : (
        <Typography>Unable to get questions</Typography>
      )}
    </Stack>
  );
};

export default Questions;
