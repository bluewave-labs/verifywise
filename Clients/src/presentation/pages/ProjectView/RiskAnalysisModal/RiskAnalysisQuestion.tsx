import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { IQuestion, IQuestionnaireAnswers } from "./iQuestion";

const radioOptionStyle = {
  width: "100%",
  padding: "0px 4px",
  border: "1px solid #E4E7EC",
  borderRadius: "4px",
  backgroundColor: "#FFFFFF",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  marginLeft: 0,
  marginRight: 0,
  "&:hover": {
    borderColor: "#13715B",
    backgroundColor: "#F9F9F9",
  },
  "&.selected": {
    borderColor: "#13715B",
    backgroundColor: "#F0F9F6",
  },
};

interface RiskAnalysisQuestionProps {
  question: IQuestion;
  onSelect: (id: string, value: string | string[]) => void;
  answers: IQuestionnaireAnswers;
}

const RiskAnalysisQuestion = ({
  question,
  onSelect,
  answers,
}: RiskAnalysisQuestionProps) => {
  return (
    <Stack>
      <Typography fontSize={15} fontWeight={600} my={4} color="text.primary">
        {question.id}. {question.text}
      </Typography>
      {/* Options */}
      <Stack spacing={2}>
        {question.inputType === "single_select" ? (
          <RadioGroup
            value={answers[question.id] || ""}
            onChange={(event) => onSelect(question.id, event.target.value)}
            sx={{ gap: 4 }}
          >
            {question.options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Typography
                    fontSize={13}
                    color="text.primary"
                  >
                    {option.label}
                  </Typography>
                }
                sx={{
                  ...radioOptionStyle,
                  "&.Mui-checked": {
                    ...radioOptionStyle["&.selected"],
                  },
                  "& .MuiFormControlLabel-label": {
                    width: "100%",
                  },
                }}
              />
            ))}
          </RadioGroup>
        ) : (
          <FormControl sx={{gap: 4}}>
            {question.options.map((option) => {
              const selectedValues =
                answers[question.id] && Array.isArray(answers[question.id])
                  ? answers[question.id]
                  : [];
              const isChecked = (selectedValues ?? []).includes(option.value);
              return (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={(event) => {
                        const currentValues = (
                          Array.isArray(answers[question.id])
                            ? answers[question.id]
                            : []
                        ) as string[];
                        const newValues = event.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v) => v !== option.value);
                        onSelect(question.id, newValues);
                      }}
                    />
                  }
                  label={
                    <Typography
                      fontSize={13}
                      color="text.primary"
                    >
                      {option.label}
                    </Typography>
                  }
                  sx={{
                    ...radioOptionStyle,
                    "&.Mui-checked": {
                      ...radioOptionStyle["&.selected"],
                    },
                    "& .MuiFormControlLabel-label": {
                      width: "100%",
                    },
                  }}
                />
              );
            })}
          </FormControl>
        )}
      </Stack>
    </Stack>
  );
};
export default RiskAnalysisQuestion;
