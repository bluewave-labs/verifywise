export enum DatasetStatus {
  DRAFT = "Draft",
  ACTIVE = "Active",
  DEPRECATED = "Deprecated",
  ARCHIVED = "Archived",
}

export enum DatasetType {
  TRAINING = "Training",
  VALIDATION = "Validation",
  TESTING = "Testing",
  PRODUCTION = "Production",
  REFERENCE = "Reference",
}

export enum DataClassification {
  PUBLIC = "Public",
  INTERNAL = "Internal",
  CONFIDENTIAL = "Confidential",
  RESTRICTED = "Restricted",
}
