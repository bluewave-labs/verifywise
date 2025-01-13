import Joyride, { Step } from "react-joyride";
import React, { useEffect, useState } from "react";

interface PageTourProps {
  steps: Step[];
  run: boolean;
  onFinish?: () => void;
}

const PageTour: React.FC<PageTourProps> = ({ steps, run, onFinish }) => {
  const [shouldRun, setShouldRun] = useState(true);

  useEffect(() => {
    //always check if tour was seen first before running it
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour && run) {
      setShouldRun(true);
    }
  }, [run]);

  const handleCallback = (data: any) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      localStorage.setItem("hasSeenTour", "true");
      setShouldRun(false);
      if (onFinish) {
        onFinish();
      }
    }
  };

  const buttonStyle = {
    fontSize: "13px",
    fontWeight: 400,
    gap: "8px",
    padding: "10px 16px",
  };

  return (
    <Joyride
      steps={steps}
      run={shouldRun}
      continuous
      hideCloseButton
      showProgress
      showSkipButton
      callback={handleCallback}
      locale={{
        last: "Finish",
        next: "Next",
        back: "Back",
        skip: "Skip",
      }}
      styles={{
        options: {
          primaryColor: "#1570EF",
          zIndex: 1500,
          beaconSize: 30,
        },
        buttonNext: {
          ...buttonStyle,
        },
        buttonClose: {
          ...buttonStyle,
        },
        buttonBack: {
          ...buttonStyle,
        },
        buttonSkip: {
          ...buttonStyle,
        },
      }}
    />
  );
};
export default PageTour;
