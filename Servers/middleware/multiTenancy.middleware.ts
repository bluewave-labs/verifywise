import { NextFunction, Request, Response } from "express";
import { getOrganizationsExists } from "../controllers/organization.ctrl";
import { getOrganizationsExistsQuery } from "../utils/organization.utils";

export const checkMultiTenancy = async (req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin || req.headers.host;
  const organizationExists = await getOrganizationsExistsQuery();
  if (
    (
      process.env.MULTI_TENANCY_ENABLED === "true" &&
      requestOrigin === "app.verifywise.ai"
    ) || !organizationExists.exists
  ) {
    next();
  } else {
    return res.status(403).json({
      message: "Multi-tenancy is not enabled on this server.",
    });
  }
}
