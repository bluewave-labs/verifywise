import { getData, deleteDemoVendorsData } from "../utils/autoDriver.utils";
import { createEUFrameworkQuery } from "../utils/eu.utils";
import { sequelize } from "../database/db";
import {
  createNewProjectQuery,
  deleteProjectByIdQuery,
} from "../utils/project.utils";
import { createProjectRiskQuery } from "../utils/projectRisk.utils";
import { createNewVendorQuery } from "../utils/vendor.utils";
import { createNewVendorRiskQuery } from "../utils/vendorRisk.utils";
import { createNewUserQuery } from "../utils/user.utils";
import { UserModel } from "../domain.layer/models/user/user.model";

import { createISOFrameworkQuery } from "../utils/iso42001.utils";
import { addVendorProjects } from "../utils/vendor.utils";
import { Vendor } from "../domain.layer/models/vendor/vendor.model";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { HighRiskRole } from "../domain.layer/enums/high-risk-role.enum";
import { AiRiskClassification } from "../domain.layer/enums/ai-risk-classification.enum";
import { createAITrustCentreOverviewQuery } from "../utils/aiTrustCentre.utils";

export async function insertMockData(userId: number | null = null) {
  const transaction = await sequelize.transaction();
  try {
    let users = (await getData("users", transaction)) as UserModel[];
    console.log("insertMockData users ", users);
    if (users.length < 2) {
      let u1 = await createNewUserQuery(
        await UserModel.createNewUser(
          "John",
          "Doe",
          `john.doe.${Date.now()}@example.com`,
          "MyJH4rTm!@.45L0wm",
          1
        ),
        transaction,
        true // is demo
      );
      let u2 = await createNewUserQuery(
        await UserModel.createNewUser(
          "Alice",
          "Smith",
          `alice.smith.${Date.now()}@example.com`,
          "MyJH4rTm!@.45L0wm",
          2
        ),
        transaction,
        true // is demo
      );
      users.push(u1, u2);
    }

    let projects = (
      (await getData("projects", transaction)) as ProjectModel[]
    )[0];
    if (!projects) {
      const owner = userId ?? users[0].id!;
      // create project
      const project = await createNewProjectQuery(
        {
          project_title: "AI Compliance Checker",
          owner: owner,
          start_date: new Date(Date.now()),
          ai_risk_classification: AiRiskClassification.HIGH_RISK,
          type_of_high_risk_role: HighRiskRole.DEPLOYER,
          goal: "To ensure compliance with AI governance standards",
          last_updated: new Date(Date.now()),
          last_updated_by: users[0].id!,
        },
        users.reduce((acc: number[], user) => {
          if (user.id !== owner) {
            acc.push(user.id!);
          }
          return acc;
        }, []),
        [1, 2], // frameworks
        transaction,
        true // is demo
      );

      // ---- no need of is demo
      // create project risks
      await createProjectRiskQuery(
        {
          project_id: project.id,
          risk_name: "Data Privacy Compliance",
          risk_owner: users[0].id!,
          ai_lifecycle_phase: "Monitoring & maintenance",
          risk_description:
            "Risk of non-compliance with data privacy regulations.",
          risk_category: ["Cybersecurity risk"],
          impact: "High",
          assessment_mapping: "GDPR Compliance Check",
          controls_mapping: "Data Access Controls",
          likelihood: "Possible",
          severity: "Minor",
          risk_level_autocalculated: "Medium risk",
          review_notes: "Need for regular audits.",
          mitigation_status: "Requires review",
          current_risk_level: "Medium risk",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          mitigation_plan: "In Progress",
          implementation_strategy:
            "Anonymize user data in production environments.",
          mitigation_evidence_document: "Data_Anonymization_Plan.pdf",
          likelihood_mitigation: "Almost Certain",
          risk_severity: "Moderate",
          final_risk_level: "Low",
          risk_approval: users[1].id!,
          approval_status: "In Progress",
          date_of_assessment: new Date(Date.now()),
        },
        transaction
      );

      // create vendor
      let vendor = ((await getData("vendors", transaction)) as Vendor[])[0];
      if (!vendor) {
        vendor = await createNewVendorQuery(
          {
            projects: [project.id],
            vendor_name: "Vendor A",
            vendor_provides: "Consulting Services",
            assignee: users[0].id!,
            website: "www.vendora.com",
            vendor_contact_person: "Jane Smith",
            review_result: "Positive",
            review_status: "Requires follow-up",
            reviewer: users[1].id!,
            risk_status: "Very high risk",
            review_date: new Date(Date.now()),
          },
          transaction,
          true // is demo
        );
      } else {
        await addVendorProjects(vendor.id!, [project.id!], transaction);
      }

      // ---- no need of is demo
      // create vendor risks
      await createNewVendorRiskQuery(
        {
          vendor_id: vendor.id,
          risk_description: "Data Security",
          impact_description: "Alice",
          likelihood: "Almost certain",
          risk_severity: "Catastrophic",
          action_plan: "Vendor Risk 1 action plan",
          action_owner: users[0].id!,
          risk_level: "High risk",
        },
        transaction
      );

      // create eu framework
      await createEUFrameworkQuery(project.id!, true, transaction, true);
      await createISOFrameworkQuery(project.id!, true, transaction, true);
    } else {
      // project already exists, delete it and insert a new one
    }

    // Insert AI Trust Centre demo data
    console.log("Starting AI Trust Centre demo data insertion...");
    try {
      await createAITrustCentreOverviewQuery({
      intro: {
        intro_visible: true,
        purpose_visible: true,
        purpose_text: 'Our Trust Center demonstrates our commitment to responsible AI practices and data privacy. We believe in transparency, ethical AI development, and building trust with our customers through clear communication about our AI governance practices.',
        our_statement_visible: true,
        our_statement_text: 'We are committed to ethical AI development and transparent data practices. Our AI solutions are designed with privacy, security, and fairness at their core, ensuring that we build trust with our customers while delivering innovative technology.',
        our_mission_visible: true,
        our_mission_text: 'To build trust through responsible AI innovation and transparent governance. We strive to be the gold standard in AI ethics and compliance, ensuring our technology serves humanity while protecting individual rights and privacy.'
      },
      compliance_badges: {
        badges_visible: true,
        SOC2_Type_I: true,
        SOC2_Type_II: true,
        ISO_27001: true,
        ISO_42001: true,
        CCPA: true,
        GDPR: true,
        HIPAA: true,
        EU_AI_Act: true
      },
      company_info: {
        company_info_visible: true,
        background_visible: true,
        background_text: 'We are a leading AI company focused on ethical and responsible AI development. Our team of experts combines deep technical knowledge with a strong commitment to AI governance, ensuring that our solutions not only deliver exceptional results but also maintain the highest standards of privacy and security.',
        core_benefit_visible: true,
        core_benefit_text: 'Our AI solutions provide enhanced security, efficiency, and customer support while maintaining the highest ethical standards. We offer comprehensive AI governance tools, automated compliance monitoring, and transparent reporting capabilities that help organizations build trust with their stakeholders.',
        compliance_doc_visible: true,
        compliance_doc_text: 'Access our comprehensive compliance documentation and certifications. Our compliance vault contains detailed audit reports, technical documentation, and governance frameworks that demonstrate our unwavering commitment to AI governance best practices.'
      },
      terms_and_contact: {
        is_visible: true,
        has_terms_of_service: true,
        terms_of_service: 'https://example.com/terms-of-service',
        has_privacy_policy: true,
        privacy_policy: 'https://example.com/privacy-policy',
        has_company_email: true,
        company_email: 'privacy@example.com'
      }
    }, transaction);
    console.log("AI Trust Centre demo data inserted successfully");
    } catch (error) {
      console.error("Error inserting AI Trust Centre demo data:", error);
      throw error;
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteMockData() {
  const transaction = await sequelize.transaction();
  try {
    const demoProject = (await getData(
      "projects",
      transaction
    )) as ProjectModel[];
    for (let project of demoProject) {
      await deleteProjectByIdQuery(project.id!, transaction);
    }
    // delete vendor related data
    await deleteDemoVendorsData(transaction);
    
    // Delete AI Trust Centre demo data
    await sequelize.query(
      `DELETE FROM ai_trust_center_terms_and_contact WHERE organization_id = 1`,
      { transaction }
    );
    await sequelize.query(
      `DELETE FROM ai_trust_centre_company_info WHERE organization_id = 1`,
      { transaction }
    );
    await sequelize.query(
      `DELETE FROM ai_trust_centre_compliance_badges WHERE organization_id = 1`,
      { transaction }
    );
    await sequelize.query(
      `DELETE FROM ai_trust_centre_intro WHERE organization_id = 1`,
      { transaction }
    );
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
