import { NextFunction, Request, Response } from "express";
import { getTokenPayload } from "../utils/jwt.util";

const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = getTokenPayload(token);

    if (!decoded) return res.status(403).json({ message: "Not authorized" });

    if (decoded.expire < Date.now())
      return res.status(401).json({ message: "Token expired" });

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export default authenticateJWT;
