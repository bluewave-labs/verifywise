/**
 * Risk Import Plugin for VerifyWise
 *
 * This plugin provides Excel import functionality for bulk risk creation.
 * Users can download an Excel template with dropdown data validation,
 * fill it with risk data, and upload it to create multiple risks at once.
 */

import * as ExcelJS from "exceljs";

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ExcelTemplateResult {
  success: boolean;
  buffer: any; // ArrayBuffer from ExcelJS
  filename: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  importedAt: string;
}

interface RiskCSVRow {
  risk_name: string;
  risk_owner: number;
  ai_lifecycle_phase: string;
  risk_description: string;
  risk_category: string;
  impact: string;
  assessment_mapping: string;
  controls_mapping: string;
  likelihood: string;
  severity: string;
  risk_level_autocalculated: string;
  review_notes: string;
  mitigation_status: string;
  current_risk_level: string;
  deadline: string;
  mitigation_plan: string;
  implementation_strategy: string;
  mitigation_evidence_document: string;
  likelihood_mitigation: string;
  risk_severity: string;
  final_risk_level: string;
  risk_approval: number;
  approval_status: string;
  date_of_assessment: string;
}

// ========== ENUM DEFINITIONS ==========

const AI_LIFECYCLE_PHASES = [
  "Problem definition & planning",
  "Data collection & processing",
  "Model development & training",
  "Model validation & testing",
  "Deployment & integration",
  "Monitoring & maintenance",
  "Decommissioning & retirement",
];

const LIKELIHOOD_VALUES = [
  "Rare",
  "Unlikely",
  "Possible",
  "Likely",
  "Almost Certain",
];

const SEVERITY_VALUES = [
  "Negligible",
  "Minor",
  "Moderate",
  "Major",
  "Catastrophic",
];

const RISK_SEVERITY_VALUES = [
  "Negligible",
  "Minor",
  "Moderate",
  "Major",
  "Critical",
];

const RISK_LEVEL_VALUES = [
  "No risk",
  "Very low risk",
  "Low risk",
  "Medium risk",
  "High risk",
  "Very high risk",
];

const CURRENT_RISK_LEVEL_VALUES = [
  "Very Low risk",
  "Low risk",
  "Medium risk",
  "High risk",
  "Very high risk",
];

const MITIGATION_STATUS_VALUES = [
  "Not Started",
  "In Progress",
  "Completed",
  "On Hold",
  "Deferred",
  "Canceled",
  "Requires review",
];

const RISK_CATEGORY_VALUES = [
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
  "Health and safety risk",
];

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the Risk Import plugin
 */
