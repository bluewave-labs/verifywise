import { AITrustCenterIntroModel } from "../domain.layer/models/aiTrustCentreIntro/aiTrustCentreIntro.model";
import { AITrustCenterComplianceBadgesModel } from "../domain.layer/models/aiTrustCentreBadges/aiTrustCentreBadges.model";
import {AITrustCentreCompanyInfoModel} from "../domain.layer/models/aiTrustCentreCompanyInfo/aiTrustCentreCompanyInfo.model"
import { AITrustCenterTermsAndContactModel } from "../domain.layer/models/aiTrustCentreTermsAndContact/aiTrustCentreTermsAndContact.model";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";

export const createAITrustCentreOverviewQuery = async (
  overview: {
    intro: Partial<AITrustCenterIntroModel>,
    compliance_badges: Partial<AITrustCenterComplianceBadgesModel>,
    company_info: Partial<AITrustCentreCompanyInfoModel>,
    terms_and_contact?: Partial<AITrustCenterTermsAndContactModel>
  },
  transaction: Transaction
) => {
  // Use organization_id = 1 for all inserts
  const organization_id = 1;

  // Insert into ai_trust_center_intro
  const [intro] = await sequelize.query(
    `INSERT INTO ai_trust_center_intro (
      intro_visible, purpose_visible, purpose_text,
      our_statement_visible, our_statement_text,
      our_mission_visible, our_mission_text, organization_id
    ) VALUES (
      :intro_visible, :purpose_visible, :purpose_text,
      :our_statement_visible, :our_statement_text,
      :our_mission_visible, :our_mission_text, :organization_id
    ) RETURNING *`,
    {
      replacements: {
        ...overview.intro,
        organization_id,
      },
      transaction,
    }
  );

  // Insert into ai_trust_center_compliance_badges
  const [compliance_badges] = await sequelize.query(
    `INSERT INTO ai_trust_center_compliance_badges (
      badges_visible, "SOC2_Type_I", "SOC2_Type_II", "ISO_27001", "ISO_42001",
      "CCPA", "GDPR", "HIPAA", "EU_AI_Act", organization_id
    ) VALUES (
      :badges_visible, :SOC2_Type_I, :SOC2_Type_II, :ISO_27001, :ISO_42001,
      :CCPA, :GDPR, :HIPAA, :EU_AI_Act, :organization_id
    ) RETURNING *`,
    {
      replacements: {
        ...overview.compliance_badges,
        organization_id,
      },
      transaction,
    }
  );

  // Insert into ai_trust_center_company_info
  const [company_info] = await sequelize.query(
    `INSERT INTO ai_trust_center_company_info (
      company_info_visible, background_visible, background_text,
      core_benefit_visible, core_benefit_text,
      compliance_doc_visible, compliance_doc_text, organization_id
    ) VALUES (
      :company_info_visible, :background_visible, :background_text,
      :core_benefit_visible, :core_benefit_text,
      :compliance_doc_visible, :compliance_doc_text, :organization_id
    ) RETURNING *`,
    {
      replacements: {
        ...overview.company_info,
        organization_id,
      },
      transaction,
    }
  );

  // Insert into ai_trust_center_terms_and_contact
    const [terms_and_contact] = await sequelize.query(
      `INSERT INTO ai_trust_center_terms_and_contact (
        is_visible, has_terms_of_service, terms_of_service,
        has_privacy_policy, privacy_policy,
        has_company_email, company_email, organization_id
      ) VALUES (
        :is_visible, :has_terms_of_service, :terms_of_service,
        :has_privacy_policy, :privacy_policy,
        :has_company_email, :company_email, :organization_id
      ) RETURNING *`,
      {
        replacements: {
          ...overview.terms_and_contact,
          organization_id,
        },
        transaction,
      }
    );
  

  return {
    intro,
    compliance_badges,
    company_info,
    terms_and_contact,
  };
};

export const getAITrustCentreOverviewQuery = async (organizationId: number) => {
  try {
    // Get intro data
    const [introResults] = await sequelize.query(
      `SELECT * FROM ai_trust_center_intro WHERE organization_id = :organizationId`,
      {
        replacements: { organizationId },
      }
    );

    // Get compliance badges data
    const [complianceBadgesResults] = await sequelize.query(
      `SELECT * FROM ai_trust_center_compliance_badges WHERE organization_id = :organizationId`,
      {
        replacements: { organizationId },
      }
    );

    // Get company info data
    const [companyInfoResults] = await sequelize.query(
      `SELECT * FROM ai_trust_center_company_info WHERE organization_id = :organizationId`,
      {
        replacements: { organizationId },
      }
    );

    // Get terms and contact data
    const [termsAndContactResults] = await sequelize.query(
      `SELECT * FROM ai_trust_center_terms_and_contact WHERE organization_id = :organizationId`,
      {
        replacements: { organizationId },
      }
    );

    // If no data exists, return null
    if (!introResults[0] && !complianceBadgesResults[0] && !companyInfoResults[0] && !termsAndContactResults[0]) {
      return null;
    }

    const result = {
      intro: introResults[0] || null,
      compliance_badges: complianceBadgesResults[0] || null,
      company_info: companyInfoResults[0] || null,
      terms_and_contact: termsAndContactResults[0] || null,
    };

    console.log('AI Trust Centre data fetched from database:', result);
    return result;
  } catch (error) {
    console.error('Error fetching AI Trust Centre overview:', error);
    throw error;
  }
};

