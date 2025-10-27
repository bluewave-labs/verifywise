import {
  Stack,
  Typography,
  useTheme,
  Modal,
  IconButton,
  Box,
} from "@mui/material";
import { ArrowLeft, ArrowRight, X as CloseIcon, Save } from "lucide-react";
import {
  getNextQuestion,
  getPreviousQuestion,
  getVisibleQuestions,
  getProgress,
} from "./questions.config";
import {
  QuestionId,
  IQuestionnaireAnswers,
  ClassificationResult,
} from "./iQuestion";
import { useCallback, useState, useEffect } from "react";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import RiskAnalysisQuestion from "./RiskAnalysisQuestion";
import Result from "./Result";
import ProgressTracker from "./ProgressTracker";
import { classifyRisk } from "../../../utils/riskClassification";
import { updateProject } from "../../../../application/repository/project.repository";
import { AiRiskClassification } from "../../../../domain/enums/aiRiskClassification.enum";

interface RiskAnalysisModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  projectId: string;
  setAlert: (
    alert: {
      variant: "success" | "info" | "warning" | "error";
      title?: string;
      body: string;
      isToast: boolean;
      visible: boolean;
    } | null,
  ) => void;
  updateClassification: (classification: string) => void;
}

const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({
  isOpen,
  setIsOpen,
  projectId,
  setAlert,
  updateClassification,
}) => {
  const theme = useTheme();
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>("Q1");
  const [answers, setAnswers] = useState<IQuestionnaireAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [classification, setClassification] =
    useState<ClassificationResult | null>(null);

  // LocalStorage key for this project's risk analysis
  const STORAGE_KEY = `riskAnalysis_${projectId}`;

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { answers: savedAnswers, currentQuestionId: savedQuestionId } =
          JSON.parse(savedData);
        if (savedAnswers) {
          setAnswers(savedAnswers);
        }
        if (savedQuestionId) {
          setCurrentQuestionId(savedQuestionId);
        }
      } catch (error) {
        console.error("Failed to load saved risk analysis progress:", error);
      }
    }
  }, [projectId, STORAGE_KEY]);

  const saveAnswerToLocalStorage = useCallback(
    (id: string) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            answers,
            currentQuestionId: id,
          }),
        );
      } catch (error) {
        console.error("Failed to save risk analysis progress:", error);
      }
    },
    [answers, STORAGE_KEY],
  );

  // Clear localStorage for this project
  const clearSavedProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear saved risk analysis progress:", error);
    }
  }, [STORAGE_KEY]);

  // Get current question
  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions.find(
    (q) => q.id === currentQuestionId,
  );
  const finalQuestion = currentQuestionId === "Q5";

  // Calculate progress
  const progress = getProgress(currentQuestionId, answers);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAnsweSelect = (id: string, value: string | string[]) => {
    // Save answer
    setAnswers((prev: IQuestionnaireAnswers) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleNextQuestion = () => {
    const nextQuestion = getNextQuestion(currentQuestionId, answers);
    if (nextQuestion) {
      setCurrentQuestionId(nextQuestion.id);
      saveAnswerToLocalStorage(nextQuestion.id);
    }
  };

  const handlePreviousQuestion = () => {
    const prevQuestion = getPreviousQuestion(currentQuestionId, answers);
    if (prevQuestion) {
      setCurrentQuestionId(prevQuestion.id);
      saveAnswerToLocalStorage(prevQuestion.id);
    }
  };

  const handleShowResults = () => {
    const finalClassification = classifyRisk(answers);
    setClassification(finalClassification);
    setShowResults(true);
  };

  const handleRestartAsssessment = () => {
    setAnswers({});
    setCurrentQuestionId("Q1");
    setShowResults(false);
    setClassification(null);
    clearSavedProgress();
  };

  const getRiskClassificationType = (level: string) => {
    switch (level) {
      case "HIGH_RISK":
        return AiRiskClassification.HIGH_RISK;
      case "LIMITED_RISK":
        return AiRiskClassification.LIMITED_RISK;
      case "MINIMAL_RISK":
        return AiRiskClassification.MINIMAL_RISK;
      default:
        return "";
    }
  };

  const handleSaveConfirm = useCallback(async () => {
    if (!classification) return;

    const selectedRiskClass = getRiskClassificationType(classification.level);

    await updateProject({
      id: Number(projectId),
      body: {
        id: projectId,
        ai_risk_classification: selectedRiskClass,
      },
    }).then((response) => {
      if (response.status === 202) {
        clearSavedProgress(); // Clear localStorage after successful save
        setAlert({
          variant: "success",
          body: "Project updated successfully",
          isToast: true,
          visible: true,
        });
        setTimeout(() => {
          setAlert(null);
          handleClose();
          updateClassification(selectedRiskClass);
        }, 2000);
      } else if (response.status === 400) {
        setAlert({
          variant: "error",
          body: response.data.data.message,
          isToast: true,
          visible: true,
        });
      }
    });
  }, [
    projectId,
    setAlert,
    classification,
    clearSavedProgress,
    updateClassification,
  ]);

  const handleSave = () => {
    handleSaveConfirm();
    setTimeout(() => {
      setAlert(null);
    }, 1500);
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        handleClose();
      }}
      sx={{ overflowY: "scroll" }}
    >
      <Stack
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: Math.min(900, window.innerWidth - 40),
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: theme.palette.background.modal,
          border: "none",
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: { xs: 4, sm: 8, md: 16 },
          outline: "none",
          color: theme.palette.text.primary,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack>
              <Typography fontSize={15} fontWeight={700} sx={{color: theme.palette.text.primary}}>
                EU AI Act risk classification
              </Typography>
              <Typography fontSize={13}>
                Determine your AI system's regulatory classification.
              </Typography>
            </Stack>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon size={20} />
          </IconButton>
        </Stack>

        {showResults && classification ? (
          <Result
            classification={classification}
            answers={answers}
            onRestart={handleRestartAsssessment}
            onSave={handleSave}
          />
        ) : (
          <>
            {/* Progress Tracker */}
            <ProgressTracker
              currentStep={progress.current}
              totalSteps={progress.total}
            />

            {/* Content */}
            <Stack spacing={3}>
              {currentQuestion ? (
                <RiskAnalysisQuestion
                  question={currentQuestion}
                  onSelect={handleAnsweSelect}
                  answers={answers}
                />
              ) : (
                <Typography>No more questions.</Typography>
              )}
            </Stack>

            {/* Footer */}
            <Box
              sx={{
                mt: 5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Box>
                {currentQuestionId !== "Q1" && (
                  <CustomizableButton
                    text="Back"
                    icon={<ArrowLeft />}
                    onClick={handlePreviousQuestion}
                    sx={{
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <CustomizableButton
                text={finalQuestion ? "View results" : "Next"}
                onClick={finalQuestion ? handleShowResults : handleNextQuestion}
                isDisabled={
                  currentQuestionId ? !answers[currentQuestionId] : true
                }
                endIcon={finalQuestion ? <Save /> : <ArrowRight />}
                sx={{
                  fontWeight: 600,
                  "&:disabled": { borderColor: theme.palette.grey[200] },
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default RiskAnalysisModal;