export async function install(
  _userId: number,
  _tenantId: string,
  _config: any,
  _context: PluginContext
): Promise<InstallResult> {
  try {
    // Risk Import plugin doesn't need to create any tables
    // It works with the existing risks table
    return {
      success: true,
      message: "Risk Import plugin installed successfully. You can now import risks via CSV.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the Risk Import plugin
 */
export async function uninstall(
  _userId: number,
  _tenantId: string,
  _context: PluginContext
): Promise<UninstallResult> {
  try {
    // No cleanup needed - we don't create any tables
    return {
      success: true,
      message: "Risk Import plugin uninstalled successfully.",
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

// ========== EXCEL TEMPLATE METHODS ==========

/**
 * Generate Excel template with headers, sample data, and dropdown validation
 */
export async function getExcelTemplate(
  organizationId: string,
  context: PluginContext
): Promise<ExcelTemplateResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Risk Import");

  // Fetch users from the organization for dropdown
  let users: Array<{ id: number; name: string; surname: string; email: string }> = [];
  try {
    const usersResult = await context.sequelize.query(
      "SELECT id, name, surname, email FROM public.users WHERE organization_id = :organizationId ORDER BY surname, name",
      {
        replacements: { organizationId },
        type: context.sequelize.QueryTypes.SELECT,
      }
    );
    users = usersResult as Array<{ id: number; name: string; surname: string; email: string }>;
  } catch (error) {
    console.error("[RiskImport] Error fetching users:", error);
  }

  // Define headers with descriptions
  const headers = [
    { key: "risk_name", header: "Risk Name *", width: 30 },
    { key: "risk_owner", header: "Risk Owner *", width: 30 },
    { key: "ai_lifecycle_phase", header: "AI Lifecycle Phase *", width: 30 },
    { key: "risk_description", header: "Risk Description", width: 40 },
    { key: "risk_category", header: "Risk Category (comma-separated)", width: 40 },
    { key: "impact", header: "Impact", width: 30 },
    { key: "likelihood", header: "Likelihood *", width: 20 },
    { key: "severity", header: "Severity *", width: 20 },
    { key: "review_notes", header: "Review Notes", width: 30 },
    { key: "mitigation_status", header: "Mitigation Status", width: 20 },
    { key: "current_risk_level", header: "Current Risk Level", width: 20 },
    { key: "deadline", header: "Deadline", width: 20 },
    { key: "mitigation_plan", header: "Mitigation Plan", width: 40 },
    { key: "implementation_strategy", header: "Implementation Strategy", width: 40 },
    { key: "likelihood_mitigation", header: "Likelihood Mitigation", width: 25 },
    { key: "risk_severity", header: "Risk Severity", width: 20 },
    { key: "final_risk_level", header: "Final Risk Level", width: 20 },
    { key: "risk_approval", header: "Risk Approval", width: 25 },
    { key: "approval_status", header: "Approval Status", width: 20 },
    { key: "date_of_assessment", header: "Date Of Assessment", width: 25 },
  ];

  // Set column definitions
  worksheet.columns = headers;

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF13715B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Create user dropdown options (format: "name surname - email (ID: id)")
  const userOptions = users.map(
    (user) => `${user.name} ${user.surname} - ${user.email} (ID: ${user.id})`
  );

  // Add sample data row
  const sampleUser = users.length > 0 ? userOptions[0] : "Select user from dropdown";
  worksheet.addRow({
    risk_name: "Example Risk 1",
    risk_owner: sampleUser,
    ai_lifecycle_phase: "Model development & training",
    risk_description: "Example risk description",
    risk_category: "Operational risk",
    impact: "High impact on model accuracy",
    likelihood: "Possible",
    severity: "Major",
    review_notes: "Needs immediate attention",
    mitigation_status: "In Progress",
    current_risk_level: "High risk",
    deadline: "2025-12-31",
    mitigation_plan: "Implement data validation",
    implementation_strategy: "Use automated tools",
    likelihood_mitigation: "Unlikely",
    risk_severity: "Moderate",
    final_risk_level: "Medium risk",
    risk_approval: sampleUser,
    approval_status: "Pending",
    date_of_assessment: "2025-01-15",
  });

  // Add data validation (dropdowns) for enum fields
  const addDropdownValidation = (
    colIndex: number,
    values: string[],
    startRow: number = 2,
    endRow: number = 1000
  ) => {
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const cell = worksheet.getCell(rowNum, colIndex);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Invalid Value",
        error: "Please select from the dropdown list",
      };
    }
  };

  // Add date validation with calendar picker
  const addDateValidation = (
    colIndex: number,
    startRow: number = 2,
    endRow: number = 1000
  ) => {
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const cell = worksheet.getCell(rowNum, colIndex);
      cell.dataValidation = {
        type: "date",
        allowBlank: true,
        operator: "greaterThan",
        formulae: [new Date(1900, 0, 1)],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Invalid Date",
        error: "Please enter a valid date",
        showInputMessage: true,
        promptTitle: "Date",
        prompt: "Click to select a date from the calendar",
      };
      // Set number format for dates
      cell.numFmt = "yyyy-mm-dd";
    }
  };

  // Add reference dropdown for multi-select fields (shows dropdown but allows manual comma-separated entry)
  const addMultiSelectDropdown = (
    colIndex: number,
    values: string[],
    startRow: number = 2,
    endRow: number = 1000
  ) => {
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const cell = worksheet.getCell(rowNum, colIndex);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
        showErrorMessage: false, // Don't show error to allow comma-separated values
        showInputMessage: true,
        promptTitle: "Risk Categories",
        prompt: "Select one or enter multiple comma-separated values (e.g., 'Operational risk, Technological risk')",
      };
    }
  };

  // Add dropdowns for user fields
  if (userOptions.length > 0) {
    addDropdownValidation(2, userOptions); // risk_owner (column B)
    addDropdownValidation(18, userOptions); // risk_approval (column R)
  }

  // Add dropdowns for all enum fields (using column indices)
  addDropdownValidation(3, AI_LIFECYCLE_PHASES); // ai_lifecycle_phase (column C)
  addMultiSelectDropdown(5, RISK_CATEGORY_VALUES); // risk_category (column E) - allows comma-separated multi-select
  addDropdownValidation(7, LIKELIHOOD_VALUES); // likelihood (column G)
  addDropdownValidation(8, SEVERITY_VALUES); // severity (column H)
  addDropdownValidation(10, MITIGATION_STATUS_VALUES); // mitigation_status (column J)
  addDropdownValidation(11, CURRENT_RISK_LEVEL_VALUES); // current_risk_level (column K)
  addDropdownValidation(15, LIKELIHOOD_VALUES); // likelihood_mitigation (column O)
  addDropdownValidation(16, RISK_SEVERITY_VALUES); // risk_severity (column P)

  // Add date pickers for date fields
  addDateValidation(12); // deadline (column L)
  addDateValidation(20); // date_of_assessment (column T)

  // Freeze header row
  worksheet.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: 1,
    },
  ];

  // Generate buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  return {
    success: true,
    buffer: excelBuffer,
    filename: "risk_import_template.xlsx",
  };
}

