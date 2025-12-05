/**
 * Change History Configuration
 *
 * This file defines the configuration for each entity that supports change history tracking.
 * When adding a new entity, simply add its configuration here and create the corresponding
 * database table using the migration template.
 */

import { QueryTypes } from "sequelize";
import { sequelize } from "../database/db";

/**
 * Entity type enum - add new entity types here
 */
export type EntityType =
  | "model_inventory"
  | "vendor"
  | "use_case"
  | "project"
  | "framework"
  | "evidence_hub"
  | "risk"
  | "vendor_risk";

/**
 * Field formatter function type
 */
export type FieldFormatter = (value: any) => Promise<string>;

/**
 * Entity configuration interface
 */
export interface EntityConfig {
  tableName: string;
  foreignKeyField: string;
  fieldsToTrack: string[];
  fieldLabels: { [key: string]: string };
  fieldFormatters?: { [key: string]: FieldFormatter };
}

/**
 * System fields that should never be tracked
 */
export const SYSTEM_FIELDS_TO_EXCLUDE = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "tenant",
  "tenant_id",
];

/**
 * Generic field formatters that can be reused across entities
 */
export const GENERIC_FORMATTERS: { [key: string]: FieldFormatter } = {
  // Boolean formatter
  boolean: async (value: any): Promise<string> => {
    if (value === null || value === undefined) return "-";
    return value ? "Yes" : "No";
  },

  // Date formatter
  date: async (value: any): Promise<string> => {
    if (value === null || value === undefined || value === "") return "-";
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }
    if (typeof value === "string") {
      return value.split("T")[0];
    }
    return String(value);
  },

  // Array formatter (preserves order - IMPORTANT for tracking reordering)
  array: async (value: any): Promise<string> => {
    if (!value) return "-";
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";
      // DO NOT SORT - order may be meaningful!
      return value
        .map((item) => String(item).trim())
        .join(", ");
    }
    // Handle string representations of arrays
    if (typeof value === "string" && (value.startsWith("[") || value.includes(","))) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // DO NOT SORT - order may be meaningful!
          return parsed
            .map((item) => String(item).trim())
            .join(", ");
        }
      } catch {
        const items = value.split(",").map((item) => item.trim()).filter(Boolean);
        if (items.length > 1) {
          // DO NOT SORT - order may be meaningful!
          return items.join(", ");
        }
      }
    }
    return String(value);
  },

  // User lookup formatter (resolves user ID to name)
  user: async (value: any): Promise<string> => {
    if (!value) return "-";
    if (typeof value === "number") {
      try {
        const users: any[] = await sequelize.query(
          `SELECT id, name, surname, email FROM public.users WHERE id = :userId`,
          {
            replacements: { userId: value },
            type: QueryTypes.SELECT,
          }
        );

        if (users && users.length > 0) {
          const user = users[0];
          if (user.name && user.surname) {
            return `${user.name} ${user.surname}`;
          } else if (user.email) {
            return user.email;
          }
        }
        // User not found
        return `User #${value}`;
      } catch (error) {
        // Database error - log and return fallback
        console.error("Error fetching user for ID", value, ":", error);
        return `User #${value}`;
      }
    }
    return String(value);
  },

  // Default text formatter
  text: async (value: any): Promise<string> => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  },
};

/**
 * Auto-format field name from snake_case to sentence case
 * Example: security_assessment -> Security assessment
 */
