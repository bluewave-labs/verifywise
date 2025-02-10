import { Dayjs } from "dayjs";

// duplication in field names is due to miss matchings between FE and DB and will be fixed soon
export interface SubControlState {
  id?: any;
  title?: any;
  control_id: string;
  subControlId: string;
  subControlTitle: string;
  sub_control_title?: string;
  subControlDescription: string;
  sub_control_description?: string;
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  risk_review?: string | number;
  owner: string | number;
  reviewer: string | number;
  description: string;
  implementation_details?: string;
  date: Dayjs | null;
  due_date?: Dayjs | null;
  evidence: string;
  feedback: string;
}

export interface State {
  control: {
    id: string;
    controlTitle: string;
    controlDescription: string;
    status: string | number;
    approver: string | number;
    riskReview: string | number;
    owner: string | number;
    reviewer: string | number;
    description: string;
    date: Dayjs | null;
  };
  subControls: SubControlState[];
}
