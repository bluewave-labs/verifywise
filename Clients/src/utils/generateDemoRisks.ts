import { createProjectRisk } from "../application/repository/projectRisk.repository";

const riskCategories = [
  "Strategic risk",
  "Operational risk", 
  "Compliance risk",
  "Financial risk",
  "Cybersecurity risk",
  "Reputational risk",
  "Legal risk",
  "Technological risk",
  "Third-party/vendor risk",
  "Environmental risk",
  "Human resources risk",
  "Data privacy risk"
];

const aiLifecyclePhases = [
  "Problem definition & planning",
  "Data collection & processing", 
  "Model development & training",
  "Model validation & testing",
  "Deployment & integration",
  "Monitoring & maintenance",
  "Decommissioning & retirement"
];

const likelihoods = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
const severities = ["Negligible", "Minor", "Moderate", "Major", "Critical"];
const riskLevels = ["Very Low risk", "Low risk", "Medium risk", "High risk", "Very high risk"];
const mitigationStatuses = ["Not Started", "In Progress", "Completed", "On Hold", "Requires review"];

const riskNames = [
  "Model Bias in Hiring Algorithm",
  "Data Privacy Breach in Training Set", 
  "Algorithmic Discrimination Against Protected Groups",
  "Insufficient Model Explainability",
  "Third-party AI Service Dependency",
  "Model Performance Degradation Over Time",
  "Inadequate Human Oversight Implementation",
  "Training Data Quality Issues",
  "Model Security Vulnerabilities",
  "Regulatory Non-compliance Risk",
  "Fairness Metrics Not Meeting Standards",
  "AI System Reliability Failures",
  "Lack of Transparency in Decision Making",
  "Data Governance Framework Gaps",
  "Model Validation Process Inadequacy",
  "AI Ethics Committee Oversight Missing",
  "Automated Decision Appeal Process Absent",
  "Cross-border Data Transfer Violations",
  "AI System Environmental Impact",
  "Insufficient Staff AI Literacy Training"
];

const riskDescriptions = [
  "The AI model shows systematic bias against certain demographic groups, potentially leading to unfair outcomes and legal challenges.",
  "Personal data used in training may be exposed or misused, violating privacy regulations and customer trust.",
  "Algorithm produces discriminatory results that could violate equal opportunity laws and damage reputation.",
  "Model decisions cannot be adequately explained to stakeholders, creating compliance and trust issues.",
  "Heavy reliance on external AI services creates potential points of failure and vendor lock-in risks.",
  "Model accuracy decreases over time without proper monitoring and retraining procedures.",
  "Insufficient human review processes for AI decisions may lead to harmful automated outcomes.",
  "Poor quality or biased training data results in unreliable model predictions and decisions.",
  "AI system vulnerabilities could be exploited by malicious actors to compromise operations.",
  "Current AI implementation may not comply with emerging regulatory requirements and standards.",
  "Fairness metrics fail to meet organizational or regulatory standards for equitable treatment.",
  "AI system failures could disrupt critical business operations and customer services.",
  "Lack of clear explanations for AI decisions undermines user trust and regulatory compliance.",
  "Inadequate data governance creates risks around data quality, privacy, and regulatory compliance.",
  "Model validation processes are insufficient to catch errors and biases before deployment.",
  "Missing AI ethics oversight committee to review and approve AI system implementations.",
  "No clear process for individuals to appeal or challenge automated decisions affecting them.",
  "International data transfers for AI processing may violate local privacy laws and regulations.",
  "AI system energy consumption and environmental impact not adequately assessed or mitigated.",
  "Staff lack sufficient understanding of AI systems they work with, creating operational risks."
];

const owners = [
  "Data Science Team",
  "AI Ethics Officer", 
  "Chief Technology Officer",
  "Compliance Manager",
  "Product Manager",
  "Security Team Lead",
  "Legal Counsel",
  "Operations Director",
  "Privacy Officer",
  "Risk Management Team"
];