export const autoFormatFieldName = (fieldName: string): string => {
  return fieldName
    .split("_")
    .map((word, index) => {
      // Capitalize only the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");
};

/**
 * Entity configurations
 * Add new entity configurations here when adding change history to new entities
 */
export const ENTITY_CONFIGS: { [key in EntityType]: EntityConfig } = {
  model_inventory: {
    tableName: "model_inventory_change_history",
    foreignKeyField: "model_inventory_id",
    fieldsToTrack: [
      "provider",
      "model",
      "version",
      "approver",
      "capabilities",
      "security_assessment",
      "status",
      "status_date",
      "reference_link",
      "biases",
      "limitations",
      "hosting_provider",
    ],
    fieldLabels: {
      provider: "Provider",
      model: "Model",
      version: "Version",
      approver: "Approver",
      capabilities: "Capabilities",
      security_assessment: "Security assessment",
      status: "Status",
      status_date: "Status date",
      reference_link: "Reference link",
      biases: "Biases",
      limitations: "Limitations",
      hosting_provider: "Hosting provider",
    },
    fieldFormatters: {
      security_assessment: GENERIC_FORMATTERS.boolean,
      status_date: GENERIC_FORMATTERS.date,
      approver: GENERIC_FORMATTERS.user,
      capabilities: GENERIC_FORMATTERS.array,
    },
  },

  vendor: {
    tableName: "vendor_change_history",
    foreignKeyField: "vendor_id",
    fieldsToTrack: [
      "vendor_name",
      "vendor_provides",
      "website",
      "vendor_contact_person",
      "assignee",
      "reviewer",
      "review_status",
      "review_result",
      "review_date",
      "data_sensitivity",
      "business_criticality",
      "past_issues",
      "regulatory_exposure",
      "risk_score",
    ],
    fieldLabels: {
      vendor_name: "Vendor name",
      vendor_provides: "Vendor provides",
      website: "Website",
      vendor_contact_person: "Contact person",
      assignee: "Assignee",
      reviewer: "Reviewer",
      review_status: "Review status",
      review_result: "Review result",
      review_date: "Review date",
      data_sensitivity: "Data sensitivity",
      business_criticality: "Business criticality",
      past_issues: "Past issues",
      regulatory_exposure: "Regulatory exposure",
      risk_score: "Risk score",
    },
    fieldFormatters: {
      review_date: GENERIC_FORMATTERS.date,
      reviewer: GENERIC_FORMATTERS.user,
      assignee: GENERIC_FORMATTERS.user,
    },
  },

  use_case: {
    tableName: "use_case_change_history",
    foreignKeyField: "use_case_id",
    fieldsToTrack: [
      "name",
      "description",
    ],
    fieldLabels: {
      name: "Name",
      description: "Description",
    },
  },

  project: {
    tableName: "project_change_history",
    foreignKeyField: "project_id",
    fieldsToTrack: [
      "name",
      "description",
    ],
    fieldLabels: {
      name: "Name",
      description: "Description",
    },
  },

  framework: {
    tableName: "framework_change_history",
    foreignKeyField: "framework_id",
    fieldsToTrack: [
      "name",
      "description",
    ],
    fieldLabels: {
      name: "Name",
      description: "Description",
    },
  },

  evidence_hub: {
    tableName: "evidence_hub_change_history",
    foreignKeyField: "evidence_hub_id",
    fieldsToTrack: [
      "name",
      "type",
      "description",
    ],
    fieldLabels: {
      name: "Name",
      type: "Type",
      description: "Description",
    },
  },

  risk: {
    tableName: "risk_change_history",
    foreignKeyField: "risk_id",
    fieldsToTrack: [
      "name",
      "description",
    ],
    fieldLabels: {
      name: "Name",
      description: "Description",
    },
  },

  vendor_risk: {
    tableName: "vendor_risk_change_history",
    foreignKeyField: "vendor_risk_id",
    fieldsToTrack: [
      "risk_description",
      "impact_description",
      "impact",
      "likelihood",
      "risk_severity",
      "action_plan",
      "action_owner",
      "risk_level",
    ],
    fieldLabels: {
      risk_description: "Risk description",
      impact_description: "Impact description",
      impact: "Impact",
      likelihood: "Likelihood",
      risk_severity: "Risk severity",
      action_plan: "Action plan",
      action_owner: "Action owner",
      risk_level: "Risk level",
    },
    fieldFormatters: {
      action_owner: GENERIC_FORMATTERS.user,
    },
  },
};

/**
 * Get entity configuration by type
 */
export const getEntityConfig = (entityType: EntityType): EntityConfig => {
  const config = ENTITY_CONFIGS[entityType];
  if (!config) {
    throw new Error(`No configuration found for entity type: ${entityType}`);
  }
  return config;
};
