import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ISlackWebhook } from "../../interfaces/i.slackWebhook";
import { UserModel } from "../user/user.model";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  NotFoundException,
} from "../../exceptions/custom.exception";
import { decryptText, encryptText } from "../../../tools/createSecureValue";

@Table({
  tableName: "slack_webhooks",
})
export class SlackWebhookModel
  extends Model<SlackWebhookModel>
  implements ISlackWebhook
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
  })
  access_token!: any;

  @Column({
    type: DataType.STRING,
  })
  access_token_iv?: string;

  @Column({
    type: DataType.STRING,
  })
  scope!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  user_id?: number;

  @Column({
    type: DataType.STRING,
  })
  team_name!: string;

  @Column({
    type: DataType.STRING,
  })
  team_id!: string;

  @Column({
    type: DataType.STRING,
  })
  channel!: string;

  @Column({
    type: DataType.STRING,
  })
  channel_id!: string;

  @Column({
    type: DataType.STRING,
  })
  configuration_url!: string;

  @Column({
    type: DataType.STRING,
  })
  url!: string;

  @Column({
    type: DataType.STRING,
  })
  url_iv?: string;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.BOOLEAN,
  })
  is_active?: boolean;

  @Column({
    type: DataType.STRING,
  })
  iv?: string;

  /**
   * Create a new slack webhook with comprehensive validation
   */
  static async createNewSlackWebhook(
    access_token: string,
    scope: string,
    team_name: string,
    team_id: string,
    channel: string,
    channel_id: string,
    configuration_url: string,
    url: string,
    user_id?: number,
    is_active: boolean = true,
  ): Promise<SlackWebhookModel> {
    // Validate required fields
    if (!access_token || access_token.trim().length === 0) {
      throw new ValidationException(
        "Access Token is required",
        "access_token",
        access_token,
      );
    }

    if (!scope || scope.trim().length === 0) {
      throw new ValidationException("Slack scope is required", "scope", scope);
    }

    if (!team_id || team_id.trim().length === 0) {
      throw new ValidationException("Team ID is required", "team_id", team_id);
    }

    if (!team_name || team_name.trim().length === 0) {
      throw new ValidationException(
        "Team Name is required",
        "team_name",
        team_name,
      );
    }

    if (!channel || channel.trim().length === 0) {
      throw new ValidationException(
        "Slack Channel is required",
        "channel",
        channel,
      );
    }

    // Validate user if provided
    if (user_id !== undefined && !numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid User ID is required (must be >= 1)",
        "user_id",
        user_id,
      );
    }

    if (!channel_id || channel_id.trim().length === 0) {
      throw new ValidationException(
        "Slack Channel ID is required",
        "channel_id",
        channel_id,
      );
    }

    if (!configuration_url || configuration_url.trim().length === 0) {
      throw new ValidationException(
        "Configuration URL is required",
        "configuration_url",
        configuration_url,
      );
    }

    if (!url || url.trim().length === 0) {
      throw new ValidationException("Slack URL is required", "url", url);
    }

    const { iv: accessTokeniv, value: accessToken } = encryptText(
      access_token.trim(),
    );
    const { iv: ivUrl, value: encryptedUrl } = encryptText(url.trim());

    // Create and return the slackwebhook model instance
    const slackWebHook = new SlackWebhookModel();
    slackWebHook.access_token = accessToken;
    slackWebHook.access_token_iv = accessTokeniv;
    slackWebHook.scope = scope.trim();
    slackWebHook.user_id = user_id;
    slackWebHook.team_name = team_name.trim();
    slackWebHook.team_id = team_id.trim();
    slackWebHook.channel = channel.trim();
    slackWebHook.channel_id = channel_id.trim();
    slackWebHook.configuration_url = configuration_url.trim();
    slackWebHook.url = encryptedUrl;
    slackWebHook.url_iv = ivUrl;
    slackWebHook.created_at = new Date();
    slackWebHook.is_active = is_active;

    return slackWebHook;
  }

  /**
   * Update slack webhook information with validation
   */
  async updateSlackWebhook(updateData: {
    access_token: string;
    scope: string;
    team_name: string;
    team_id: string;
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
    user_id?: number;
    created_at?: Date;
    is_active?: boolean;
  }): Promise<void> {
    if (updateData.access_token !== undefined) {
      if (
        !updateData.access_token ||
        updateData.access_token.trim().length === 0
      ) {
        throw new ValidationException(
          "Access Token is required",
          "access_token",
          updateData.access_token,
        );
      }
      const { iv: accessTokeniv, value: accessToken } = encryptText(
        updateData.access_token.trim(),
      );
      this.access_token = accessToken;
      this.access_token_iv = accessTokeniv;
    }

    if (updateData.scope !== undefined) {
      if (!updateData.scope || updateData.scope.trim().length === 0) {
        throw new ValidationException(
          "Scope is required",
          "scope",
          updateData.scope,
        );
      }
      this.scope = updateData.scope.trim();
    }

    if (updateData.team_id !== undefined) {
      if (!updateData.team_id || updateData.team_id.trim().length === 0) {
        throw new ValidationException(
          "Team ID is required",
          "team_id",
          updateData.team_id,
        );
      }
      this.team_id = updateData.team_id.trim();
    }

    if (updateData.team_name !== undefined) {
      if (!updateData.team_name || updateData.team_name.trim().length === 0) {
        throw new ValidationException(
          "Team Name is required",
          "team_name",
          updateData.team_name,
        );
      }
      this.team_name = updateData.team_name.trim();
    }

    if (updateData.channel !== undefined) {
      if (!updateData.channel || updateData.channel.trim().length === 0) {
        throw new ValidationException(
          "Channel is required",
          "channel",
          updateData.channel,
        );
      }
      this.channel = updateData.channel.trim();
    }

    if (updateData.channel_id !== undefined) {
      if (!updateData.channel_id || updateData.channel_id.trim().length === 0) {
        throw new ValidationException(
          "Channel Id is required",
          "channel_id",
          updateData.channel_id,
        );
      }
      this.channel_id = updateData.channel_id.trim();
    }

    if (updateData.configuration_url !== undefined) {
      if (
        !updateData.configuration_url ||
        updateData.configuration_url.trim().length === 0
      ) {
        throw new ValidationException(
          "Configuration Url is required",
          "configuration_url",
          updateData.configuration_url,
        );
      }
      this.configuration_url = updateData.configuration_url.trim();
    }

    if (updateData.url !== undefined) {
      if (!updateData.url || updateData.url.trim().length === 0) {
        throw new ValidationException("URL is required", "url", updateData.url);
      }
      const { iv: ivUrl, value: urlValue } = encryptText(updateData.url.trim());
      this.url = urlValue;
      this.url_iv = ivUrl;
    }

    if (updateData.user_id !== undefined) {
      if (!numberValidation(updateData.user_id, 1)) {
        throw new ValidationException(
          "Valid User is required (must be >= 1)",
          "user_id",
          updateData.user_id,
        );
      }
      this.user_id = updateData.user_id;
    }

    if (updateData.created_at !== undefined) {
      this.created_at = updateData.created_at;
    }
    if (updateData.is_active !== undefined) {
      this.is_active = updateData.is_active;
    }
  }

  /**
   * Validate data before saving
   */
  async validateSlackWebhookData(): Promise<void> {
    if (!this.access_token || this.access_token.trim().length === 0) {
      throw new ValidationException(
        "Access Token is required",
        "access_token",
        this.access_token,
      );
    }

    if (!this.scope || this.scope.trim().length === 0) {
      throw new ValidationException(
        "Slack scope is required",
        "scope",
        this.scope,
      );
    }

    if (!this.team_id || this.team_id.trim().length === 0) {
      throw new ValidationException(
        "Team ID is required",
        "team_id",
        this.team_id,
      );
    }

    if (!this.team_name || this.team_name.trim().length === 0) {
      throw new ValidationException(
        "Team Name is required",
        "team_name",
        this.team_name,
      );
    }

    if (!this.channel || this.channel.trim().length === 0) {
      throw new ValidationException(
        "Slack Channel is required",
        "channel",
        this.channel,
      );
    }

    // Validate user if provided
    if (this.user_id !== undefined && !numberValidation(this.user_id, 1)) {
      throw new ValidationException(
        "Valid User ID is required (must be >= 1)",
        "user_id",
        this.user_id,
      );
    }

    if (!this.channel_id || this.channel_id.trim().length === 0) {
      throw new ValidationException(
        "Slack Channel ID is required",
        "channel_id",
        this.channel_id,
      );
    }

    if (!this.configuration_url || this.configuration_url.trim().length === 0) {
      throw new ValidationException(
        "Configuration URL is required",
        "configuration_url",
        this.configuration_url,
      );
    }

    if (!this.url || this.url.trim().length === 0) {
      throw new ValidationException("Slack URL is required", "url", this.url);
    }
  }

  /**
   * Get Slack Webhook URL
   */
  getSlackWebhookUrl(): string {
    return decryptText({ iv: this.url_iv || "", value: this.url }).data || "";
  }

  /**
   * Convert slack webhook model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      access_token: this.access_token,
      scope: this.scope,
      user_id: this.user_id,
      team_name: this.team_name,
      team_id: this.team_id,
      channel: this.channel,
      channel_id: this.channel_id,
      configuration_url: this.configuration_url,
      url: this.url,
      created_at: this.created_at,
      is_active: this.is_active,
    };
  }

  /**
   * Create SlackWebhookModel instance from JSON data
   */
  static fromJSON(json: any): SlackWebhookModel {
    return new SlackWebhookModel(json);
  }

  /**
   * Static method to find webhook by ID with validation
   */
  static async findByIdWithValidation(id: number): Promise<SlackWebhookModel> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id,
      );
    }

    const slackWebhook = await SlackWebhookModel.findByPk(id);
    if (!slackWebhook) {
      throw new NotFoundException(
        "Slack Webhook not found",
        "slackWebhook",
        id,
      );
    }

    return slackWebhook;
  }

  /**
   * Static method to update SlackWebhook by ID
   */
  static async updateSlackWebhookById(
    id: number,
    updateData: Partial<ISlackWebhook>,
  ): Promise<[number, SlackWebhookModel[]]> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id,
      );
    }

    return await SlackWebhookModel.update(updateData, {
      where: { id },
      returning: true,
    });
  }
}
