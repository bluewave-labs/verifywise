import { Theme } from "@mui/material";
import { SxProps } from "@mui/material";

export enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk",
}

export enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative",
}

export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
}

export interface FormValues {
  project_title: string;
  owner: number;
  members: User[];
  start_date: string;
  ai_risk_classification: number;
  type_of_high_risk_role: number;
  goal: string;
  enable_ai_data_insertion: boolean;
}

export interface FormErrors {
  projectTitle?: string;
  members?: string;
  owner?: string;
  startDate?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
  goal?: string;
}

export const initialState: FormValues = {
  project_title: "",
  members: [],
  owner: 0,
  start_date: new Date().toISOString(),
  ai_risk_classification: 0,
  type_of_high_risk_role: 0,
  goal: "",
  enable_ai_data_insertion: false,
};

export interface VWProjectFormProps {
  onClose: () => void;
  sx?: SxProps<Theme> | undefined;
}
