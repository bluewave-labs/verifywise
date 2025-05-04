import {
  MitigationFormValues,
  RiskFormValues,
} from "../../presentation/components/AddNewRiskForm/interface";

export interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues; // New prop for initial values
  initialMitigationValues?: MitigationFormValues; // New prop for initial values
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
}

export interface RiskSectionProps {
  closePopup: () => void;
  onSuccess: () => void;
  popupStatus: string;
}
