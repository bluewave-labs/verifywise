import { Dayjs } from "dayjs";

export interface SubControlState {
  control_id: string;
  subControlId: string;
  subControlTitle: string;
  subControlDescription: string;
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  owner: string | number;
  reviewer: string | number;
  description: string;
  date: Dayjs | null;
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
