// Demo Risk Generator Script
// Run this in the browser console to create 20 demo risks for testing

async function createDemoRisk(projectId, riskData) {
  const authToken = localStorage.getItem('authToken');
  
  const response = await fetch('/api/projectRisks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(riskData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

const riskTemplates = [
  {
    risk_name: "AI Model Bias in Hiring Decisions",
    risk_description: "The AI model shows systematic bias against certain demographic groups in hiring processes, potentially leading to discriminatory outcomes and legal challenges.",
    risk_category: ["Compliance risk", "Reputational risk"],
    ai_lifecycle_phase: "Model development & training",
    likelihood: "Possible",
    severity: "Major",
    risk_level_autocalculated: "High risk",
    current_risk_level: "High risk",
    mitigation_status: "In Progress",
    risk_owner: "AI Ethics Officer"
  },
  {
    risk_name: "Data Privacy Breach in Training Dataset",
    risk_description: "Personal data used in model training may be exposed or misused, violating GDPR and other privacy regulations.",
    risk_category: ["Legal risk", "Data privacy risk"],
    ai_lifecycle_phase: "Data collection & processing",
    likelihood: "Unlikely",
    severity: "Critical",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "Completed",
    risk_owner: "Privacy Officer"
  },
  {
    risk_name: "Algorithmic Fairness Standards Non-compliance",
    risk_description: "Algorithm produces results that fail to meet fairness metrics and could violate equal treatment regulations.",
    risk_category: ["Compliance risk", "Legal risk"],
    ai_lifecycle_phase: "Model validation & testing",
    likelihood: "Likely",
    severity: "Major",
    risk_level_autocalculated: "High risk",
    current_risk_level: "Very high risk",
    mitigation_status: "Not Started",
    risk_owner: "Compliance Manager"
  },
  {
    risk_name: "Insufficient Model Explainability",
    risk_description: "Model decisions cannot be adequately explained to stakeholders, creating transparency and trust issues.",
    risk_category: ["Operational risk", "Compliance risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Almost Certain",
    severity: "Moderate",
    risk_level_autocalculated: "High risk",
    current_risk_level: "High risk",
    mitigation_status: "In Progress",
    risk_owner: "Data Science Team"
  },
  {
    risk_name: "Third-party AI Service Dependency Risk",
    risk_description: "Heavy reliance on external AI services creates potential single points of failure and vendor lock-in risks.",
    risk_category: ["Third-party/vendor risk", "Operational risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Possible",
    severity: "Moderate",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "On Hold",
    risk_owner: "Chief Technology Officer"
  },
  {
    risk_name: "Model Performance Degradation",
    risk_description: "AI model accuracy decreases over time without proper monitoring and retraining procedures in place.",
    risk_category: ["Operational risk", "Technological risk"],
    ai_lifecycle_phase: "Monitoring & maintenance",
    likelihood: "Likely",
    severity: "Major",
    risk_level_autocalculated: "High risk",
    current_risk_level: "High risk",
    mitigation_status: "In Progress",
    risk_owner: "Operations Director"
  },
  {
    risk_name: "Inadequate Human Oversight Implementation",
    risk_description: "Insufficient human review processes for AI decisions may lead to harmful automated outcomes.",
    risk_category: ["Operational risk", "Human resources risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Possible",
    severity: "Major",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "High risk",
    mitigation_status: "Requires review",
    risk_owner: "Product Manager"
  },
  {
    risk_name: "Training Data Quality Issues",
    risk_description: "Poor quality, incomplete, or biased training data results in unreliable model predictions and decisions.",
    risk_category: ["Operational risk", "Data privacy risk"],
    ai_lifecycle_phase: "Data collection & processing",
    likelihood: "Unlikely",
    severity: "Major",
    risk_level_autocalculated: "Low risk",
    current_risk_level: "Medium risk",
    mitigation_status: "Completed",
    risk_owner: "Data Science Team"
  },
  {
    risk_name: "AI System Security Vulnerabilities",
    risk_description: "AI system vulnerabilities could be exploited by malicious actors to compromise operations or steal data.",
    risk_category: ["Cybersecurity risk", "Operational risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Unlikely",
    severity: "Critical",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "High risk",
    mitigation_status: "In Progress",
    risk_owner: "Security Team Lead"
  },
  {
    risk_name: "Regulatory Compliance Gaps",
    risk_description: "Current AI implementation may not comply with emerging AI regulations and industry standards.",
    risk_category: ["Compliance risk", "Legal risk"],
    ai_lifecycle_phase: "Problem definition & planning",
    likelihood: "Possible",
    severity: "Major",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "High risk",
    mitigation_status: "Not Started",
    risk_owner: "Legal Counsel"
  },
  {
    risk_name: "Fairness Metrics Below Standards",
    risk_description: "Fairness metrics fail to meet organizational or regulatory standards for equitable treatment across groups.",
    risk_category: ["Compliance risk", "Reputational risk"],
    ai_lifecycle_phase: "Model validation & testing",
    likelihood: "Likely",
    severity: "Moderate",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "In Progress",
    risk_owner: "AI Ethics Officer"
  },
  {
    risk_name: "AI System Reliability Failures",
    risk_description: "AI system failures could disrupt critical business operations and negatively impact customer services.",
    risk_category: ["Operational risk", "Technological risk"],
    ai_lifecycle_phase: "Monitoring & maintenance",
    likelihood: "Unlikely",
    severity: "Major",
    risk_level_autocalculated: "Low risk",
    current_risk_level: "Medium risk",
    mitigation_status: "Completed",
    risk_owner: "Operations Director"
  },
  {
    risk_name: "Lack of Decision Transparency",
    risk_description: "Absence of clear explanations for AI decisions undermines user trust and regulatory compliance.",
    risk_category: ["Compliance risk", "Reputational risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Almost Certain",
    severity: "Minor",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "On Hold",
    risk_owner: "Product Manager"
  },
  {
    risk_name: "Data Governance Framework Gaps",
    risk_description: "Inadequate data governance creates risks around data quality, privacy, and regulatory compliance.",
    risk_category: ["Data privacy risk", "Compliance risk"],
    ai_lifecycle_phase: "Data collection & processing",
    likelihood: "Possible",
    severity: "Major",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "High risk",
    mitigation_status: "In Progress",
    risk_owner: "Privacy Officer"
  },
  {
    risk_name: "Model Validation Process Inadequacy",
    risk_description: "Current model validation processes are insufficient to catch errors and biases before deployment.",
    risk_category: ["Operational risk", "Compliance risk"],
    ai_lifecycle_phase: "Model validation & testing",
    likelihood: "Likely",
    severity: "Major",
    risk_level_autocalculated: "High risk",
    current_risk_level: "Very high risk",
    mitigation_status: "Not Started",
    risk_owner: "Data Science Team"
  },
  {
    risk_name: "Missing AI Ethics Oversight",
    risk_description: "No dedicated AI ethics committee to review and approve AI system implementations and policies.",
    risk_category: ["Compliance risk", "Strategic risk"],
    ai_lifecycle_phase: "Problem definition & planning",
    likelihood: "Almost Certain",
    severity: "Moderate",
    risk_level_autocalculated: "High risk",
    current_risk_level: "Medium risk",
    mitigation_status: "In Progress",
    risk_owner: "AI Ethics Officer"
  },
  {
    risk_name: "Automated Decision Appeal Process Missing",
    risk_description: "No clear process exists for individuals to appeal or challenge automated decisions affecting them.",
    risk_category: ["Legal risk", "Compliance risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Likely",
    severity: "Moderate",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "Requires review",
    risk_owner: "Legal Counsel"
  },
  {
    risk_name: "Cross-border Data Transfer Violations",
    risk_description: "International data transfers for AI processing may violate local privacy laws and data localization requirements.",
    risk_category: ["Data privacy risk", "Legal risk"],
    ai_lifecycle_phase: "Data collection & processing",
    likelihood: "Possible",
    severity: "Major",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "High risk",
    mitigation_status: "On Hold",
    risk_owner: "Privacy Officer"
  },
  {
    risk_name: "AI Environmental Impact Not Assessed",
    risk_description: "AI system energy consumption and environmental impact not adequately assessed or mitigated.",
    risk_category: ["Environmental risk", "Reputational risk"],
    ai_lifecycle_phase: "Problem definition & planning",
    likelihood: "Rare",
    severity: "Minor",
    risk_level_autocalculated: "Very Low risk",
    current_risk_level: "Low risk",
    mitigation_status: "Not Started",
    risk_owner: "Operations Director"
  },
  {
    risk_name: "Insufficient Staff AI Literacy",
    risk_description: "Staff lack sufficient understanding of AI systems they work with, creating operational and compliance risks.",
    risk_category: ["Human resources risk", "Operational risk"],
    ai_lifecycle_phase: "Deployment & integration",
    likelihood: "Likely",
    severity: "Moderate",
    risk_level_autocalculated: "Medium risk",
    current_risk_level: "Medium risk",
    mitigation_status: "In Progress",
    risk_owner: "Human Resources"
  }
];

async function generateDemoRisks(projectId = 3) {
  console.log(`🚀 Starting demo risk generation for project ${projectId}...`);
  
  const results = [];
  
  for (let i = 0; i < riskTemplates.length; i++) {
    try {
      const riskTemplate = riskTemplates[i];
      
      // Add required fields
      const riskData = {
        project_id: projectId,
        ...riskTemplate,
        impact: `High impact on ${['operations', 'compliance', 'reputation', 'customer trust'][Math.floor(Math.random() * 4)]}`,
        assessment_mapping: "AI Risk Assessment Framework",
        controls_mapping: "AI Governance Controls",
        review_notes: `Risk assessment completed on ${new Date().toISOString().split('T')[0]}`,
        deadline: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(), // Random future date
        mitigation_plan: `Comprehensive mitigation strategy for ${riskTemplate.risk_name.toLowerCase()}`,
        implementation_strategy: "Phased implementation with continuous monitoring",
        mitigation_evidence_document: `evidence_${i + 1}.pdf`,
        likelihood_mitigation: riskTemplate.likelihood,
        risk_severity: riskTemplate.severity,
        final_risk_level: riskTemplate.current_risk_level,
        risk_approval: "Pending Review",
        approval_status: Math.random() > 0.5 ? "Approved" : "Pending",
        date_of_assessment: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random past date
        recommendations: `Regular monitoring recommended for this ${riskTemplate.current_risk_level.toLowerCase()}.`
      };
      
      console.log(`⏳ Creating risk ${i + 1}/20: ${riskData.risk_name}`);
      
      const result = await createDemoRisk(projectId, riskData);
      results.push(result);
      
      // Add delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Failed to create risk ${i + 1}:`, error);
    }
  }
  
  console.log(`✅ Successfully created ${results.length} out of ${riskTemplates.length} demo risks!`);
  console.log('🔄 Refreshing page to show new risks...');
  
  // Refresh the page to show new data
  window.location.reload();
  
  return results;
}

// Make function globally available
window.generateDemoRisks = generateDemoRisks;

console.log('📝 Demo risk generator loaded!');
console.log('💡 Run generateDemoRisks() in the console to create 20 demo risks');
console.log('💡 Or run generateDemoRisks(YOUR_PROJECT_ID) for a specific project');