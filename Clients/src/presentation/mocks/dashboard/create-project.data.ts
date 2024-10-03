type ProjectCreationData = {
  projectTitle: string;
  owner: string;
  users: string[];
  startDate: string;
  goal: string;
  aiRiskClassification: string;
  highRiskRole: string;
};

const newProjectData: ProjectCreationData = {
  projectTitle: "AI Chatbot Implementation",
  owner: "Sarah Johnson",
  users: ["John Doe", "Alice Cooper", "Bob Smith"],
  startDate: "2024-01-06",
  goal: "Develop and integrate an AI chatbot for customer support by Q2.",
  aiRiskClassification: "High",
  highRiskRole: "AI system administrator",
};

export default newProjectData;
