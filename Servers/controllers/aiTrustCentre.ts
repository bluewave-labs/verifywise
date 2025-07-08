import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { createAITrustCentreOverviewQuery, getAITrustCentreOverviewQuery, updateAITrustCentreOverviewQuery } from "../utils/aiTrustCentre.utils";

export async function createAITrustCentreOverview(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const overviewData = req.body;
    const result = await createAITrustCentreOverviewQuery(overviewData, transaction);

    if (result) {
      await transaction.commit();
      return res.status(201).json(
        STATUS_CODE[201]({
          message: "AI Trust Centre overview created successfully",
        })
      );
    }

    await transaction.rollback();
    return res.status(503).json(
      STATUS_CODE[503]({
        message: "Failed to create AI Trust Centre overview",
      })
    );
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentreOverview(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const organizationId = 1; // Default organization ID
    const result = await getAITrustCentreOverviewQuery(organizationId);

    if (result) {
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre overview retrieved successfully",
          data: result,
        })
      );
    }

    return res.status(404).json(
      STATUS_CODE[404]({
        message: "AI Trust Centre overview not found",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustCentreOverview(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const overviewData = req.body;
    console.log('Updating AI Trust Centre overview with data:', overviewData);
    
    // Validation logic in controller layer
    if (!overviewData) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Request body is required",
        })
      );
    }

    // Validate intro section
    if (overviewData.intro) {
      if (typeof overviewData.intro.intro_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "intro.intro_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.intro.purpose_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "intro.purpose_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.intro.our_statement_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "intro.our_statement_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.intro.our_mission_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "intro.our_mission_visible must be a boolean",
          })
        );
      }
    }

    // Validate compliance badges section
    if (overviewData.compliance_badges) {
      if (typeof overviewData.compliance_badges.badges_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "compliance_badges.badges_visible must be a boolean",
          })
        );
      }
      const badgeFields = ['SOC2_Type_I', 'SOC2_Type_II', 'ISO_27001', 'ISO_42001', 'CCPA', 'GDPR', 'HIPAA', 'EU_AI_Act'];
      for (const field of badgeFields) {
        if (overviewData.compliance_badges[field] !== undefined && typeof overviewData.compliance_badges[field] !== 'boolean') {
          await transaction.rollback();
          return res.status(400).json(
            STATUS_CODE[400]({
              message: `compliance_badges.${field} must be a boolean`,
            })
          );
        }
      }
    }

    // Validate company info section
    if (overviewData.company_info) {
      if (typeof overviewData.company_info.company_info_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "company_info.company_info_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.company_info.background_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "company_info.background_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.company_info.core_benefit_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "company_info.core_benefit_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.company_info.compliance_doc_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "company_info.compliance_doc_visible must be a boolean",
          })
        );
      }
    }

    // Validate terms and contact section
    if (overviewData.terms_and_contact) {
      if (typeof overviewData.terms_and_contact.is_visible !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "terms_and_contact.is_visible must be a boolean",
          })
        );
      }
      if (typeof overviewData.terms_and_contact.has_terms_of_service !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "terms_and_contact.has_terms_of_service must be a boolean",
          })
        );
      }
      if (typeof overviewData.terms_and_contact.has_privacy_policy !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "terms_and_contact.has_privacy_policy must be a boolean",
          })
        );
      }
      if (typeof overviewData.terms_and_contact.has_company_email !== 'boolean') {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "terms_and_contact.has_company_email must be a boolean",
          })
        );
      }
    }

    const result = await updateAITrustCentreOverviewQuery(overviewData, transaction);

    if (result) {
      await transaction.commit();
      console.log('AI Trust Centre overview updated successfully:', result);
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre overview updated successfully",
          data: result,
        })
      );
    }

    await transaction.rollback();
    return res.status(503).json(
      STATUS_CODE[503]({
        message: "Failed to update AI Trust Centre overview",
      })
    );
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}