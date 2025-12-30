/**
 * Risk Import Plugin for VerifyWise
 *
 * This plugin provides Excel import functionality for bulk risk creation.
 * Users can download an Excel template with dropdown data validation,
 * fill it with risk data, and upload it to create multiple risks at once.
 */
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
    buffer: any;
    filename: string;
}
interface ImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: Array<{
        row: number;
        field: string;
        message: string;
    }>;
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
/**
 * Install the Risk Import plugin
 */
export declare function install(_userId: number, _tenantId: string, _config: any, _context: PluginContext): Promise<InstallResult>;
/**
 * Uninstall the Risk Import plugin
 */
export declare function uninstall(_userId: number, _tenantId: string, _context: PluginContext): Promise<UninstallResult>;
/**
 * Generate Excel template with headers, sample data, and dropdown validation
 */
export declare function getExcelTemplate(organizationId: string, context: PluginContext): Promise<ExcelTemplateResult>;
/**
 * Import risks from CSV data
 */
export declare function importRisks(csvData: Partial<RiskCSVRow>[], tenantId: string, context: PluginContext): Promise<ImportResult>;
export declare const metadata: PluginMetadata;
export {};
//# sourceMappingURL=index.d.ts.map