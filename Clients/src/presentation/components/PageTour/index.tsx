import Joyride, {Step} from 'react-joyride';
import React, {useEffect, useState} from 'react';

interface PageTourProps {
    steps: Step[];
    run: boolean;   
    onFinish?:()=>void;
}

const PageTour: React.FC<PageTourProps> =({steps, run, onFinish}) => {
   const [shouldRun, setShouldRun] = useState(false);

    useEffect (()=>{
        //always check if tour was seen first before running it
         const hasSeenTour = localStorage.getItem("hasSeenTour");
         if(!hasSeenTour && run){
            setShouldRun(true);
         }
    }, [run])

    const handleCallback = (data:any)=>{
        const {status} = data;
        if (status === 'finished' || status === 'skipped'){
            localStorage.setItem("hasSeenTour", "true");
            setShouldRun(false);
            if (onFinish){
                onFinish();
            }
        }
    }

    return (
      <Joyride
        steps={steps}
        run={shouldRun}
        continuous
        hideCloseButton
        showProgress
        showSkipButton
        callback={handleCallback}
        styles={{
          options: {
            primaryColor: "rgba(23, 92, 211, 1)",
            zIndex: 1000,
            beaconSize: 20,
          },
        }}
      />
    );
}
export default PageTour;