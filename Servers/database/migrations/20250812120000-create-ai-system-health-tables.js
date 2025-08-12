'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ai_system_health table
    await queryInterface.createTable('ai_system_health', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      systemName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'system_name'
      },
      systemType: {
        type: Sequelize.ENUM(
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
        field: 'system_type'
      },
      overallScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        },
        field: 'overall_score'
      },
      performanceScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        },
        field: 'performance_score'
      },
      securityScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        },
        field: 'security_score'
      },
      complianceScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        },
        field: 'compliance_score'
      },
      reliabilityScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        },
        field: 'reliability_score'
      },
      status: {
        type: Sequelize.ENUM('excellent', 'good', 'fair', 'poor'),
        allowNull: false,
      },
      lastChecked: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'last_checked'
      },
      uptime: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 99.0,
        validate: {
          min: 0,
          max: 100
        }
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'organization_id'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'project_id'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });

    // Create ai_health_alerts table
    await queryInterface.createTable('ai_health_alerts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      systemHealthId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ai_system_health',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'system_health_id'
      },
      alertType: {
        type: Sequelize.ENUM('error', 'warning', 'info'),
        allowNull: false,
        field: 'alert_type'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'active'
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'organization_id'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'project_id'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'resolved_at'
      },
      resolvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'resolved_by'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });

    // Create ai_health_metrics table
    await queryInterface.createTable('ai_health_metrics', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      systemHealthId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ai_system_health',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'system_health_id'
      },
      metricType: {
        type: Sequelize.ENUM(
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
        field: 'metric_type'
      },
      metricValue: {
        type: Sequelize.FLOAT,
        allowNull: false,
        field: 'metric_value'
      },
      metricUnit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        field: 'metric_unit'
      },
      threshold: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      isWithinThreshold: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_within_threshold'
      },
      recordedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'recorded_at'
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'organization_id'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('ai_system_health', ['organization_id']);
    await queryInterface.addIndex('ai_system_health', ['project_id']);
    await queryInterface.addIndex('ai_system_health', ['system_type']);
    await queryInterface.addIndex('ai_system_health', ['status']);
    await queryInterface.addIndex('ai_system_health', ['last_checked']);

    await queryInterface.addIndex('ai_health_alerts', ['system_health_id']);
    await queryInterface.addIndex('ai_health_alerts', ['organization_id']);
    await queryInterface.addIndex('ai_health_alerts', ['project_id']);
    await queryInterface.addIndex('ai_health_alerts', ['alert_type']);
    await queryInterface.addIndex('ai_health_alerts', ['severity']);
    await queryInterface.addIndex('ai_health_alerts', ['status']);
    await queryInterface.addIndex('ai_health_alerts', ['created_at']);

    await queryInterface.addIndex('ai_health_metrics', ['system_health_id']);
    await queryInterface.addIndex('ai_health_metrics', ['organization_id']);
    await queryInterface.addIndex('ai_health_metrics', ['metric_type']);
    await queryInterface.addIndex('ai_health_metrics', ['recorded_at']);
    await queryInterface.addIndex('ai_health_metrics', ['is_within_threshold']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryInterface.dropTable('ai_health_metrics');
    await queryInterface.dropTable('ai_health_alerts');
    await queryInterface.dropTable('ai_system_health');

    // Drop custom ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_system_health_system_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_system_health_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_health_alerts_alert_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_health_alerts_severity";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_health_alerts_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_health_metrics_metric_type";');
  }
};