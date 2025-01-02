import Joyride, {Step} from 'react-joyride';
import React, {useEffect, useState} from 'react';

interface PageTourProps {
    steps: Step[];
    onFinish?:()=>void;
}

const PageTour: React.FC<PageTourProps> =({steps, onFinish}) => {
    const [run, setRun] = useState(false);

    useEffect (()=>{
        //always check if tour was seen first before running it
         const hasSeenTour = localStorage.getItem("hasSeenTour");
         if(!hasSeenTour){
            setRun(true);
         }
    }, [])

    const handleCallback = (data:any)=>{
        const {status} = data;
        if (status === 'finished' || status === 'skipper'){
            localStorage.setItem("hasSeenTour", "true");
            setRun(false);
            if (onFinish){
                onFinish();
            }
        }
    }

    return (
        <Joyride 
        steps={steps}
        run={run}
        continuous
        hideCloseButton
        showProgress
        showSkipButton
        callback={handleCallback}
        />
    )
}
export default PageTour;