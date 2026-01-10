import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ISSOConfiguration, SSOProvider } from "../domain.layer/interfaces/i.ssoConfig";
import { SSOConfigurationModel } from "../domain.layer/models/ssoConfig/ssoConfig.model";
import Jwt from "jsonwebtoken";

export const getSSOConfigQuery = async (
  provider: SSOProvider,
  tenant: string
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".sso_configurations WHERE provider = :provider`,
    {
      replacements: { provider },
    }
  ) as [SSOConfigurationModel[], number];
  return result[0][0];
}

export const getAzureADConfigQuery = async (
  tenant: string,
  transaction: Transaction | null = null
): Promise<{ client_id: string; client_secret: string; tenant_id: string }> => {
  const result = await sequelize.query(
    `SELECT config_data FROM "${tenant}".sso_configurations WHERE provider = 'AzureAD'`,
    {
      ...(transaction ? { transaction } : {}),
    }
  ) as [{ config_data: { client_id: string; client_secret: string; tenant_id: string } }[], number];
  if (result[0].length === 0) {
    throw new Error("SSO configuration not found for the given provider");
  }
  return result[0][0].config_data as { client_id: string; client_secret: string; tenant_id: string };
}

export const saveSSOConfigQuery = async (
  provider: SSOProvider,
  ssoConfigData: ISSOConfiguration["config_data"],
  tenant: string
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
    `INSERT INTO "${tenant}".sso_configurations (
      provider, config_data, created_at, updated_at
    ) VALUES (
      :provider, :config_data, NOW(), NOW()
    )
    ON CONFLICT (provider)
    DO UPDATE SET
      config_data = EXCLUDED.config_data,
      updated_at = NOW()
    RETURNING *`,
    {
      replacements: {
        provider,
        config_data: JSON.stringify(ssoConfigData),
      }
    }
  ) as [SSOConfigurationModel[], number];
  return result[0][0];
}

export const enableSSOQuery = async (
  provider: SSOProvider,
  tenant: string
): Promise<void> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".sso_configurations SET is_enabled = TRUE, updated_at = NOW()
     WHERE provider = :provider RETURNING *`,
    {
      replacements: { provider },
    }
  ) as [SSOConfigurationModel[], number];
  if (result[0].length === 0) {
    throw new Error("SSO configuration not found for the given provider");
  } else {
    return;
  }
}

export const disableSSOQuery = async (
  provider: SSOProvider,
  tenant: string
): Promise<void> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".sso_configurations SET is_enabled = FALSE, updated_at = NOW()
     WHERE provider = :provider RETURNING *`,
    {
      replacements: { provider },
    }
  ) as [SSOConfigurationModel[], number];
  if (result[0].length === 0) {
    throw new Error("SSO configuration not found for the given provider");
  } else {
    return;
  }
}
