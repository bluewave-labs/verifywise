import { TooltipRenderProps } from "react-joyride";
import { ICustomStepWrapperCoreProps } from "../../domain/types/customs.types";

/**
 * Presentation adapter for CustomStepWrapper component
 * Extends domain props with react-joyride-specific TooltipRenderProps
 */
export interface ICustomStepWrapperProps extends ICustomStepWrapperCoreProps, TooltipRenderProps {}
