import { PageTourStep } from "../../../components/PageTour";
import CustomStep from "../../../components/PageTour/CustomStep";

const HomeSteps: PageTourStep[] = [
 {
       target: '[data-joyride-id="new-project-button"]',
       content: (
         <CustomStep
           header="Create your first project"
           body="Each project corresponds to an AI activity in your company."
         />
       ),
     },
     {
       target: '[data-joyride-id="dashboard-navigation"]',
       content: (
         <CustomStep
           header="Fill in compliance,assessments, risks and vendors"
           body="Each project has its own set of questions and documents where you can fill in here."
         />
       ),
     },
];

export default HomeSteps;
