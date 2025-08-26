import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IIntegrationConnection } from "../../interfaces/i.integration";

@Table({
  tableName: "integration_connections",
  timestamps: true,
})
export class IntegrationConnectionModel
  extends Model<IntegrationConnectionModel>
  implements IIntegrationConnection
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.ENUM('confluence'),
    allowNull: false,
  })
  integration_type!: 'confluence';

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  connection_name!: string;

  @Column({
    type: DataType.ENUM('connected', 'not_connected', 'error'),
    allowNull: false,
    defaultValue: 'not_connected',
  })
  status!: 'connected' | 'not_connected' | 'error';

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  configuration?: {
    site_url?: string;
    user_id?: string;
    user_email?: string;
    scopes?: string[];
    [key: string]: any;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  settings?: {
    oauth_client_id?: string;
    oauth_client_secret?: string;
    oauth_redirect_uri?: string;
    oauth_scopes?: string;
    custom_endpoints?: {
      auth_url?: string;
      token_url?: string;
      api_base_url?: string;
    };
    [key: string]: any;
  };

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  oauth_token?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  oauth_refresh_token?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  oauth_expires_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  connected_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_sync_at?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message?: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  created_by?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updated_at!: Date;

  // Utility methods
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public hasValidToken(): boolean {
    if (!this.oauth_token) return false;
    if (!this.oauth_expires_at) return true; // Assume non-expiring if no expiry set
    return new Date() < this.oauth_expires_at;
  }

  public markAsConnected(tokenData: {
    oauth_token: string;
    oauth_refresh_token?: string;
    oauth_expires_at?: Date;
    configuration?: any;
  }): void {
    this.status = 'connected';
    this.oauth_token = tokenData.oauth_token;
    this.oauth_refresh_token = tokenData.oauth_refresh_token;
    this.oauth_expires_at = tokenData.oauth_expires_at;
    this.connected_at = new Date();
    this.error_message = undefined;
    
    if (tokenData.configuration) {
      this.configuration = { ...this.configuration, ...tokenData.configuration };
    }
  }

  public markAsError(errorMessage: string): void {
    this.status = 'error';
    this.error_message = errorMessage;
  }

  public markAsDisconnected(): void {
    this.status = 'not_connected';
    this.oauth_token = undefined;
    this.oauth_refresh_token = undefined;
    this.oauth_expires_at = undefined;
    this.connected_at = undefined;
    this.error_message = undefined;
  }
}