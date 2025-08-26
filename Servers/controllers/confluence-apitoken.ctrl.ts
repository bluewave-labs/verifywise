import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { createOrUpdateIntegrationConnectionQuery } from "../utils/integration.utils";
import { sequelize } from "../database/db";
import { logFailure, logProcessing, logSuccess } from "../utils/logger/logHelper";

// Connect using API Token
export async function connectConfluenceWithToken(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  logProcessing({
    description: "connecting to Confluence with API token",
    functionName: "connectConfluenceWithToken",
    fileName: "confluence-apitoken.ctrl.ts",
  });

  try {
    let { api_token, confluence_email, confluence_domain } = req.body;

    if (!api_token || !confluence_email || !confluence_domain) {
      return res.status(400).json(STATUS_CODE[400]("Missing required fields: api_token, confluence_email, confluence_domain"));
    }

    // Clean up the domain - remove https:// or http:// if present
    confluence_domain = confluence_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    

    // Test the connection by making a simple API call
    const auth = Buffer.from(`${confluence_email}:${api_token}`).toString('base64');
    
    try {
      // Test API call to verify credentials
      const testResponse = await fetch(
        `https://${confluence_domain}/wiki/rest/api/space?limit=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          }
        }
      );

      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }

      // Get user info
      const userResponse = await fetch(
        `https://${confluence_domain}/wiki/rest/api/user/current`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          }
        }
      );

      if (!userResponse.ok) {
        throw new Error(`HTTP ${userResponse.status}: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();

      // Create/update integration connection
      const connectionData = {
        integration_type: 'confluence' as const,
        connection_name: `${confluence_domain} (${userData.displayName || confluence_email})`,
        status: 'connected' as const,
        configuration: {
          site_url: `https://${confluence_domain}`,
          site_name: confluence_domain,
          user_id: userData.accountId,
          user_email: userData.email || confluence_email,
          user_name: userData.displayName,
          auth_type: 'api_token',
        },
        settings: {
          auth_type: 'api_token',
          confluence_domain,
          confluence_email,
          api_token: '***masked***', // Don't store the actual token in settings
        },
        // Store encrypted token separately
        oauth_token: auth, // Using oauth_token field to store the base64 auth
        connected_at: new Date(),
        created_by: req.userId,
      };

      const connection = await createOrUpdateIntegrationConnectionQuery(
        connectionData,
        req.tenantId!,
        transaction
      );

      await transaction.commit();

      await logSuccess({
        eventType: "Create",
        description: `Connected to Confluence via API token: ${confluence_domain}`,
        functionName: "connectConfluenceWithToken",
        fileName: "confluence-apitoken.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200]({
        message: "Successfully connected to Confluence using API token",
        connection: {
          ...connection,
          oauth_token: undefined, // Don't expose the token
        }
      }));

    } catch (apiError: any) {
      console.error("Confluence API error:", {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        url: apiError.config?.url
      });
      
      if (apiError.code === 'ENOTFOUND') {
        throw new Error(`Domain not found: ${confluence_domain}. Please check the domain is correct (e.g., verifywise.atlassian.net)`);
      } else if (apiError.response?.status === 401) {
        throw new Error("Invalid credentials. Please check your email and API token.");
      } else if (apiError.response?.status === 404) {
        throw new Error("Confluence site not found. Please check your domain.");
      } else {
        throw new Error(`Failed to connect: ${apiError.response?.data?.message || apiError.message}`);
      }
    }

  } catch (error: any) {
    await transaction.rollback();
    
    await logFailure({
      eventType: "Create",
      description: `Failed to connect with API token: ${error.message}`,
      functionName: "connectConfluenceWithToken",
      fileName: "confluence-apitoken.ctrl.ts",
      error: error as Error,
    });

    return res.status(400).json(STATUS_CODE[400](error.message));
  }
}