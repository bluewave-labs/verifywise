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
import { Topic, Topics } from "../../../structures/AssessmentTracker/Topics";
import { useState } from "react";

type PriorityLevel = "high priority" | "medium priority" | "low priority";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RichTextEditor from "../../../components/RichTextEditor";
import { RiskManagementSystem } from "../../../structures/AssessmentTracker/risk-management-system.subtopic";
import { DataGovernance } from "../../../structures/AssessmentTracker/data-governance.subtopic";
import { TechnicalDocumentation } from "../../../structures/AssessmentTracker/technical-documentation.subtopic";

const priorities = {
  "high priority": { color: "#FD7E14" },
  "medium priority": { color: "#EFB70E" },
  "low priority": { color: "#ABBDA1" },
};

const assessments = [
  { id: 1, component: RiskManagementSystem },
  { id: 2, component: DataGovernance },
  { id: 3, component: TechnicalDocumentation },
];

const AllAssessment = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Handle list item click
  const handleListItemClick = (index: number) => {
    setActiveTab(index);
  };

  const assessmentItem = (index: number, topic: Topic) => {
    return (
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
    );
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
        {Topics[activeTab].id === assessments[activeTab].id &&
          assessments[activeTab].component.map((subtopic, subIndex) => (
            <Stack key={subIndex} mb={2}>
              <Typography sx={{ fontSize: 16, color: "#344054" }}>
                {subtopic.title}
              </Typography>
              {subtopic.questions.map((question, questionIndex) => (
                <Box key={questionIndex} mt={10}>
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
                          <Tooltip title={question.hint}>
                            <InfoOutlinedIcon fontSize="inherit" />
                          </Tooltip>
                        </Box>
                      )}
                    </Typography>
                    <Chip
                      label={question.priorityLevel}
                      sx={{
                        backgroundColor:
                          priorities[question.priorityLevel as PriorityLevel]
                            .color,
                        color: "#FFFFFF",
                      }}
                      size="small"
                    />
                  </Box>

                  <RichTextEditor
                    onContentChange={(content: string) => {
                      console.log(content);
                    }}
                    headerSx={{
                      borderRadius: 0,
                      BorderTop: "none",
                      borderColor: "#D0D5DD",
                    }}
                    bodySx={{
                      borderColor: "#D0D5DD",
                      borderRadius: "0 0 4px 4px",
                    }}
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
                    >
                      Add evidence
                    </Button>
                    <Typography
                      sx={{ fontSize: 11, color: "#344054", fontWeight: "300" }}
                    >
                      {question.evidenceFile === "Not required"
                        ? "required"
                        : ""}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ))}
      </Stack>
    </Box>
  );
};

export default AllAssessment;
