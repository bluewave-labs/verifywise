import { createProxyMiddleware } from "http-proxy-middleware";
import authenticateJWT from "../middleware/auth.middleware";
import { NextFunction, Request, Response } from "express";

function addHeaders(req: Request, res: Response, next: NextFunction) {
  req.headers['x-organization-id'] = req.organizationId?.toString();
  req.headers['x-user-id'] = req.userId?.toString();
  req.headers['x-role'] = req.role;
  req.headers['x-tenant-id'] = req.tenantId;
  next();
}

function deepEvalRoutes() {
  const targetUrl = process.env.FAIRNESS_AND_BIAS_URL || 'http://127.0.0.1:8000';
  console.log(`[DeepEval Proxy] Initializing proxy to target: ${targetUrl}`);

  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { '^/': '/deepeval/' },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[DeepEval Proxy] Proxying ${req.method} ${req.url} -> ${targetUrl}${proxyReq.path}`);
      },
      proxyRes: (proxyRes, req) => {
        console.log(`[DeepEval Proxy] Response for ${req.url}: ${proxyRes.statusCode}`);
      },
      error: (err, req, res) => {
        const errAny = err as any;
        console.error(`[DeepEval Proxy] Error for ${req.url}:`, errAny.message || errAny.code || errAny);
        if (res && 'writeHead' in res) {
          (res as any).writeHead(502, { 'Content-Type': 'application/json' });
          (res as any).end(JSON.stringify({ error: 'Proxy error', message: errAny.message || errAny.code || 'Unknown error' }));
        }
      }
    }
  })

  return [authenticateJWT, addHeaders, proxy]
}

export default deepEvalRoutes;

