import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

interface AIHealthMetricsAttributes {
  id: number;
  systemHealthId: number;
  metricType: string;
  metricValue: number;
  metricUnit?: string;
  threshold?: number;
  isWithinThreshold: boolean;
  recordedAt: Date;
  organizationId?: number;
  metadata?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AIHealthMetricsCreationAttributes
  extends Optional<AIHealthMetricsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class AIHealthMetrics
  extends Model<AIHealthMetricsAttributes, AIHealthMetricsCreationAttributes>
  implements AIHealthMetricsAttributes
{
  public id!: number;
  public systemHealthId!: number;
  public metricType!: string;
  public metricValue!: number;
  public metricUnit?: string;
  public threshold?: number;
  public isWithinThreshold!: boolean;
  public recordedAt!: Date;
  public organizationId?: number;
  public metadata?: object;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    AIHealthMetrics.belongsTo(models.AISystemHealth, {
      foreignKey: 'systemHealthId',
      as: 'systemHealth'
    });
    AIHealthMetrics.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
  }
}

AIHealthMetrics.init(
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
    metricType: {
      type: DataTypes.ENUM(
        'response_time',
        'accuracy',
        'throughput',
        'error_rate',
        'cpu_usage',
        'memory_usage',
        'disk_usage',
        'network_latency',
        'model_drift',
        'data_quality',
        'prediction_confidence',
        'custom'
      ),
      allowNull: false,
    },
    metricValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    metricUnit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    threshold: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isWithinThreshold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "ai_health_metrics",
    modelName: "AIHealthMetrics",
    timestamps: true,
    indexes: [
      {
        fields: ['systemHealthId']
      },
      {
        fields: ['organizationId']
      },
      {
        fields: ['metricType']
      },
      {
        fields: ['recordedAt']
      },
      {
        fields: ['isWithinThreshold']
      }
    ]
  }
);

export { AIHealthMetrics, AIHealthMetricsAttributes, AIHealthMetricsCreationAttributes };