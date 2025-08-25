// Copy and paste this entire script into your browser console to generate 20 demo risks
// Make sure you're on the project risks page first

async function createDemoRisks() {
  console.log('🚀 Starting demo risk creation...');
  
  // Get project ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = parseInt(urlParams.get('projectId') || '3');
  
  console.log(`📋 Creating risks for project ID: ${projectId}`);

  const risks = [
    {
      risk_name: "AI Model Bias in Hiring Algorithm",
      risk_description: "The AI model shows systematic bias against certain demographic groups in hiring processes, potentially leading to discriminatory outcomes and legal challenges.",
      risk_category: ["Compliance risk", "Reputational risk"],
      ai_lifecycle_phase: "Model development & training",
      likelihood: "Possible",
      severity: "Major",
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
      current_risk_level: "Medium risk",
      mitigation_status: "On Hold",
      risk_owner: "Chief Technology Officer"
    },
    {
      risk_name: "Model Performance Degradation Over Time",
      risk_description: "AI model accuracy decreases over time without proper monitoring and retraining procedures in place.",
      risk_category: ["Operational risk", "Technological risk"],
      ai_lifecycle_phase: "Monitoring & maintenance",
      likelihood: "Likely",
      severity: "Major",
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
      current_risk_level: "Medium risk",
      mitigation_status: "Completed",
      risk_owner: "Data Science Team"
    },
    {
      risk_name: "AI System Security Vulnerabilities",
      risk_description: "AI system vulnerabilities could be exploited by malicious actors to compromise operations or steal sensitive data.",
      risk_category: ["Cybersecurity risk", "Operational risk"],
      ai_lifecycle_phase: "Deployment & integration",
      likelihood: "Unlikely",
      severity: "Critical",
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
      current_risk_level: "High risk",
      mitigation_status: "Not Started",
      risk_owner: "Legal Counsel"
    },
    {
      risk_name: "Fairness Metrics Below Standards",
      risk_description: "Fairness metrics fail to meet organizational or regulatory standards for equitable treatment across different groups.",
      risk_category: ["Compliance risk", "Reputational risk"],
      ai_lifecycle_phase: "Model validation & testing",
      likelihood: "Likely",
      severity: "Moderate",
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
      current_risk_level: "Medium risk",
      mitigation_status: "Completed",
      risk_owner: "Operations Director"
    },
    {
      risk_name: "Lack of Decision Transparency",
      risk_description: "Absence of clear explanations for AI decisions undermines user trust and regulatory compliance requirements.",
      risk_category: ["Compliance risk", "Reputational risk"],
      ai_lifecycle_phase: "Deployment & integration",
      likelihood: "Almost Certain",
      severity: "Minor",
      current_risk_level: "Medium risk",
      mitigation_status: "On Hold",
      risk_owner: "Product Manager"
    },
    {
      risk_name: "Data Governance Framework Gaps",
      risk_description: "Inadequate data governance creates risks around data quality, privacy, and regulatory compliance issues.",
      risk_category: ["Data privacy risk", "Compliance risk"],
      ai_lifecycle_phase: "Data collection & processing",
      likelihood: "Possible",
      severity: "Major",
      current_risk_level: "High risk",
      mitigation_status: "In Progress",
      risk_owner: "Privacy Officer"
    },
    {
      risk_name: "Model Validation Process Inadequacy",
      risk_description: "Current model validation processes are insufficient to catch errors and biases before system deployment.",
      risk_category: ["Operational risk", "Compliance risk"],
      ai_lifecycle_phase: "Model validation & testing",
      likelihood: "Likely",
      severity: "Major",
      current_risk_level: "Very high risk",
      mitigation_status: "Not Started",
      risk_owner: "Data Science Team"
    },
    {
      risk_name: "Missing AI Ethics Committee Oversight",
      risk_description: "No dedicated AI ethics committee exists to review and approve AI system implementations and related policies.",
      risk_category: ["Compliance risk", "Strategic risk"],
      ai_lifecycle_phase: "Problem definition & planning",
      likelihood: "Almost Certain",
      severity: "Moderate",
      current_risk_level: "Medium risk",
      mitigation_status: "In Progress",
      risk_owner: "AI Ethics Officer"
    },
    {
      risk_name: "Automated Decision Appeal Process Missing",
      risk_description: "No clear process exists for individuals to appeal or challenge automated decisions that affect them.",
      risk_category: ["Legal risk", "Compliance risk"],
      ai_lifecycle_phase: "Deployment & integration",
      likelihood: "Likely",
      severity: "Moderate",
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
      current_risk_level: "High risk",
      mitigation_status: "On Hold",
      risk_owner: "Privacy Officer"
    },
    {
      risk_name: "AI Environmental Impact Assessment Missing",
      risk_description: "AI system energy consumption and environmental impact have not been adequately assessed or mitigated.",
      risk_category: ["Environmental risk", "Reputational risk"],
      ai_lifecycle_phase: "Problem definition & planning",
      likelihood: "Rare",
      severity: "Minor",
      current_risk_level: "Low risk",
      mitigation_status: "Not Started",
      risk_owner: "Operations Director"
    },
    {
      risk_name: "Insufficient Staff AI Literacy Training",
      risk_description: "Staff lack sufficient understanding of AI systems they work with, creating operational and compliance risks.",
      risk_category: ["Human resources risk", "Operational risk"],
      ai_lifecycle_phase: "Deployment & integration",
      likelihood: "Likely",
      severity: "Moderate",
      current_risk_level: "Medium risk",
      mitigation_status: "In Progress",
      risk_owner: "Human Resources Manager"
    }
  ];

  let created = 0;
  let failed = 0;

  for (let i = 0; i < risks.length; i++) {
    try {
      const risk = risks[i];
      
      // Build complete risk object
      const riskData = {
        project_id: projectId,
        ...risk,
        risk_level_autocalculated: risk.current_risk_level,
        impact: `Significant impact on ${['operations', 'compliance', 'reputation', 'customer satisfaction'][Math.floor(Math.random() * 4)]}`,
        assessment_mapping: "AI Risk Assessment Framework v2.0",
        controls_mapping: "ISO 42001 AI Management System Controls",
        review_notes: `Risk assessment completed by automated process on ${new Date().toISOString().split('T')[0]}`,
        deadline: new Date(Date.now() + (30 + Math.random() * 335) * 24 * 60 * 60 * 1000).toISOString(), // 30-365 days from now
        mitigation_plan: `Comprehensive ${risk.current_risk_level.toLowerCase()} mitigation strategy for ${risk.risk_name.toLowerCase()}`,
        implementation_strategy: "Phased implementation with continuous monitoring and quarterly reviews",
        mitigation_evidence_document: `mitigation_evidence_${i + 1}_${Date.now()}.pdf`,
        likelihood_mitigation: risk.likelihood,
        risk_severity: risk.severity,
        final_risk_level: risk.current_risk_level,
        risk_approval: Math.random() > 0.3 ? "Approved by Risk Committee" : "Pending Management Review",
        approval_status: Math.random() > 0.4 ? "Approved" : "Pending",
        date_of_assessment: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // 0-60 days ago
        recommendations: `${risk.current_risk_level} priority: Regular monitoring and ${['weekly', 'bi-weekly', 'monthly'][Math.floor(Math.random() * 3)]} review recommended.`
      };

      console.log(`⏳ Creating risk ${i + 1}/20: ${risk.risk_name}`);

      // Make API call using fetch with current session
      const response = await fetch('/api/projectRisks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(riskData)
      });

      if (response.ok) {
        created++;
        console.log(`✅ Risk ${i + 1} created successfully`);
      } else {
        failed++;
        console.log(`❌ Risk ${i + 1} failed: ${response.status} ${response.statusText}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      failed++;
      console.error(`❌ Error creating risk ${i + 1}:`, error);
    }
  }

  console.log(`\n🎉 Demo risk creation complete!`);
  console.log(`✅ Successfully created: ${created} risks`);
  console.log(`❌ Failed to create: ${failed} risks`);
  console.log(`🔄 Refreshing page in 3 seconds to show new data...`);
  
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// Run the function
createDemoRisks();