// ========== CSV IMPORT METHODS ==========

/**
 * Helper function to parse user ID from dropdown format
 * Format: "name surname - email (ID: id)" -> returns id
 */
function parseUserId(value: any): number | null {
  if (!value) return null;

  const strValue = String(value);

  // If it's already a number, return it
  if (!isNaN(Number(strValue))) {
    return Number(strValue);
  }

  // Try to extract ID from format "name surname - email (ID: id)"
  const match = strValue.match(/\(ID:\s*(\d+)\)/);
  if (match && match[1]) {
    return Number(match[1]);
  }

  return null;
}

/**
 * Calculate risk level based on likelihood and severity
 * Uses the same formula as the UI: score = (likelihood * 1) + (severity * 3)
 */
function calculateRiskLevel(likelihood: string | null, severity: string | null): string | null {
  if (!likelihood || !severity) return null;

  // Map likelihood to numeric value
  const likelihoodMap: { [key: string]: number } = {
    "Rare": 1,
    "Unlikely": 2,
    "Possible": 3,
    "Likely": 4,
    "Almost Certain": 5
  };

  // Map severity to numeric value
  const severityMap: { [key: string]: number } = {
    "Negligible": 1,
    "Minor": 2,
    "Moderate": 3,
    "Major": 4,
    "Catastrophic": 5
  };

  const likelihoodValue = likelihoodMap[likelihood];
  const severityValue = severityMap[severity];

  if (!likelihoodValue || !severityValue) return null;

  // Calculate weighted risk score
  const score = (likelihoodValue * 1) + (severityValue * 3);

  // Map score to risk level
  if (score <= 4) {
    return "Very low risk";
  } else if (score <= 8) {
    return "Low risk";
  } else if (score <= 12) {
    return "Medium risk";
  } else if (score <= 16) {
    return "High risk";
  } else {
    return "Very high risk";
  }
}

/**
 * Validate a single risk row
 */
