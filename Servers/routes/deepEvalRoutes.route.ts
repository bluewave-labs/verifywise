import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import authenticateJWT from "../middleware/auth.middleware";
import { NextFunction, Request, Response } from "express";
import { EvaluationLlmApiKeyModel, LLMProvider, VALID_PROVIDERS } from "../domain.layer/models/evaluationLlmApiKey/evaluationLlmApiKey.model";

function addHeaders(req: Request, _res: Response, next: NextFunction) {
  req.headers["x-organization-id"] = req.organizationId?.toString();
  req.headers["x-user-id"] = req.userId?.toString();
  req.headers["x-role"] = req.role;
  req.headers["x-tenant-id"] = req.tenantId;
  next();
}

/**
 * Middleware to inject API key for custom scorers in experiment creation
 * This modifies req.body before the proxy forwards it
 */
async function injectScorerApiKey(req: Request, _res: Response, next: NextFunction) {
  // Only process POST requests to experiments endpoint
  if (req.method !== "POST" || !req.url.includes("/experiments")) {
    return next();
  }

  console.log(`[DeepEval Proxy] Processing experiment creation request`);
  console.log(`[DeepEval Proxy] Body config: ${JSON.stringify(req.body?.config ? { useCustomScorer: req.body.config.useCustomScorer, scorerId: req.body.config.scorerId } : 'no config')}`);

  try {
    const body = req.body;
    
    // Check if this is an experiment with a custom scorer
    if (body?.config?.useCustomScorer && !body?.config?.scorerApiKey) {
      const organizationId = req.organizationId;
      
      if (!organizationId) {
        console.log("[DeepEval Proxy] No organization ID for scorer API key lookup");
        return next();
      }

      // Try to determine the provider - default to OpenAI for now
      // TODO: In the future, fetch scorer config from EvalServer to get the actual provider
      const provider = "openai";
      
      console.log(`[DeepEval Proxy] Custom scorer detected, looking up ${provider} API key for org ${organizationId}`);
      
      if (VALID_PROVIDERS.includes(provider as LLMProvider)) {
        const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
          organizationId,
          provider as LLMProvider
        );
        
        if (apiKey) {
          console.log(`[DeepEval Proxy] ✅ Injecting ${provider} API key for custom scorer (key length: ${apiKey.length})`);
          req.body.config.scorerApiKey = apiKey;
        } else {
          console.log(`[DeepEval Proxy] ⚠️ No ${provider} API key found for organization ${organizationId}`);
        }
      }
    }
  } catch (error) {
    console.error("[DeepEval Proxy] Error injecting scorer API key:", error);
  }
  
  next();
}

function deepEvalRoutes() {
  const targetUrl =
    process.env.FAIRNESS_AND_BIAS_URL || "http://127.0.0.1:8000";
  console.log(`[DeepEval Proxy] Initializing proxy to target: ${targetUrl}`);

  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/deepeval/" },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `[DeepEval Proxy] Proxying ${req.method} ${req.url} -> ${targetUrl}${proxyReq.path}`
        );
        
        // Fix request body - this re-streams the parsed body to the proxy target
        // Required because body-parser consumed the original stream
        fixRequestBody(proxyReq, req as Request);
      },
      proxyRes: (proxyRes, req) => {
        console.log(
          `[DeepEval Proxy] Response for ${req.url}: ${proxyRes.statusCode}`
        );
      },
      error: (err, req, res) => {
        const errAny = err as any;
        console.error(
          `[DeepEval Proxy] Error for ${req.url}:`,
          errAny.message || errAny.code || errAny
        );
        if (res && "writeHead" in res) {
          (res as any).writeHead(502, { "Content-Type": "application/json" });
          (res as any).end(
            JSON.stringify({
              error: "Proxy error",
              message: errAny.message || errAny.code || "Unknown error",
            })
          );
        }
      },
    },
  });

  return [authenticateJWT, addHeaders, injectScorerApiKey, proxy];
}

export default deepEvalRoutes;
