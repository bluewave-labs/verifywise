import { NextFunction, Request, Response } from "express";
import { getTokenPayload } from "../utils/jwt.util";
import { STATUS_CODE } from "../utils/statusCode.utils";

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
          message: "Unauthorized",
        })
      );

    if (decoded.expire < Date.now())
      return res
        .status(406)
        .json(STATUS_CODE[406]({ message: "Token expired" }));

    next();
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export default authenticateJWT;
