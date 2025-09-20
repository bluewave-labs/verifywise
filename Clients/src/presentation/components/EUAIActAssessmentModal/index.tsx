import React, { useState, useEffect } from "react";
import { Stack, Typography, useTheme, Box, Modal } from "@mui/material";
import CustomizableButton from "../Button/CustomizableButton";
import { useModalKeyHandling } from "../../../application/hooks/useModalKeyHandling";
import { ReactComponent as CloseGreyIcon } from "../../assets/icons/close-grey.svg";
import { assessmentData } from "../../pages/EUAIActAssessment/assessmentData";
import { DecisionEngine, AssessmentAnswers, AssessmentResult } from "../../pages/EUAIActAssessment/decisionEngine";
import { jsPDF } from "jspdf";
import singleTheme from "../../themes/v1SingleTheme";
import { vwhomeCreateModalFrame } from "../../pages/Home/1.0Home/style";

interface EUAIActAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EUAIActAssessmentModal: React.FC<EUAIActAssessmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const decisionEngine = new DecisionEngine();

  useModalKeyHandling({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAnswers({});
      setResult(null);
      setIsCompleted(false);
      setProgress(0);
    }
  }, [isOpen]);

  const getCurrentStep = (): any => {
    return assessmentData.workflow[currentStep] || assessmentData.workflow[0];
  };

  const handleAnswer = (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < assessmentData.workflow.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / assessmentData.workflow.length) * 100);
    } else {
      // Complete assessment
      decisionEngine.setAnswers(answers);
      const assessmentResult = decisionEngine.evaluate();
      setResult(assessmentResult);
      setIsCompleted(true);
      setProgress(100);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress((currentStep - 1) / assessmentData.workflow.length * 100);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setIsCompleted(false);
    setProgress(0);
  };

  const exportToPDF = () => {
    if (!result) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    // const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("EU AI Act Readiness Assessment Report", margin, yPosition);
    yPosition += 20;

    // Result
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Result: ${result.result}`, margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(result.headline, margin, yPosition);
    yPosition += 10;

    // Teaching
    pdf.setFontSize(12);
    const teachingLines = pdf.splitTextToSize(result.teaching, pageWidth - 2 * margin);
    pdf.text(teachingLines, margin, yPosition);
    yPosition += teachingLines.length * 5 + 10;

    // Save PDF
    pdf.save("eu-ai-act-assessment-report.pdf");
  };

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case "boolean":
        return (
          <Stack gap={2}>
            <Typography sx={{ ...singleTheme.textStyles.pageDescription, fontWeight: 500 }}>
              {question.text}
            </Typography>
            <Stack direction="row" gap={2}>
              <CustomizableButton
                text="Yes"
                variant={answers[question.id] === true ? "contained" : "outlined"}
                color="primary"
                onClick={() => handleAnswer(question.id, true)}
                sx={{ minWidth: 80 }}
              />
              <CustomizableButton
                text="No"
                variant={answers[question.id] === false ? "contained" : "outlined"}
                color="primary"
                onClick={() => handleAnswer(question.id, false)}
                sx={{ minWidth: 80 }}
              />
            </Stack>
          </Stack>
        );

      case "multiple_choice":
        return (
          <Stack gap={2}>
            <Typography sx={{ ...singleTheme.textStyles.pageDescription, fontWeight: 500 }}>
              {question.text}
            </Typography>
            <Stack gap={1}>
              {question.options?.map((option: any, index: any) => (
                <CustomizableButton
                  key={index}
                  text={option}
                  variant={answers[question.id] === option ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => handleAnswer(question.id, option)}
                  sx={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    padding: "8px 16px",
                    fontSize: 13
                  }}
                />
              ))}
            </Stack>
          </Stack>
        );

      default:
        return null;
    }
  };

  const renderStepContent = () => {
    const step = getCurrentStep();

    if (isCompleted && result) {
      return (
        <Stack gap={3}>
          <Typography sx={{ ...singleTheme.textStyles.pageTitle, color: result.color }}>
            Assessment Complete: {result.result}
          </Typography>
          <Typography sx={{ ...singleTheme.textStyles.pageDescription, fontWeight: 500 }}>
            {result.headline}
          </Typography>
          <Typography sx={{ ...singleTheme.textStyles.pageDescription }}>
            {result.teaching}
          </Typography>
          {result.obligations && result.obligations.length > 0 && (
            <Stack gap={1}>
              <Typography sx={{ ...singleTheme.textStyles.pageDescription, fontWeight: 600 }}>
                Key Obligations:
              </Typography>
              {result.obligations.map((obligation, index) => (
                <Typography key={index} sx={{ ...singleTheme.textStyles.pageDescription, ml: 2 }}>
                  • {obligation}
                </Typography>
              ))}
            </Stack>
          )}
          {result.next_steps && result.next_steps.length > 0 && (
            <Stack gap={1}>
              <Typography sx={{ ...singleTheme.textStyles.pageDescription, fontWeight: 600 }}>
                Next Steps:
              </Typography>
              {result.next_steps.map((step, index) => (
                <Typography key={index} sx={{ ...singleTheme.textStyles.pageDescription, ml: 2 }}>
                  • {step}
                </Typography>
              ))}
            </Stack>
          )}
          <Stack direction="row" gap={2} mt={2}>
            <CustomizableButton
              text="Export PDF"
              variant="contained"
              color="primary"
              onClick={exportToPDF}
            />
            <CustomizableButton
              text="Start Over"
              variant="outlined"
              color="primary"
              onClick={handleRestart}
            />
          </Stack>
        </Stack>
      );
    }

    return (
      <Stack gap={3}>
        <Typography sx={{ ...singleTheme.textStyles.pageTitle }}>
          {step.title}
        </Typography>
        {step.description && (
          <Typography sx={{ ...singleTheme.textStyles.pageDescription }}>
            {step.description}
          </Typography>
        )}
        <Stack gap={3}>
          {step.questions.map((question: any) => (
            <Box key={question.id}>
              {renderQuestion(question)}
            </Box>
          ))}
        </Stack>
      </Stack>
    );
  };

  const canProceed = () => {
    const step = getCurrentStep();
    return step.questions.every((q: any) => answers[q.id] !== undefined);
  };

  if (!isOpen) return null;


  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <Stack
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        sx={{
          ...vwhomeCreateModalFrame,
          width: "90vw",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "hidden",
          p: 0, // Override padding to handle it inside
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography sx={{ ...singleTheme.textStyles.pageTitle, fontSize: 18 }}>
            EU AI Act Readiness Assessment
          </Typography>
          <CustomizableButton
            text=""
            variant="text"
            onClick={onClose}
            sx={{
              ...singleTheme.iconButtons,
              minWidth: "auto",
              p: 1,
            }}
          >
            <CloseGreyIcon />
          </CustomizableButton>
        </Stack>

        {/* Progress Bar */}
        {!isCompleted && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography sx={{ ...singleTheme.textStyles.pageDescription }}>
                Step {currentStep + 1} of {assessmentData.workflow.length}
              </Typography>
              <Typography sx={{ ...singleTheme.textStyles.pageDescription }}>
                {Math.round(progress)}% Complete
              </Typography>
            </Stack>
            <Box
              sx={{
                width: "100%",
                height: 4,
                backgroundColor: theme.palette.grey[200],
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: singleTheme.buttons.primary.contained.backgroundColor,
                  transition: "width 0.3s ease",
                }}
              />
            </Box>
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
          }}
        >
          {renderStepContent()}
        </Box>

        {/* Footer */}
        {!isCompleted && (
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              p: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CustomizableButton
              text="Previous"
              variant="outlined"
              onClick={handlePrevious}
              isDisabled={currentStep === 0}
              sx={{ minWidth: 100 }}
            />
            <CustomizableButton
              text={currentStep === assessmentData.workflow.length - 1 ? "Complete Assessment" : "Next"}
              variant="contained"
              color="primary"
              onClick={handleNext}
              isDisabled={!canProceed()}
              sx={{ minWidth: 100 }}
            />
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default EUAIActAssessmentModal;