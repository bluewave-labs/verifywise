import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

interface AIHealthAlertAttributes {
  id: number;
  systemHealthId: number;
  alertType: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'dismissed';
  organizationId?: number;
  projectId?: number;
  metadata?: object;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AIHealthAlertCreationAttributes
  extends Optional<AIHealthAlertAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class AIHealthAlert
  extends Model<AIHealthAlertAttributes, AIHealthAlertCreationAttributes>
  implements AIHealthAlertAttributes
{
  public id!: number;
  public systemHealthId!: number;
  public alertType!: 'error' | 'warning' | 'info';
  public title!: string;
  public description!: string;
  public severity!: 'low' | 'medium' | 'high' | 'critical';
  public status!: 'active' | 'resolved' | 'dismissed';
  public organizationId?: number;
  public projectId?: number;
  public metadata?: object;
  public resolvedAt?: Date;
  public resolvedBy?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    AIHealthAlert.belongsTo(models.AISystemHealth, {
      foreignKey: 'systemHealthId',
      as: 'systemHealth'
    });
    AIHealthAlert.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    AIHealthAlert.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    AIHealthAlert.belongsTo(models.User, {
      foreignKey: 'resolvedBy',
      as: 'resolver'
    });
  }
}

AIHealthAlert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    systemHealthId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ai_system_health',
        key: 'id'
      }
    },
    alertType: {
      type: DataTypes.ENUM('error', 'warning', 'info'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'active'
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
  },
  {
    sequelize,
    tableName: "ai_health_alerts",
    modelName: "AIHealthAlert",
    timestamps: true,
    indexes: [
      {
        fields: ['systemHealthId']
      },
      {
        fields: ['organizationId']
      },
      {
        fields: ['projectId']
      },
      {
        fields: ['alertType']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

export { AIHealthAlert, AIHealthAlertAttributes, AIHealthAlertCreationAttributes };