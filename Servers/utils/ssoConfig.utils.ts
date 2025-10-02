import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ISSOConfiguration, SSOProvider } from "../domain.layer/interfaces/i.ssoConfig";
import { SSOConfigurationModel } from "../domain.layer/models/ssoConfig/ssoConfig.model";
import Jwt from "jsonwebtoken";

export const getSSOConfigQuery = async (organizationId: number, provider: SSOProvider) => {
  const result = await sequelize.query(
    `SELECT * FROM sso_configurations WHERE organization_id = :organizationId AND provider = :provider`,
    {
      replacements: { organizationId, provider },
    }
  ) as [SSOConfigurationModel[], number];
  return result[0][0];
}

export const saveSSOConfigQuery = async (
  organizationId: number,
  provider: SSOProvider,
  ssoConfigData: ISSOConfiguration["config_data"],
  // transaction: Transaction
): Promise<SSOConfigurationModel> => {
  let encryptedSecret = "";
  if (provider === "AzureAD") {
    encryptedSecret = Jwt.sign((ssoConfigData as {
      client_id: string;
      client_secret: string;
      tenant_id: string;
    }).client_secret, process.env.SSO_SECRET as string);
    ssoConfigData = {
      ...(ssoConfigData as {
        client_id: string;
        client_secret: string;
        tenant_id: string;
      }),
      client_secret: encryptedSecret,
    };
  } else {
    throw new Error("Unsupported SSO provider");
  }
  const result = await sequelize.query(
    `INSERT INTO sso_configurations (
      organization_id, provider, config_data, created_at, updated_at
    ) VALUES (
      :organizationId, :provider, :config_data, NOW(), NOW()
    )
    ON CONFLICT (organization_id, provider) 
    DO UPDATE SET
      config_data = EXCLUDED.config_data,
      updated_at = NOW()
    RETURNING *`,
    {
      replacements: {
        organizationId,
        provider,
        config_data: JSON.stringify(ssoConfigData),
      }
    }
  ) as [SSOConfigurationModel[], number];
  return result[0][0];
}

export const enableSSOQuery = async (
  organizationId: number,
  provider: SSOProvider
): Promise<void> => {
  const result = await sequelize.query(
    `UPDATE sso_configurations SET is_enabled = TRUE, updated_at = NOW()
     WHERE organization_id = :organizationId AND provider = :provider RETURNING *`,
    {
      replacements: { organizationId, provider },
    }
  ) as [SSOConfigurationModel[], number];
  if (result[0].length === 0) {
    throw new Error("SSO configuration not found for the given organization and provider");
  } else {
    return;
  }
}

export const disableSSOQuery = async (
  organizationId: number,
  provider: SSOProvider
): Promise<void> => {
  const result = await sequelize.query(
    `UPDATE sso_configurations SET is_enabled = FALSE, updated_at = NOW()
     WHERE organization_id = :organizationId AND provider = :provider RETURNING *`,
    {
      replacements: { organizationId, provider },
    }
  ) as [SSOConfigurationModel[], number];
  if (result[0].length === 0) {
    throw new Error("SSO configuration not found for the given organization and provider");
  } else {
    return;
  }
}
