import { Request, Response } from "express";
import { SSOProvider } from "../domain.layer/interfaces/i.ssoConfig";
import { disableSSOQuery, enableSSOQuery, getSSOConfigQuery, saveSSOConfigQuery } from "../utils/ssoConfig.utils";
import { getTenantHash } from "../tools/getTenantHash";

export const getSSOConfigForOrg = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;
    const tenant = getTenantHash(organizationId);

    const ssoConfig = await getSSOConfigQuery(provider, tenant);
    if (!ssoConfig) {
      return res.status(404).json({ error: "SSO configuration not found" });
    }
    return res.status(200).json({
      ...ssoConfig,
      config_data: {
        ...(ssoConfig.config_data as {
          client_id: string;
          client_secret: string;
          tenant_id: string;
        }),
        client_secret: "********",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const saveSSOConfig = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;
    const ssoConfigData = req.body;
    const tenant = getTenantHash(organizationId);

    const result = await saveSSOConfigQuery(provider, ssoConfigData, tenant);
    return res.status(201).json({
      ...result,
      config_data: {
        ...(result.config_data as {
          client_id: string;
          client_secret: string;
          tenant_id: string;
        }),
        client_secret: "********",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const enableSSO = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;
    const tenant = getTenantHash(organizationId);

    await enableSSOQuery(provider, tenant);
    return res.json({ message: "SSO enabled successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const disableSSO = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;
    const tenant = getTenantHash(organizationId);

    await disableSSOQuery(provider, tenant);
    return res.json({ message: "SSO disabled successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Check SSO status for an organization (public endpoint for login page)
 * Returns SSO configuration status for a specific organization
 */
export const checkSSOStatusByOrgId = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;

    if (!organizationId || isNaN(organizationId)) {
      return res.status(400).json({ error: "Invalid organization ID" });
    }

    const tenant = getTenantHash(organizationId);
    const ssoConfig = await getSSOConfigQuery(provider, tenant);

    if (!ssoConfig) {
      return res.status(200).json({
        isEnabled: false,
        hasConfig: false,
      });
    }

    return res.status(200).json({
      isEnabled: ssoConfig.is_enabled || false,
      hasConfig: true,
      tenantId: (ssoConfig.config_data as any)?.tenant_id,
      clientId: (ssoConfig.config_data as any)?.client_id,
    });
  } catch (error) {
    console.error('Error checking SSO status:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
