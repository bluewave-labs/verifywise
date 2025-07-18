import { NextFunction, Request, Response } from "express";
import { getTokenPayload } from "../utils/jwt.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getTenantHash } from "../tools/getTenantHash";
import { doesUserBelongsToOrganizationQuery } from "../utils/user.utils";
import { asyncLocalStorage } from '../utils/context/context';

const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const token = req.headers.authorization?.split(" ")[1];

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

    if (decoded.tenantId !== getTenantHash(decoded.organizationId)) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    req.userId = decoded.id;
    req.role = decoded.roleName;
    req.tenantId = decoded.tenantId;
    req.organizationId = decoded.organizationId;

    // Initialize AsyncLocalStorage context here
    asyncLocalStorage.run({ userId: decoded.id }, () => {
      next();
    });
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export default authenticateJWT;
