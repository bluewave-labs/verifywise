import React, { createContext, useContext, useState } from "react";
import { Dayjs } from "dayjs";

interface ComplianceContextProps {
  status: string | number;
  setStatus: (value: string | number) => void;
  approver: string | number;
  setApprover: (value: string | number) => void;
  riskReview: string | number;
  setRiskReview: (value: string | number) => void;
  owner: string | number;
  setOwner: (value: string | number) => void;
  reviewer: string | number;
  setReviewer: (value: string | number) => void;
  date: Dayjs | null;
  setDate: (value: Dayjs | null) => void;
}

interface IDropdownValues {
  status: string | number;
  approver: string | number;
  riskReview: string | number;
  owner: string | number;
  reviewer: string | number;
  date: Dayjs | null;
}

interface IComplianceContext {
  children: React.ReactNode;
}

export const ComplianceContext = createContext<ComplianceContextProps | undefined>(undefined);

export const ComplianceProvider = ({ children }: IComplianceContext) => {
  const [status, setStatus] = useState<string | number>("");
  const [approver, setApprover] = useState<string | number>("");
  const [riskReview, setRiskReview] = useState<string | number>("");
  const [owner, setOwner] = useState<string | number>("");
  const [reviewer, setReviewer] = useState<string | number>("");
  const [date, setDate] = useState<Dayjs | null>(null);

  return (
    <ComplianceContext.Provider
      value={{
        status,
        setStatus,
        approver,
        setApprover,
        riskReview,
        setRiskReview,
        owner,
        setOwner,
        reviewer,
        setReviewer,
        date,
        setDate,
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
};

export const useComplianceContext = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error("useComplianceContext must be used within a ComplianceProvider");
  }
  return context;
};
