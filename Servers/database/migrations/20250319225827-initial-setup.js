'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    }).then(() => queryInterface.bulkInsert('roles', [
      { name: 'Admin', description: 'Administrator with full access to the system.' },
      { name: 'Reviewer', description: 'Reviewer with access to review compliance and reports.' },
      { name: 'Editor', description: 'Editor with permission to modify and update project details.' },
      { name: 'Auditor', description: 'Auditor with access to compliance and security audits.' }
    ]));

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      surname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id',
        },
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    });

    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      owner: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users', // Assuming the users table is named 'users'
          key: 'id',
        },
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ai_risk_classification: {
        type: Sequelize.ENUM('high risk', 'limited risk', 'minimal risk'),
        allowNull: false,
      },
      type_of_high_risk_role: {
        type: Sequelize.ENUM('deployer', 'provider', 'distributor', 'importer', 'product manufacturer', 'authorized representative'),
        allowNull: false,
      },
      goal: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      last_updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users', // Assuming the users table is named 'users'
          key: 'id',
        },
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    });

    await queryInterface.createTable('projects_members', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users', // Assuming the users table is named 'users'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'projects', // Assuming the projects table is named 'projects'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    });

    await queryInterface.createTable('vendors', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_no: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vendor_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      vendor_provides: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      assignee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Assuming the UserModel is mapped to a 'users' table
          key: 'id',
        },
      },
      website: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      vendor_contact_person: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      review_result: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      review_status: {
        type: DataTypes.ENUM('Active', 'Under review', 'Not active'),
        allowNull: false,
      },
      reviewer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Assuming the UserModel is mapped to a 'users' table
          key: 'id',
        },
      },
      risk_status: {
        type: DataTypes.ENUM('Very high risk', 'High risk', 'Medium risk', 'Low risk', 'Very low risk'),
        allowNull: false,
      },
      review_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_demo: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    });

    await queryInterface.createTable('vendors_projects', {
      vendor_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'vendors', // Assuming the vendors table is named 'vendors'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'projects', // Assuming the projects table is named 'projects'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    });

    await queryInterface.createTable('assessments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('controlcategories', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects', // Assuming the projects table is named 'projects'
          key: 'id',
        },
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('controls', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.ENUM('Waiting', 'In progress', 'Done'),
      },
      approver: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        }
      },
      risk_review: {
        type: Sequelize.ENUM('Acceptable risk', 'Residual risk', 'Unacceptable risk'),
      },
      owner: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        },
      },
      reviewer: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        },
      },
      due_date: {
        type: Sequelize.DATE,
      },
      implementation_details: {
        type: Sequelize.TEXT,
      },
      control_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'controlcategories', // Assuming the referenced table is named 'control_categories'
          key: 'id',
        },
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
      }
    });

    await queryInterface.createTable('subcontrols', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Waiting', 'In progress', 'Done'),
        allowNull: true,
      },
      approver: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        },
      },
      risk_review: {
        type: Sequelize.ENUM('Acceptable risk', 'Residual risk', 'Unacceptable risk'),
        allowNull: true,
      },
      owner: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        },
      },
      reviewer: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users', // Assuming the users table exists
          key: 'id',
        },
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      implementation_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      evidence_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      feedback_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      evidence_files: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      feedback_files: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      control_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'controls', // Assuming the controls table exists
          key: 'id',
        },
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('projectrisks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects', // Assuming the projects table is named 'projects'
          key: 'id',
        },
      },
      risk_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      risk_owner: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'controls', // Assuming the controls table exists
          key: 'id',
        },
      },
      ai_lifecycle_phase: {
        type: Sequelize.ENUM(
          "Problem definition & planning",
          "Data collection & processing",
          "Model development & training",
          "Model validation & testing",
          "Deployment & integration",
          "Monitoring & maintenance",
          "Decommissioning & retirement"
        ),
        allowNull: false,
      },
      risk_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      risk_category: {
        type: Sequelize.ENUM(
          "Strategic risk",
          "Operational risk",
          "Compliance risk",
          "Financial risk",
          "Cybersecurity risk",
          "Reputational risk",
          "Legal risk",
          "Technological risk",
          "Third-party/vendor risk",
          "Environmental risk",
          "Human resources risk",
          "Geopolitical risk",
          "Fraud risk",
          "Data privacy risk",
          "Health and safety risk"
        ),
        allowNull: false,
      },
      impact: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      assessment_mapping: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      controls_mapping: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      likelihood: {
        type: Sequelize.ENUM("Rare", "Unlikely", "Possible", "Likely", "Almost Certain"),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical"),
        allowNull: false,
      },
      risk_level_autocalculated: {
        type: Sequelize.ENUM("No risk", "Low risk", "Medium risk", "High risk", "Very high risk"),
        allowNull: false,
      },
      review_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mitigation_status: {
        type: Sequelize.ENUM("Not Started", "In Progress", "Completed", "On Hold", "Deferred", "Canceled", "Requires review"),
        allowNull: false,
      },
      current_risk_level: {
        type: Sequelize.ENUM("Very Low risk", "Low risk", "Medium risk", "High risk", "Very high risk"),
        allowNull: false,
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      mitigation_plan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      implementation_strategy: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      mitigation_evidence_document: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      likelihood_mitigation: {
        type: Sequelize.ENUM("Rare", "Unlikely", "Possible", "Likely", "Almost Certain"),
        allowNull: false,
      },
      risk_severity: {
        type: Sequelize.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical"),
        allowNull: false,
      },
      final_risk_level: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      risk_approval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'controls', // Assuming the controls table exists
          key: 'id',
        },
      },
      approval_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date_of_assessment: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('vendorrisks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vendors', // Assuming the vendors table is named 'vendors'
          key: 'id',
        },
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      risk_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      impact_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      impact: {
        type: Sequelize.ENUM('Negligible', 'Minor', 'Moderate', 'Major', 'Critical'),
        allowNull: false,
      },
      likelihood: {
        type: Sequelize.ENUM('Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'),
        allowNull: false,
      },
      risk_severity: {
        type: Sequelize.ENUM('Very low risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk'),
        allowNull: false,
      },
      action_plan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      action_owner: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Assuming the users table is named 'users'
          key: 'id',
        },
      },
      risk_level: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('projectscopes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      assessment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assessments',
          key: 'id',
        },
      },
      describe_ai_environment: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_new_ai_technology: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      uses_personal_data: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      project_scope_documents: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      technology_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      has_ongoing_monitoring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      unintended_outcomes: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      technology_documentation: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('topics', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      assessment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assessments', // Assuming the assessments table is named 'assessments'
          key: 'id',
        },
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('subtopics', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      topic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'topics', // name of the target model
          key: 'id', // key in the target model
        },
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    });

    await queryInterface.createTable('questions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_no: {
        type: Sequelize.INTEGER,
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hint: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority_level: {
        type: Sequelize.ENUM('high priority', 'medium priority', 'low priority'),
        allowNull: false,
      },
      answer_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      input_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      evidence_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      dropdown_options: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      evidence_files: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      answer: {
        type: Sequelize.TEXT,
      },
      subtopic_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'subtopics', // Assuming you have a subtopics table
          key: 'id',
        },
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
      }
    });

    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.BLOB,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'projects', // name of the target table
          key: 'id',
        },
        allowNull: false,
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users', // name of the target table
          key: 'id',
        },
        allowNull: false,
      },
      uploaded_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('files');
    await queryInterface.dropTable('questions');
    await queryInterface.dropTable('subtopics');
    await queryInterface.dropTable('topics');
    await queryInterface.dropTable('projectscopes');
    await queryInterface.dropTable('vendorrisks');
    await queryInterface.dropTable('projectrisks');
    await queryInterface.dropTable('subcontrols');
    await queryInterface.dropTable('controls');
    await queryInterface.dropTable('controlcategories');
    await queryInterface.dropTable('assessments');
    await queryInterface.dropTable('vendors_projects');
    await queryInterface.dropTable('vendors');
    await queryInterface.dropTable('projects_members');
    await queryInterface.dropTable('projects');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
  }
};
