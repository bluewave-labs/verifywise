import CustomStep from "../../../components/PageTour/CustomStep";

const AssessmentSteps = [
    {
      target: '[data-joyride-id="assessment-progress-bar"]',
      content: (
        <CustomStep body="Check the status of your assessment tracker here." />
      ),
    },
    {
      target: '[data-joyride-id="assessment-topics"]',
      content: (
        <CustomStep body="Go to your assessments and start filling in the assessment questions for your project." />
      ),
    },
  ];

  export default AssessmentSteps;