const mitigationPlans = [
  "Implement bias testing framework and diverse training data collection processes",
  "Deploy advanced data encryption and access control mechanisms",
  "Establish fairness metrics monitoring and algorithmic auditing procedures", 
  "Develop comprehensive model explainability tools and documentation",
  "Create vendor risk assessment process and backup service providers",
  "Implement continuous monitoring and automated retraining pipelines",
  "Design human-in-the-loop review processes for critical decisions",
  "Establish data quality assurance and validation procedures",
  "Deploy security scanning tools and penetration testing protocols",
  "Conduct regulatory compliance audit and implement required controls",
  "Define and monitor fairness KPIs with regular assessment cycles",
  "Implement system redundancy and failure recovery procedures",
  "Create decision explanation interfaces and transparency reports",
  "Establish comprehensive data governance framework and policies",
  "Develop rigorous model testing and validation protocols",
  "Form AI ethics committee with clear review and approval processes",
  "Design automated decision appeal and review mechanisms",
  "Implement data localization strategies and privacy-preserving techniques",
  "Conduct environmental impact assessment and implement green AI practices",
  "Deliver comprehensive AI literacy training program for all staff"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function generateRandomRisk(projectId: number, index: number) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (Math.random() * 365 * 24 * 60 * 60 * 1000)); // Up to 1 year from now
  const pastDate = new Date(now.getTime() - (Math.random() * 90 * 24 * 60 * 60 * 1000)); // Up to 3 months ago

  return {
    project_id: projectId,
    risk_name: riskNames[index] || `AI Risk ${index + 1}`,
    risk_owner: getRandomElement(owners),
    ai_lifecycle_phase: getRandomElement(aiLifecyclePhases),
    risk_description: riskDescriptions[index] || `Description for AI risk ${index + 1}`,
    risk_category: getRandomElements(riskCategories, Math.floor(Math.random() * 3) + 1),
    impact: `High impact on ${getRandomElement(['operations', 'compliance', 'reputation', 'financial performance', 'customer trust'])}`,
    assessment_mapping: "Standard AI Risk Assessment Framework",
    controls_mapping: "AI Governance Control Matrix",
    likelihood: getRandomElement(likelihoods),
    severity: getRandomElement(severities),
    risk_level_autocalculated: getRandomElement(riskLevels),
    review_notes: `Risk assessment completed on ${pastDate.toISOString().split('T')[0]}`,
    mitigation_status: getRandomElement(mitigationStatuses),
    current_risk_level: getRandomElement(riskLevels),
    deadline: futureDate,
    mitigation_plan: mitigationPlans[index] || `Mitigation plan for risk ${index + 1}`,
    implementation_strategy: "Phased implementation with regular monitoring and review",
    mitigation_evidence_document: `risk_${index + 1}_evidence.pdf`,
    likelihood_mitigation: getRandomElement(likelihoods),
    risk_severity: getRandomElement(severities),
    final_risk_level: getRandomElement(riskLevels),
    risk_approval: "Pending Management Review",
    approval_status: Math.random() > 0.5 ? "Approved" : "Pending",
    date_of_assessment: pastDate,
    recommendations: `Regular monitoring and quarterly review recommended for this ${getRandomElement(['high priority', 'medium priority', 'standard'])} risk.`
  };
}

export async function createDemoRisks(projectId: number, count: number = 20) {
  console.log(`Creating ${count} demo risks for project ${projectId}...`);
  
  const createdRisks = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const riskData = generateRandomRisk(projectId, i);
      console.log(`Creating risk ${i + 1}: ${riskData.risk_name}`);
      
      const response = await createProjectRisk({ body: riskData });
      createdRisks.push(response.data);
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to create risk ${i + 1}:`, error);
    }
  }
  
  console.log(`Successfully created ${createdRisks.length} out of ${count} demo risks`);
  return createdRisks;
}

// Function to be called from browser console
export async function generateRisksForCurrentProject() {
  // Get project ID from URL or current context
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = parseInt(urlParams.get('projectId') || '3'); // Default to project 3
  
  return await createDemoRisks(projectId, 20);
}