import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

interface AISystemHealthAttributes {
  id: number;
  systemName: string;
  systemType: string;
  overallScore: number;
  performanceScore: number;
  securityScore: number;
  complianceScore: number;
  reliabilityScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastChecked: Date;
  uptime: number;
  organizationId?: number;
  projectId?: number;
  metadata?: object;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AISystemHealthCreationAttributes
  extends Optional<AISystemHealthAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class AISystemHealth
  extends Model<AISystemHealthAttributes, AISystemHealthCreationAttributes>
  implements AISystemHealthAttributes
{
  public id!: number;
  public systemName!: string;
  public systemType!: string;
  public overallScore!: number;
  public performanceScore!: number;
  public securityScore!: number;
  public complianceScore!: number;
  public reliabilityScore!: number;
  public status!: 'excellent' | 'good' | 'fair' | 'poor';
  public lastChecked!: Date;
  public uptime!: number;
  public organizationId?: number;
  public projectId?: number;
  public metadata?: object;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    // Define associations here
    AISystemHealth.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    AISystemHealth.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  }
}

AISystemHealth.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    systemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    systemType: {
      type: DataTypes.ENUM(
        'recommendation_engine',
        'fraud_detection',
        'nlp_service',
        'image_recognition',
        'sentiment_analysis',
        'chatbot',
        'predictive_analytics',
        'other'
      ),
      allowNull: false,
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    performanceScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    securityScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    complianceScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    reliabilityScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    status: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: false,
    },
    lastChecked: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    uptime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 99.0,
      validate: {
        min: 0,
        max: 100
      }
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "ai_system_health",
    modelName: "AISystemHealth",
    timestamps: true,
    indexes: [
      {
        fields: ['organizationId']
      },
      {
        fields: ['projectId']
      },
      {
        fields: ['systemType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['lastChecked']
      }
    ]
  }
);

export { AISystemHealth, AISystemHealthAttributes, AISystemHealthCreationAttributes };