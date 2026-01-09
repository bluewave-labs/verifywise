import {
  getData,
  deleteDemoVendorsData,
} from "../../utils/autoDriver.utils";
import { createEUFrameworkQuery } from "../../utils/eu.utils";
import { sequelize } from "../../database/db";
import {
  createNewProjectQuery,
  deleteProjectByIdQuery,
} from "../../utils/project.utils";
import { createRiskQuery } from "../../utils/risk.utils";
import { createNewVendorQuery } from "../../utils/vendor.utils";
import { createNewVendorRiskQuery } from "../../utils/vendorRisk.utils";
import { deleteDemoUsersQuery } from "../../utils/user.utils";

import { addVendorProjects } from "../../utils/vendor.utils";
import { ProjectModel } from "../../domain.layer/models/project/project.model";
import { HighRiskRole } from "../../domain.layer/enums/high-risk-role.enum";
import { AiRiskClassification } from "../../domain.layer/enums/ai-risk-classification.enum";
import { IVendor } from "../../domain.layer/interfaces/i.vendor";
import { deleteProjectFrameworkNISTQuery } from "../../utils/nistAiRmfCorrect.utils";

export async function insertMockData(
  tenant: string,
  _organization: number,
  userId: number
) {
  const transaction = await sequelize.transaction();
  try {
    let projects = (
      (await getData("projects", tenant, transaction)) as ProjectModel[]
    )[0];
    if (!projects) {
      // create project
      const project = await createNewProjectQuery(
        {
          project_title: "AI Recruitment Screening Platform",
          owner: userId,
          start_date: new Date(Date.now()),
          geography: 1,
          target_industry: "Human Resources",
          description: "An AI-powered platform that automates candidate screening, resume parsing, and preliminary assessments for recruitment processes. The system uses machine learning to rank candidates based on job requirements and historical hiring data.",
          ai_risk_classification: AiRiskClassification.HIGH_RISK,
          type_of_high_risk_role: HighRiskRole.DEPLOYER,
          goal: "To streamline recruitment while ensuring fair, unbiased, and transparent candidate evaluation in compliance with EU AI Act requirements for high-risk employment systems",
          last_updated: new Date(Date.now()),
          last_updated_by: userId,
        },
        [], // no additional members
        [1], // frameworks
        tenant,
        userId,
        transaction,
        true // is demo
      );
      // create eu framework
      await createEUFrameworkQuery(
        project.id!,
        true,
        tenant,
        transaction,
        true
      );

      // create project risks
      await createRiskQuery(
        {
          risk_name: "Algorithmic Bias in Candidate Screening",
          risk_owner: userId,
          ai_lifecycle_phase: "Monitoring & maintenance",
          risk_description:
            "Risk of discriminatory outcomes in candidate ranking due to biased training data or model assumptions. The AI system may inadvertently favor or disadvantage candidates based on protected characteristics such as gender, age, ethnicity, or disability status.",
          risk_category: ["Bias and fairness risk"],
          impact: "High",
          assessment_mapping: "EU AI Act Article 10 - Data Governance",
          controls_mapping: "Bias Testing and Fairness Audits",
          likelihood: "Possible",
          severity: "Major",
          risk_level_autocalculated: "High risk",
          review_notes: "Requires regular bias audits and demographic parity testing across protected groups.",
          mitigation_status: "Requires review",
          current_risk_level: "High risk",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          mitigation_plan: "In Progress",
          implementation_strategy:
            "Implement fairness constraints in model training, conduct regular bias audits, and establish human oversight for final hiring decisions.",
          mitigation_evidence_document: "Bias_Audit_Report.pdf",
          likelihood_mitigation: "Possible",
          risk_severity: "Moderate",
          final_risk_level: "Medium risk",
          risk_approval: userId,
          approval_status: "In Progress",
          date_of_assessment: new Date(Date.now()),
          projects: [project.id!],
          frameworks: [1], // EU AI Act framework
        },
        tenant,
        transaction
      );

      // create vendor
      let vendor = (
        (await getData("vendors", tenant, transaction)) as IVendor[]
      )[0];
      if (!vendor) {
        vendor = await createNewVendorQuery(
          {
            projects: [project.id],
            vendor_name: "TalentAI Solutions",
            vendor_provides: "ML-based candidate scoring, resume parsing, and skills assessment APIs",
            assignee: userId,
            website: "www.talentai-solutions.com",
            vendor_contact_person: "Sarah Chen",
            review_result: "Positive",
            review_status: "Requires follow-up",
            reviewer: userId,
            review_date: new Date(Date.now()),
          },
          tenant,
          transaction,
          true // is demo
        );

        // create vendor risks (only when vendor is newly created)
        await createNewVendorRiskQuery(
          {
            vendor_id: vendor.id,
            risk_description: "Training Data Quality and Provenance",
            impact_description: "Vendor's ML models may be trained on biased or unrepresentative datasets, leading to discriminatory scoring of candidates. Lack of transparency in training data sources makes it difficult to audit for compliance.",
            likelihood: "Possible",
            risk_severity: "Major",
            action_plan: "Request vendor's model cards and training data documentation. Conduct independent bias testing on vendor API outputs. Include audit rights clause in vendor contract.",
            action_owner: userId,
            risk_level: "High risk",
          },
          tenant,
          transaction
        );
      } else {
        await addVendorProjects(vendor.id!, [project.id!], tenant, transaction);
      }
    } else {
      // project already exists, delete it and insert a new one
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteMockData(tenant: string) {
  const transaction = await sequelize.transaction();
  try {
    const demoProjects = (await getData(
      "projects",
      tenant,
      transaction
    )) as ProjectModel[];
    for (let project of demoProjects) {
      // Delete NIST AI RMF framework data first
      await deleteProjectFrameworkNISTQuery(project.id!, tenant, transaction);
      // Then delete the project
      await deleteProjectByIdQuery(project.id!, tenant, transaction);
    }
    // delete vendor related data
    await deleteDemoVendorsData(tenant, transaction);
    // delete demo users
    await deleteDemoUsersQuery(transaction);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