function validateRiskRow(
  row: Partial<RiskCSVRow>,
  rowIndex: number
): Array<{ row: number; field: string; message: string }> {
  const errors: Array<{ row: number; field: string; message: string }> = [];

  // Required fields
  if (!row.risk_name || row.risk_name.trim().length === 0) {
    errors.push({
      row: rowIndex,
      field: "risk_name",
      message: "Risk name is required",
    });
  }

  // Parse and validate risk_owner
  const riskOwnerId = parseUserId(row.risk_owner);
  if (!riskOwnerId) {
    errors.push({
      row: rowIndex,
      field: "risk_owner",
      message: "Risk owner must be a valid user ID or selected from dropdown",
    });
  }

  if (!row.risk_description || row.risk_description.trim().length === 0) {
    errors.push({
      row: rowIndex,
      field: "risk_description",
      message: "Risk description is required",
    });
  }

  // Validate enums
  if (row.ai_lifecycle_phase && AI_LIFECYCLE_PHASES.indexOf(row.ai_lifecycle_phase) === -1) {
    errors.push({
      row: rowIndex,
      field: "ai_lifecycle_phase",
      message: `Invalid AI lifecycle phase. Must be one of: ${AI_LIFECYCLE_PHASES.join(", ")}`,
    });
  }

  if (row.likelihood && LIKELIHOOD_VALUES.indexOf(row.likelihood) === -1) {
    errors.push({
      row: rowIndex,
      field: "likelihood",
      message: `Invalid likelihood. Must be one of: ${LIKELIHOOD_VALUES.join(", ")}`,
    });
  }

  if (row.severity && SEVERITY_VALUES.indexOf(row.severity) === -1) {
    errors.push({
      row: rowIndex,
      field: "severity",
      message: `Invalid severity. Must be one of: ${SEVERITY_VALUES.join(", ")}`,
    });
  }

  if (
    row.risk_level_autocalculated &&
    RISK_LEVEL_VALUES.indexOf(row.risk_level_autocalculated) === -1
  ) {
    errors.push({
      row: rowIndex,
      field: "risk_level_autocalculated",
      message: `Invalid risk level. Must be one of: ${RISK_LEVEL_VALUES.join(", ")}`,
    });
  }

  if (row.mitigation_status && MITIGATION_STATUS_VALUES.indexOf(row.mitigation_status) === -1) {
    errors.push({
      row: rowIndex,
      field: "mitigation_status",
      message: `Invalid mitigation status. Must be one of: ${MITIGATION_STATUS_VALUES.join(", ")}`,
    });
  }

  if (
    row.current_risk_level &&
    CURRENT_RISK_LEVEL_VALUES.indexOf(row.current_risk_level) === -1
  ) {
    errors.push({
      row: rowIndex,
      field: "current_risk_level",
      message: `Invalid current risk level. Must be one of: ${CURRENT_RISK_LEVEL_VALUES.join(", ")}`,
    });
  }

  if (
    row.likelihood_mitigation &&
    LIKELIHOOD_VALUES.indexOf(row.likelihood_mitigation) === -1
  ) {
    errors.push({
      row: rowIndex,
      field: "likelihood_mitigation",
      message: `Invalid likelihood mitigation. Must be one of: ${LIKELIHOOD_VALUES.join(", ")}`,
    });
  }

  if (row.risk_severity && RISK_SEVERITY_VALUES.indexOf(row.risk_severity) === -1) {
    errors.push({
      row: rowIndex,
      field: "risk_severity",
      message: `Invalid risk severity. Must be one of: ${RISK_SEVERITY_VALUES.join(", ")}`,
    });
  }

  // Validate dates
  if (row.deadline) {
    const date = new Date(row.deadline);
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: "deadline",
        message: "Invalid deadline date format. Use YYYY-MM-DD",
      });
    }
  }

  if (row.date_of_assessment) {
    const date = new Date(row.date_of_assessment);
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: "date_of_assessment",
        message: "Invalid assessment date format. Use YYYY-MM-DD",
      });
    }
  }

  return errors;
}

/**
 * Parse CSV row into risk object
 */
function parseRiskRow(row: Partial<RiskCSVRow>): any {
  const riskData: any = {
    risk_name: row.risk_name?.trim(),
    risk_owner: parseUserId(row.risk_owner),
    risk_description: row.risk_description?.trim(),
  };

  // Optional fields
  if (row.ai_lifecycle_phase) riskData.ai_lifecycle_phase = row.ai_lifecycle_phase;
  if (row.risk_category) {
    // Parse comma-separated risk categories into array
    riskData.risk_category = row.risk_category
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }
  if (row.impact) riskData.impact = row.impact;
  if (row.assessment_mapping) riskData.assessment_mapping = row.assessment_mapping;
  if (row.controls_mapping) riskData.controls_mapping = row.controls_mapping;
  if (row.likelihood) riskData.likelihood = row.likelihood;
  if (row.severity) riskData.severity = row.severity;

  // Auto-calculate risk level based on likelihood and severity
  riskData.risk_level_autocalculated = calculateRiskLevel(
    riskData.likelihood || null,
    riskData.severity || null
  );

  if (row.review_notes) riskData.review_notes = row.review_notes;
  if (row.mitigation_status) riskData.mitigation_status = row.mitigation_status;
  if (row.current_risk_level) riskData.current_risk_level = row.current_risk_level;
  if (row.deadline) riskData.deadline = new Date(row.deadline);
  if (row.mitigation_plan) riskData.mitigation_plan = row.mitigation_plan;
  if (row.implementation_strategy)
    riskData.implementation_strategy = row.implementation_strategy;
  if (row.mitigation_evidence_document)
    riskData.mitigation_evidence_document = row.mitigation_evidence_document;
  if (row.likelihood_mitigation)
    riskData.likelihood_mitigation = row.likelihood_mitigation;
  if (row.risk_severity) riskData.risk_severity = row.risk_severity;
  if (row.final_risk_level) riskData.final_risk_level = row.final_risk_level;
  if (row.risk_approval) riskData.risk_approval = parseUserId(row.risk_approval);
  if (row.approval_status) riskData.approval_status = row.approval_status;
  if (row.date_of_assessment)
    riskData.date_of_assessment = new Date(row.date_of_assessment);

  return riskData;
}

