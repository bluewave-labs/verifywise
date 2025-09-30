import { NextFunction, Request, Response } from "express";
import { getTokenPayload } from "../utils/jwt.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getTenantHash } from "../tools/getTenantHash";
import { doesUserBelongsToOrganizationQuery, getUserByIdQuery } from "../utils/user.utils";
import { asyncLocalStorage } from '../utils/context/context';

const roleMap = new Map([
  [1, "Admin"],
  [2, "Reviewer"],
  [3, "Editor"],
  [4, "Auditor"],
])

const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  // Check for token in Authorization header (regular auth) or cookies (SSO auth)
  let token = req.headers.authorization?.split(" ")[1];
  let isFromCookie = false;

  // If no token in header, check httpOnly cookie (SSO authentication)
  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
    isFromCookie = true;
  }

  if (!token) {
    return res.status(400).json(
      STATUS_CODE[400]({
        message: "Token not found",
      })
    );
  }

  try {
    const decoded = getTokenPayload(token);

    if (!decoded)
      return res.status(401).json(
        STATUS_CODE[401]({
          message: "Unauthorized **",
        })
      );

    if (decoded.expire < Date.now())
      return res
        .status(406)
        .json(STATUS_CODE[406]({ message: "Token expired" }));

    if (
      !decoded.id ||
      typeof decoded.id !== 'number' ||
      decoded.id <= 0 ||
      !decoded.roleName ||
      typeof decoded.roleName !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const belongs = await doesUserBelongsToOrganizationQuery(decoded.id, decoded.organizationId);
    if (!belongs.belongs) {
      return res.status(403).json({ message: 'User does not belong to this organization' });
    }

    const user = await getUserByIdQuery(decoded.id)
    if (decoded.roleName !== roleMap.get(user.role_id)) {
      return res.status(403).json({ message: 'Not allowed to access' });
    }

    if (decoded.tenantId !== getTenantHash(decoded.organizationId)) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    req.userId = decoded.id;
    req.role = decoded.roleName;
    req.tenantId = decoded.tenantId;
    req.organizationId = decoded.organizationId;
    req.ssoEnabled = decoded.ssoEnabled || false;

    // Initialize AsyncLocalStorage context here
    asyncLocalStorage.run({ userId: decoded.id }, () => {
      next();
    });
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export default authenticateJWT;
