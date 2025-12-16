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
 * Middleware to inject API keys for experiment creation
 * Handles both custom scorers and standard judge LLM
 * This modifies req.body before the proxy forwards it
 */
async function injectApiKeys(req: Request, _res: Response, next: NextFunction) {
  // Only process POST requests to experiments endpoint
  if (req.method !== "POST" || !req.url.includes("/experiments")) {
    return next();
  }

  const evaluationMode = req.body?.config?.evaluationMode || "standard";

  try {
    const body = req.body;
    const organizationId = req.organizationId;
    
    if (!organizationId) {
      return next();
    }

    // 1. Inject API key for custom scorers (scorer or both mode)
    if (body?.config?.useCustomScorer && !body?.config?.scorerApiKey) {
      // Try to determine the provider - default to OpenAI for now
      // TODO: In the future, fetch scorer config from EvalServer to get the actual provider
      const provider = "openai";
      
      if (VALID_PROVIDERS.includes(provider as LLMProvider)) {
        const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
          organizationId,
          provider as LLMProvider
        );
        
        if (apiKey) {
          req.body.config.scorerApiKey = apiKey;
        }
      }
    }

    // 2. Inject API key for standard judge LLM (standard or both mode)
    if ((evaluationMode === "standard" || evaluationMode === "both") && body?.config?.judgeLlm) {
      const judgeProvider = body.config.judgeLlm.provider?.toLowerCase();
      const hasJudgeApiKey = body.config.judgeLlm.apiKey && body.config.judgeLlm.apiKey !== "***" && body.config.judgeLlm.apiKey !== "";
      
      if (judgeProvider && !hasJudgeApiKey && VALID_PROVIDERS.includes(judgeProvider as LLMProvider)) {
        const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
          organizationId,
          judgeProvider as LLMProvider
        );
        
        if (apiKey) {
          req.body.config.judgeLlm.apiKey = apiKey;
        }
      }
    }
  } catch (error) {
    console.error("[DeepEval Proxy] Error in API key injection");
  }
  
  next();
}

function deepEvalRoutes() {
  const targetUrl =
    process.env.FAIRNESS_AND_BIAS_URL || "http://127.0.0.1:8000";

  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { "^/": "/deepeval/" },
    on: {
      proxyReq: (proxyReq, req) => {
        // Fix request body - this re-streams the parsed body to the proxy target
        // Required because body-parser consumed the original stream
        fixRequestBody(proxyReq, req as Request);
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

  return [authenticateJWT, addHeaders, injectApiKeys, proxy];
}

export default deepEvalRoutes;
