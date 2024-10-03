type Project = {
  name: string;
  owner: string;
  lastUpdated: string;
  totalRequirements: number;
  completedRequirements: number;
  totalAssessments: number;
  completedAssessments: number;
  complianceFramework: string;
};

type ComplianceStatus = {
  completedRequirementsPercentage: number;
  completedAssessments: number;
  assessmentCompletionRate: number;
};

type RiskStatus = {
  acceptableRisks: number;
  residualRisks: number;
  unacceptableRisks: number;
};

type DashboardData = {
  projects: Project[];
  complianceStatus: ComplianceStatus;
  riskStatus: RiskStatus;
};

const dashboardData: DashboardData = {
  projects: [
    {
      name: "Marketing AI service",
      owner: "Adam McLawn",
      lastUpdated: "23 January 2024",
      totalRequirements: 92,
      completedRequirements: 10,
      totalAssessments: 49,
      completedAssessments: 17,
      complianceFramework: "EU AI Act",
    },
    {
      name: "Customer Support AI",
      owner: "Jane Doe",
      lastUpdated: "20 January 2024",
      totalRequirements: 75,
      completedRequirements: 45,
      totalAssessments: 30,
      completedAssessments: 20,
      complianceFramework: "ISO 42001",
    },
  ],
  complianceStatus: {
    completedRequirementsPercentage: 85,
    completedAssessments: 24,
    assessmentCompletionRate: 10,
  },
  riskStatus: {
    acceptableRisks: 31,
    residualRisks: 1,
    unacceptableRisks: 14,
  },
};

export default dashboardData;

