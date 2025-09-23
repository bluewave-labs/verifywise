import {
  MitigationFormValues,
  RiskFormValues,
} from "../../presentation/components/AddNewRiskForm/interface";
import { User } from "../types/User";

export interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues; // New prop for initial values
  initialMitigationValues?: MitigationFormValues; // New prop for initial values
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
  users?: User[]; // Optional users data to avoid calling useUsers hook
  usersLoading?: boolean; // Optional loading state
}

export interface RiskSectionProps {
  closePopup: () => void;
  onSuccess: () => void;
  popupStatus: string;
}
