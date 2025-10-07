import { Request, Response } from "express";
import { SSOProvider } from "../domain.layer/interfaces/i.ssoConfig";
import { disableSSOQuery, enableSSOQuery, getSSOConfigQuery, saveSSOConfigQuery } from "../utils/ssoConfig.utils";

export const getSSOConfigForOrg = async (req: Request, res: Response) => {
  try {
    // const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;

    const ssoConfig = await getSSOConfigQuery(provider);
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
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const saveSSOConfig = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;
    const ssoConfigData = req.body;

    const result = await saveSSOConfigQuery(organizationId, provider, ssoConfigData);
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

    await enableSSOQuery(organizationId, provider);
    return res.json({ message: "SSO enabled successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const disableSSO = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string, 10);
    const provider = req.query.provider as SSOProvider;

    await disableSSOQuery(organizationId, provider);
    return res.json({ message: "SSO disabled successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}