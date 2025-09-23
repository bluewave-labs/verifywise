import {
  MitigationFormValues,
  RiskFormValues,
} from "../../presentation/components/AddNewRiskForm/interface";
import { UserModel } from "../models/user";

export interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues; // New prop for initial values
  initialMitigationValues?: MitigationFormValues; // New prop for initial values
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
  users?: UserModel[]; // Optional users data to avoid calling useUsers hook
  usersLoading?: boolean; // Optional loading state
}

export interface RiskSectionProps {
  closePopup: () => void;
  onSuccess: () => void;
  popupStatus: string;
}