/**
 * Import risks from CSV data
 */
export async function importRisks(
  csvData: Partial<RiskCSVRow>[],
  tenantId: string,
  context: PluginContext
): Promise<ImportResult> {
  const { sequelize } = context;
  const errors: Array<{ row: number; field: string; message: string }> = [];
  let imported = 0;
  let failed = 0;

  try {
    // Validate all rows first
    csvData.forEach((row, index) => {
      const rowErrors = validateRiskRow(row, index + 2); // +2 because row 1 is headers
      errors.push(...rowErrors);
    });

    // If there are validation errors, return them without importing
    if (errors.length > 0) {
      return {
        success: false,
        imported: 0,
        failed: csvData.length,
        errors,
        importedAt: new Date().toISOString(),
      };
    }

    // Import each risk
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowIndex = i + 2; // +2 because row 1 is headers

      try {
        const riskData = parseRiskRow(row);

        // Insert into risks table
        await sequelize.query(
          `INSERT INTO "${tenantId}".risks (
            risk_name, risk_owner, ai_lifecycle_phase, risk_description,
            risk_category, impact, assessment_mapping, controls_mapping,
            likelihood, severity, risk_level_autocalculated, review_notes,
            mitigation_status, current_risk_level, deadline, mitigation_plan,
            implementation_strategy, mitigation_evidence_document,
            likelihood_mitigation, risk_severity, final_risk_level,
            risk_approval, approval_status, date_of_assessment,
            is_demo, created_at, updated_at
          ) VALUES (
            :risk_name, :risk_owner, :ai_lifecycle_phase, :risk_description,
            ARRAY[:risk_category]::enum_projectrisks_risk_category[], :impact, :assessment_mapping, :controls_mapping,
            :likelihood, :severity, :risk_level_autocalculated, :review_notes,
            :mitigation_status, :current_risk_level, :deadline, :mitigation_plan,
            :implementation_strategy, :mitigation_evidence_document,
            :likelihood_mitigation, :risk_severity, :final_risk_level,
            :risk_approval, :approval_status, :date_of_assessment,
            false, NOW(), NOW()
          )`,
          {
            replacements: {
              risk_name: riskData.risk_name,
              risk_owner: riskData.risk_owner,
              ai_lifecycle_phase: riskData.ai_lifecycle_phase || null,
              risk_description: riskData.risk_description,
              risk_category: riskData.risk_category || null,
              impact: riskData.impact || null,
              assessment_mapping: '', // Default empty string for removed field
              controls_mapping: '', // Default empty string for removed field
              likelihood: riskData.likelihood || null,
              severity: riskData.severity || null,
              risk_level_autocalculated: riskData.risk_level_autocalculated || null,
              review_notes: riskData.review_notes || null,
              mitigation_status: riskData.mitigation_status || null,
              current_risk_level: riskData.current_risk_level || null,
              deadline: riskData.deadline || null,
              mitigation_plan: riskData.mitigation_plan || null,
              implementation_strategy: riskData.implementation_strategy || null,
              mitigation_evidence_document: '', // Default empty string for removed field
              likelihood_mitigation: riskData.likelihood_mitigation || 'Rare', // Default to 'Rare' if not provided
              risk_severity: riskData.risk_severity || null,
              final_risk_level: riskData.final_risk_level || null,
              risk_approval: riskData.risk_approval || null,
              approval_status: riskData.approval_status || null,
              date_of_assessment: riskData.date_of_assessment || new Date(), // Default to current date if not provided
            },
          }
        );

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: rowIndex,
          field: "general",
          message: `Failed to import: ${error.message}`,
        });
      }
    }

    return {
      success: imported > 0,
      imported,
      failed,
      errors,
      importedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Import failed: ${error.message}`);
  }
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "Risk Import",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Import risks from CSV files",
};
