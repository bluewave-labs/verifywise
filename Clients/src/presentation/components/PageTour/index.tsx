import Joyride, { Step, TooltipRenderProps } from "react-joyride";
import React, { useEffect, useState } from "react";
import { CustomStepWrapper } from "./CustomStep";
import { Global } from "@emotion/react";

interface PageTourProps {
  steps: PageTourStep[];
  run: boolean;
  onFinish?: () => void;
  tourKey: string;
}

export interface PageTourStep {
  target: string;
  content: {
    header?: string;
    body: string;
    icon?: React.ReactNode;
  };
  placement?: "left" | "right" | "top" | "bottom" | "top-start" | "bottom-start" | "bottom-end" | "top-end";
}

const PageTour: React.FC<PageTourProps> = ({ steps, run, onFinish, tourKey }) => {
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    //always check if tour was seen first before running it
    const hasSeenTour = localStorage.getItem(tourKey);
    if (!hasSeenTour && run) {
      setShouldRun(true);
    }
  }, [run, tourKey]);

  const handleCallback = (data: any) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      localStorage.setItem(tourKey, "true");
      setShouldRun(false);
      if (onFinish) {
        onFinish();
      }
    }
  };

  const tooltipRenderer = (tooltipProps: TooltipRenderProps) => {
    return (
      <CustomStepWrapper
        {...tooltipProps}
        content={tooltipProps.step.content as any}
      />
    );
  };

  return (
    <>
      <Global
        styles={{
          '.__floater__arrow polygon': {
            fill: '#1f1f23 !important',
          },
          '.react-joyride__tooltip': {
            filter: 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3))',
            animation: 'fadeIn 0.3s ease-in-out',
          },
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.95)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
          '@keyframes fadeOut': {
            '0%': {
              opacity: 1,
              transform: 'scale(1)',
            },
            '100%': {
              opacity: 0,
              transform: 'scale(0.95)',
            },
          },
          '.react-joyride__tooltip--closing': {
            animation: 'fadeOut 0.2s ease-in-out',
          },
        }}
      />
      <Joyride
        steps={steps as unknown as Step[]}
        run={shouldRun}
        continuous
        hideCloseButton
        showProgress={false}
        showSkipButton={false}
        callback={handleCallback}
        disableOverlayClose
        tooltipComponent={tooltipRenderer}
        locale={{
          last: "Finish",
          next: "Next",
          back: "Back",
          skip: "Skip",
        }}
        styles={{
          options: {
            primaryColor: "#13715B",
            zIndex: 1200,
            beaconSize: 30,
          },
          overlay: {
            backgroundColor: "transparent",
          },
          tooltip: {
            borderRadius: "4px",
          },
          tooltipContainer: {
            textAlign: "left",
          },
          tooltipContent: {
            padding: 0,
          },
        }}
        floaterProps={{
          styles: {
            arrow: {
              length: 8,
              spread: 12,
            },
          },
          disableAnimation: false,
        }}
      />
    </>
  );
};
export default PageTour;
