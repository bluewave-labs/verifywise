import { Theme } from "@mui/material";
import { SxProps } from "@mui/material";

export enum FrameworkTypeEnum {
  ProjectBased = "project-based",
  OrganizationWide = "organization-wide",
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
  status: number;
  type_of_high_risk_role: number;
  goal: string;
  enable_ai_data_insertion: boolean;
  monitored_regulations_and_standards: { _id: number; name: string }[];
  framework_type: FrameworkTypeEnum | null;
}

export interface FormErrors {
  projectTitle?: string;
  members?: string;
  frameworks?: string;
  owner?: string;
  startDate?: string;
  riskClassification?: string;
  status?: string;
  typeOfHighRiskRole?: string;
  goal?: string;
  frameworkType?: string;
}

export const initialState: FormValues = {
  project_title: "",
  members: [],
  owner: 0,
  start_date: new Date().toISOString(),
  ai_risk_classification: 0,
  status: 1,
  type_of_high_risk_role: 0,
  goal: "",
  enable_ai_data_insertion: false,
  monitored_regulations_and_standards: [],
  framework_type: null,
};

export interface ProjectFormProps {
  onClose: () => void;
  sx?: SxProps<Theme> | undefined;
  defaultFrameworkType?: FrameworkTypeEnum;
  projectToEdit?: any; // Add optional prop for editing
}

export interface FrameworkOption {
  value: FrameworkTypeEnum;
  title: string;
  description: string;
}

export const frameworkOptions: FrameworkOption[] = [
  {
    value: FrameworkTypeEnum.ProjectBased,
    title: "Project-based frameworks",
    description: "EU AI Act only (specific to an AI system/project)",
  },
  {
    value: FrameworkTypeEnum.OrganizationWide,
    title: "Organization-wide framework",
    description: "ISO 42001 and ISO 27001 (company-wide project)",
  },
];
