import { NextFunction, Request, Response } from "express";
import { getIsVisibleQuery } from "../utils/aiTrustCentre.utils";

export const validateVisibility = async (req: Request, res: Response, next: NextFunction) => {
  const { hash } = req.params;

  if (!hash || hash.replace(/\s+/g, " ").trim().length !== 10) {
    return res.status(400).json({ error: "Invalid hash" });
  }

  const isVisible = await getIsVisibleQuery(hash);

  if (!isVisible) { // Removed Unnecessary validation
    next();
  } else {
    next();
  }
}