import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { IntegrationConnectionModel } from "../domain.layer/models/integration/integration.model";
import { IIntegrationConnection, IIntegrationOverview } from "../domain.layer/interfaces/i.integration";

// Get all integrations overview (both configured and available)
export const getAllIntegrationsQuery = async (
  tenant: string
): Promise<IIntegrationOverview[]> => {
  // Get existing connections from database
  const connections = await sequelize.query(
    `SELECT * FROM "${tenant}".integration_connections ORDER BY integration_type, connection_name`,
    {
      mapToModel: true,
      model: IntegrationConnectionModel,
    }
  );

  // Define available integrations (this could come from a config file in the future)
  const availableIntegrations = [
    {
      integration_type: 'confluence' as const,
      name: 'Confluence',
      description: 'Connect to Atlassian Confluence for documentation and knowledge management',
      icon: '/assets/icons/confluence.svg',
    },
  ];

  // Map to overview format
  const integrationsOverview: IIntegrationOverview[] = availableIntegrations.map(integration => {
    const connection = connections.find(conn => conn.integration_type === integration.integration_type);
    
    return {
      integration_type: integration.integration_type,
      name: integration.name,
      description: integration.description,
      icon: integration.icon,
      status: connection ? connection.status : 'not_connected',
      connection: connection ? connection.toJSON() as IIntegrationConnection : undefined,
    };
  });

  return integrationsOverview;
};

// Get specific integration connection
export const getIntegrationConnectionQuery = async (
  integrationType: 'confluence',
  tenant: string
): Promise<IIntegrationConnection | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".integration_connections WHERE integration_type = :integrationType LIMIT 1`,
    {
      replacements: { integrationType },
      mapToModel: true,
      model: IntegrationConnectionModel,
    }
  );

  return result.length > 0 ? result[0].toJSON() as IIntegrationConnection : null;
};

// Create or update integration connection
export const createOrUpdateIntegrationConnectionQuery = async (
  connectionData: Partial<IIntegrationConnection>,
  tenant: string,
  transaction?: Transaction
): Promise<IIntegrationConnection> => {
  const existingConnection = await sequelize.query(
    `SELECT * FROM "${tenant}".integration_connections WHERE integration_type = :integrationType LIMIT 1`,
    {
      replacements: { integrationType: connectionData.integration_type },
      mapToModel: true,
      model: IntegrationConnectionModel,
      transaction,
    }
  );

  if (existingConnection.length > 0) {
    // Update existing connection
    const updateFields = [
      'status',
      'configuration',
      'settings',
      'oauth_token', 
      'oauth_refresh_token',
      'oauth_expires_at',
      'connected_at',
      'last_sync_at',
      'error_message',
    ]
      .filter(field => connectionData[field as keyof IIntegrationConnection] !== undefined)
      .map(field => `${field} = :${field}`)
      .join(', ');

    if (updateFields) {
      const result = await sequelize.query(
        `UPDATE "${tenant}".integration_connections SET ${updateFields} WHERE integration_type = :integrationType RETURNING *`,
        {
          replacements: { 
            integrationType: connectionData.integration_type,
            ...connectionData,
            configuration: connectionData.configuration ? JSON.stringify(connectionData.configuration) : null,
            settings: connectionData.settings ? JSON.stringify(connectionData.settings) : null
          },
          mapToModel: true,
          model: IntegrationConnectionModel,
          transaction,
        }
      );
      return result[0].toJSON() as IIntegrationConnection;
    } else {
      return existingConnection[0].toJSON() as IIntegrationConnection;
    }
  } else {
    // Create new connection
    const result = await sequelize.query(
      `INSERT INTO "${tenant}".integration_connections 
       (integration_type, connection_name, status, configuration, settings, oauth_token, oauth_refresh_token, oauth_expires_at, connected_at, error_message, created_by)
       VALUES (:integration_type, :connection_name, :status, :configuration, :settings, :oauth_token, :oauth_refresh_token, :oauth_expires_at, :connected_at, :error_message, :created_by)
       RETURNING *`,
      {
        replacements: {
          integration_type: connectionData.integration_type,
          connection_name: connectionData.connection_name || connectionData.integration_type,
          status: connectionData.status || 'not_connected',
          configuration: connectionData.configuration ? JSON.stringify(connectionData.configuration) : null,
          settings: connectionData.settings ? JSON.stringify(connectionData.settings) : null,
          oauth_token: connectionData.oauth_token || null,
          oauth_refresh_token: connectionData.oauth_refresh_token || null,
          oauth_expires_at: connectionData.oauth_expires_at || null,
          connected_at: connectionData.connected_at || null,
          error_message: connectionData.error_message || null,
          created_by: connectionData.created_by || null,
        },
        mapToModel: true,
        model: IntegrationConnectionModel,
        transaction,
      }
    );
    return result[0].toJSON() as IIntegrationConnection;
  }
};

// Delete integration connection
export const deleteIntegrationConnectionQuery = async (
  integrationType: 'confluence',
  tenant: string,
  transaction?: Transaction
): Promise<boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".integration_connections WHERE integration_type = :integrationType RETURNING id`,
    {
      replacements: { integrationType },
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return Array.isArray(result) && result.length > 0;
};
// Get integration settings for a specific integration type
export const getIntegrationSettingsQuery = async (
  tenant: string,
  integrationType: string
): Promise<any> => {
  const result = await sequelize.query(
    `SELECT settings FROM "${tenant}".integration_connections WHERE integration_type = :integrationType LIMIT 1`,
    {
      replacements: { integrationType },
      type: QueryTypes.SELECT,
    }
  );
  return result.length > 0 ? (result[0] as any).settings : null;
};

// Update integration settings for a specific integration type
export const updateIntegrationSettingsQuery = async (
  tenant: string,
  integrationType: string,
  settings: any,
  transaction?: any
): Promise<any> => {
  
  // First try to update existing connection
  const updateResult = await sequelize.query(
    `UPDATE "${tenant}".integration_connections 
     SET settings = :settings, updated_at = CURRENT_TIMESTAMP
     WHERE integration_type = :integrationType 
     RETURNING settings`,
    {
      replacements: { integrationType, settings: JSON.stringify(settings) },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  
  if (updateResult[1] > 0) {
    // Return updated settings
    return settings;
  } else {
    // Create new connection entry with just settings
    const insertResult = await sequelize.query(
      `INSERT INTO "${tenant}".integration_connections 
       (integration_type, connection_name, status, settings)
       VALUES (:integration_type, :connection_name, 'not_connected', :settings)
       RETURNING settings`,
      {
        replacements: { 
          integration_type: integrationType,
          connection_name: `${integrationType} Settings`,
          settings: JSON.stringify(settings)
        },
        type: QueryTypes.INSERT,
        transaction,
      }
    );
    return settings;
  }
};
