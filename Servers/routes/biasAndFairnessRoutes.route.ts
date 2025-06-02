import { createProxyMiddleware } from "http-proxy-middleware";
import authenticateJWT from "../middleware/auth.middleware";

function biasAndFairnessRoutes() {
  const proxy = createProxyMiddleware({
    target: process.env.FAIRNESS_AND_BIAS_URL || 'http://127.0.0.1:8000',
    changeOrigin: true,
    pathRewrite: { '^/': '/bias_and_fairness/' }
  })

  return [authenticateJWT, proxy]
}

export default biasAndFairnessRoutes;
