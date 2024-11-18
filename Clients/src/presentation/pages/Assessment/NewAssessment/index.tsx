import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import model from "./model.json";
import RichTextEditor from "../../../components/RichTextEditor";
import Select from "../../../components/Inputs/Select";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const priorityMapping = {
  H: {
    text: "high",
    color: "#FD7E14",
  },
  M: {
    text: "medium",
    color: "#EFB70E",
  },
  L: {
    text: "low",
    color: "#ABBDA1",
  },
};

const NewAssessment = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Extract topic names with question counts
  const topicNames = useMemo(() => {
    return model.assessment.topics.map((topic) => {
      const subtopicCount = topic.subtopics.reduce(
        (count, subtopic) => count + subtopic.questions.length,
        0
      );
      return `${topic.name} (${subtopicCount})`;
    });
  }, []);

  console.log(topicNames);

  // Handle list item click
  const handleListItemClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <Box display="flex" height="100vh" sx={{ px: "8px !important" }}>
      <Box width="30%" px={8} sx={{ overflowY: "auto" }}>
        <Typography color={theme.palette.text.secondary}>
          High risk conformity assessment
        </Typography>
        <List>
          {topicNames.map((name, index) => (
            <ListItem key={index} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                selected={index === activeTab}
                onClick={() => handleListItemClick(index)}
                disableRipple
                sx={{
                  paddingLeft: 4,
                  borderRadius: 4,
                  backgroundColor:
                    index === activeTab ? "#4C7DE7" : "transparent",
                  "&:hover": { borderRadius: 4 },
                }}
              >
                <ListItemText
                  primary={
                    <Typography color={theme.palette.text.primary}>
                      {name}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box width="70%" py={2} px={8} sx={{ overflowY: "auto" }}>
        {model.assessment.topics[activeTab].subtopics.map(
          (subtopic, subIndex) => (
            <Box key={subIndex} mb={2}>
              <Typography color={theme.palette.text.primary} variant="h6">
                {subtopic.name}
              </Typography>
              {subtopic.questions.map((question, questionIndex) => (
                <Box key={questionIndex} mt={1}>
                  <Box
                    p={5}
                    display="flex"
                    alignItems="center"
                    bgcolor={"#FBFAFA"}
                    sx={{ border: "1px solid black" }}
                  >
                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                    >
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
                      label={`${
                        priorityMapping[
                          question.priority as keyof typeof priorityMapping
                        ].text
                      } priority`}
                      sx={{
                        ml: 2,
                        backgroundColor:
                          priorityMapping[
                            question.priority as keyof typeof priorityMapping
                          ].color,
                        color: "#FFFFFF",
                      }}
                      size="small"
                    />
                  </Box>
                  {question.answerType === "long-text" && (
                    <RichTextEditor
                      onContentChange={(content: string) => {
                        console.log(content);
                      }}
                    />
                  )}
                  {question.answerType === "dropdown" && (
                    <Select
                      id={`question-${questionIndex}`}
                      value={question.answerType || ""}
                      onChange={(event) => console.log(event.target.value)}
                      placeholder="Select an option"
                      items={
                        question.dropdownOptions
                          ? question.dropdownOptions.map((option, index) => ({
                              _id: index,
                              name: option,
                            }))
                          : []
                      }
                      sx={{ width: 300, mb: 6 }}
                    />
                  )}
                  {question.fileUpload && (
                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      disableRipple={
                        theme.components?.MuiButton?.defaultProps?.disableRipple
                      }
                    >
                      Add evidence
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default NewAssessment;