export const updateAITrustCentreOverviewQuery = async (
  overview: {
    intro?: Partial<AITrustCenterIntroModel>,
    compliance_badges?: Partial<AITrustCenterComplianceBadgesModel>,
    company_info?: Partial<AITrustCentreCompanyInfoModel>,
    terms_and_contact?: Partial<AITrustCenterTermsAndContactModel>
  },
  transaction: Transaction
) => {
  const organization_id = 1;
  const results: any = {};

  // Update intro if provided
  if (overview.intro) {
    const [intro] = await sequelize.query(
      `UPDATE ai_trust_center_intro SET
        intro_visible = COALESCE(:intro_visible, intro_visible),
        purpose_visible = COALESCE(:purpose_visible, purpose_visible),
        purpose_text = COALESCE(:purpose_text, purpose_text),
        our_statement_visible = COALESCE(:our_statement_visible, our_statement_visible),
        our_statement_text = COALESCE(:our_statement_text, our_statement_text),
        our_mission_visible = COALESCE(:our_mission_visible, our_mission_visible),
        our_mission_text = COALESCE(:our_mission_text, our_mission_text),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM ai_trust_center_intro 
        WHERE organization_id = :organization_id 
        ORDER BY id ASC 
        LIMIT 1
      )
      RETURNING *`,
      {
        replacements: {
          ...overview.intro,
          organization_id,
        },
        transaction,
      }
    );
    results.intro = intro[0]; // Take only the first record
  }

  // Update compliance badges if provided
  if (overview.compliance_badges) {
    const [compliance_badges] = await sequelize.query(
      `UPDATE ai_trust_center_compliance_badges SET
        badges_visible = COALESCE(:badges_visible, badges_visible),
        "SOC2_Type_I" = COALESCE(:SOC2_Type_I, "SOC2_Type_I"),
        "SOC2_Type_II" = COALESCE(:SOC2_Type_II, "SOC2_Type_II"),
        "ISO_27001" = COALESCE(:ISO_27001, "ISO_27001"),
        "ISO_42001" = COALESCE(:ISO_42001, "ISO_42001"),
        "CCPA" = COALESCE(:CCPA, "CCPA"),
        "GDPR" = COALESCE(:GDPR, "GDPR"),
        "HIPAA" = COALESCE(:HIPAA, "HIPAA"),
        "EU_AI_Act" = COALESCE(:EU_AI_Act, "EU_AI_Act"),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM ai_trust_center_compliance_badges 
        WHERE organization_id = :organization_id 
        ORDER BY id ASC 
        LIMIT 1
      )
      RETURNING *`,
      {
        replacements: {
          ...overview.compliance_badges,
          organization_id,
        },
        transaction,
      }
    );
    results.compliance_badges = compliance_badges[0]; // Take only the first record
  }

  // Update company info if provided
  if (overview.company_info) {
    const [company_info] = await sequelize.query(
      `UPDATE ai_trust_center_company_info SET
        company_info_visible = COALESCE(:company_info_visible, company_info_visible),
        background_visible = COALESCE(:background_visible, background_visible),
        background_text = COALESCE(:background_text, background_text),
        core_benefit_visible = COALESCE(:core_benefit_visible, core_benefit_visible),
        core_benefit_text = COALESCE(:core_benefit_text, core_benefit_text),
        compliance_doc_visible = COALESCE(:compliance_doc_visible, compliance_doc_visible),
        compliance_doc_text = COALESCE(:compliance_doc_text, compliance_doc_text),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM ai_trust_center_company_info 
        WHERE organization_id = :organization_id 
        ORDER BY id ASC 
        LIMIT 1
      )
      RETURNING *`,
      {
        replacements: {
          ...overview.company_info,
          organization_id,
        },
        transaction,
      }
    );
    results.company_info = company_info[0]; // Take only the first record
  }

  // Update terms and contact if provided
  if (overview.terms_and_contact) {
    const [terms_and_contact] = await sequelize.query(
      `UPDATE ai_trust_center_terms_and_contact SET
        is_visible = COALESCE(:is_visible, is_visible),
        has_terms_of_service = COALESCE(:has_terms_of_service, has_terms_of_service),
        terms_of_service = COALESCE(:terms_of_service, terms_of_service),
        has_privacy_policy = COALESCE(:has_privacy_policy, has_privacy_policy),
        privacy_policy = COALESCE(:privacy_policy, privacy_policy),
        has_company_email = COALESCE(:has_company_email, has_company_email),
        company_email = COALESCE(:company_email, company_email),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM ai_trust_center_terms_and_contact 
        WHERE organization_id = :organization_id 
        ORDER BY id ASC 
        LIMIT 1
      )
      RETURNING *`,
      {
        replacements: {
          ...overview.terms_and_contact,
          organization_id,
        },
        transaction,
      }
    );
    results.terms_and_contact = terms_and_contact[0]; // Take only the first record
  }

  return results;
};
