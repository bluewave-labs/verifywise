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

    // 1. Inject API keys for custom scorers (scorer or both mode)
    // Frontend sends scorerProviders: ["mistral", "openai"] - only the providers actually needed
    if (body?.config?.useCustomScorer && body?.config?.scorerProviders) {
      const requestedProviders: string[] = body.config.scorerProviders;
      const scorerApiKeys: Record<string, string> = {};
      
      for (const provider of requestedProviders) {
        const normalizedProvider = provider.toLowerCase();
        if (VALID_PROVIDERS.includes(normalizedProvider as LLMProvider)) {
          try {
            const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
              organizationId,
              normalizedProvider as LLMProvider
            );
            if (apiKey) {
              scorerApiKeys[normalizedProvider] = apiKey;
            }
          } catch {
            // Skip providers without keys
          }
        }
      }
      
      if (Object.keys(scorerApiKeys).length > 0) {
        req.body.config.scorerApiKeys = scorerApiKeys;
        console.log(`[DeepEval Proxy] Injecting API keys for scorer providers: ${Object.keys(scorerApiKeys).join(", ")}`);
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

    // 3. Inject API key for the model being tested (if it's a cloud provider)
    if (body?.config?.model) {
      // accessMethod tells us the provider (openai, anthropic, google, etc.)
      const modelProvider = (body.config.model.provider || body.config.model.accessMethod || "").toLowerCase();
      const hasModelApiKey = body.config.model.apiKey && body.config.model.apiKey !== "***" && body.config.model.apiKey !== "";
      
      if (modelProvider && !hasModelApiKey && VALID_PROVIDERS.includes(modelProvider as LLMProvider)) {
        const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
          organizationId,
          modelProvider as LLMProvider
        );
        
        if (apiKey) {
          req.body.config.model.apiKey = apiKey;
          // Also set provider explicitly if only accessMethod was set
          if (!body.config.model.provider) {
            req.body.config.model.provider = modelProvider;
          }
        }
      }
    }

    // 4. Inject judge provider's key into scorerApiKeys for DeepEval metrics (G-Eval, etc.)
    // Only inject the specific key needed - the judge LLM provider
    if ((evaluationMode === "standard" || evaluationMode === "both") && body?.config?.judgeLlm?.provider) {
      const judgeProvider = body.config.judgeLlm.provider.toLowerCase();
      
      if (VALID_PROVIDERS.includes(judgeProvider as LLMProvider)) {
        // Initialize scorerApiKeys if not already set
        if (!req.body.config.scorerApiKeys) {
          req.body.config.scorerApiKeys = {};
        }
        
        // Only fetch if we don't already have this provider's key
        if (!req.body.config.scorerApiKeys[judgeProvider]) {
          try {
            const apiKey = await EvaluationLlmApiKeyModel.getDecryptedKey(
              organizationId,
              judgeProvider as LLMProvider
            );
            if (apiKey) {
              req.body.config.scorerApiKeys[judgeProvider] = apiKey;
            }
          } catch {
            // Skip if key not found
          }
        }
      }
    }
  } catch (error) {
    console.error("[DeepEval Proxy] Error in API key injection:", error);
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
