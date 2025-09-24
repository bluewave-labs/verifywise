import { createProxyMiddleware, Options } from "http-proxy-middleware";
import authenticateJWT from "../middleware/auth.middleware";
import { NextFunction, Request, Response } from "express";

function addHeaders(req: Request, res: Response, next: NextFunction) {
  req.headers['x-organization-id'] = req.organizationId?.toString();
  req.headers['x-user-id'] = req.userId?.toString();
  req.headers['x-role'] = req.role;
  req.headers['x-tenant-id'] = req.tenantId;
  next();
}

function biasAndFairnessRoutes() {
  const proxy = createProxyMiddleware({
    target: process.env.FAIRNESS_AND_BIAS_URL || 'http://127.0.0.1:8000',
    changeOrigin: true,
    pathRewrite: { '^/': '/bias_and_fairness/' }
    //pathRewrite: { '^/api/bias_and_fairness': '/bias_and_fairness' }
  })

  return [authenticateJWT, addHeaders, proxy]
}

export default biasAndFairnessRoutes;
