/**
 * Status Update API Functions
 * 
 * Comprehensive API layer for updating status across all ISO framework components.
 * Handles the complex data requirements and endpoint differences between frameworks.
 * 
 * Key Features:
 * - Proper data fetching and preservation
 * - Framework-specific API endpoints
 * - Robust error handling
 * - Type-safe parameter handling
 */

import { updateEntityById, getEntityById } from "../../../application/repository/entity.repository";
import { UpdateAnnexCategoryById } from "../../../application/repository/annexCategory_iso.repository";

export interface StatusUpdateParams {
  id: number;
  newStatus: string;
  projectFrameworkId: number;
  userId?: number;
  currentData?: Record<string, unknown>; // Optional fallback data
}

/**
 * Update status for ISO27001 clause subclauses
 */
export async function updateISO27001ClauseStatus({
  id,
  newStatus,
  projectFrameworkId,
  userId = 1,
  currentData,
}: StatusUpdateParams): Promise<boolean> {
  try {
    // Fetch current subclause data to preserve existing fields
    let subClauseData = currentData;
    
    if (!subClauseData) {
      const response = await getEntityById({
        routeUrl: `/iso-27001/subClause/byId/${id}?projectFrameworkId=${projectFrameworkId}`,
      });
      subClauseData = response?.data || {};
    }
    
    const formData = new FormData();
    
    // Include all required fields based on drawer implementation
    formData.append("implementation_description", subClauseData.implementation_description || "");
    formData.append("status", newStatus);
    formData.append("owner", subClauseData.owner?.toString() || "");
    formData.append("reviewer", subClauseData.reviewer?.toString() || "");
    formData.append("approver", subClauseData.approver?.toString() || "");
    formData.append("auditor_feedback", subClauseData.auditor_feedback || "");
    formData.append("user_id", userId.toString());
    formData.append("project_id", "0");
    formData.append("delete", "[]");
    formData.append("risksMitigated", JSON.stringify(subClauseData.risks || []));
    formData.append("risksDelete", "[]");
    
    if (subClauseData.due_date) {
      formData.append("due_date", subClauseData.due_date);
    }

    const response = await updateEntityById({
      routeUrl: `/iso-27001/saveClauses/${id}`,
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.status === 200;
  } catch (error) {
    console.error("Error updating ISO27001 clause status:", error);
    return false;
  }
}

/**
 * Update status for ISO27001 annex controls
 */
export async function updateISO27001AnnexStatus({
  id,
  newStatus,
  userId = 1,
  currentData,
}: StatusUpdateParams): Promise<boolean> {
  try {
    // Use currentData directly since annex controls are already loaded in the UI
    const controlData = currentData || {};
    
    const formData = new FormData();
    
    // Include all required fields based on drawer implementation
    formData.append("implementation_description", controlData.implementation_description || "");
    formData.append("status", newStatus);
    
    // Only append user fields if they have valid values
    if (controlData.owner && controlData.owner.trim() !== "") {
      formData.append("owner", controlData.owner);
    }
    if (controlData.reviewer && controlData.reviewer.trim() !== "") {
      formData.append("reviewer", controlData.reviewer);
    }
    if (controlData.approver && controlData.approver.trim() !== "") {
      formData.append("approver", controlData.approver);
    }
    
    formData.append("auditor_feedback", controlData.auditor_feedback || "");
    formData.append("applicable", controlData.applicable?.toString() || "true");
    formData.append("user_id", userId.toString());
    formData.append("project_id", "0");
    formData.append("delete", "[]");
    formData.append("risksMitigated", JSON.stringify(controlData.risks || []));
    formData.append("risksDelete", "[]");
    
    if (controlData.due_date) {
      formData.append("due_date", controlData.due_date);
    }

    const response = await updateEntityById({
      routeUrl: `/iso-27001/saveAnnexes/${id}`,
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.status === 200;
  } catch (error) {
    console.error("Error updating ISO27001 annex status:", error);
    return false;
  }
}

/**
 * Update status for ISO42001 clause subclauses
 */
export async function updateISO42001ClauseStatus({
  id,
  newStatus,
  projectFrameworkId,
  userId = 1,
  currentData,
}: StatusUpdateParams): Promise<boolean> {
  try {
    // Fetch current subclause data to preserve existing fields
    let subClauseData = currentData;
    
    if (!subClauseData) {
      const response = await getEntityById({
        routeUrl: `/iso-42001/subClause/byId/${id}?projectFrameworkId=${projectFrameworkId}`,
      });
      subClauseData = response?.data || {};
    }
    
    const formData = new FormData();
    
    // Include all required fields based on drawer implementation
    formData.append("implementation_description", subClauseData.implementation_description || "");
    formData.append("status", newStatus);
    formData.append("owner", subClauseData.owner?.toString() || "");
    formData.append("reviewer", subClauseData.reviewer?.toString() || "");
    formData.append("approver", subClauseData.approver?.toString() || "");
    formData.append("auditor_feedback", subClauseData.auditor_feedback || "");
    formData.append("user_id", userId.toString());
    formData.append("project_id", "0");
    formData.append("delete", "[]");
    formData.append("risksMitigated", JSON.stringify(subClauseData.risks || []));
    formData.append("risksDelete", "[]");
    
    if (subClauseData.due_date) {
      formData.append("due_date", subClauseData.due_date);
    }

    const response = await updateEntityById({
      routeUrl: `/iso-42001/saveClauses/${id}`,
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.status === 200;
  } catch (error) {
    console.error("Error updating ISO42001 clause status:", error);
    return false;
  }
}

/**
 * Update status for ISO42001 annex controls
 */
export async function updateISO42001AnnexStatus({
  id,
  newStatus,
  userId = 1,
  currentData,
}: StatusUpdateParams): Promise<boolean> {
  try {
    // Use currentData directly since annex controls are already loaded in the UI
    const controlData = currentData || {};
    
    const formData = new FormData();
    
    // Include all required fields based on drawer implementation
    formData.append("implementation_description", controlData.implementation_description || "");
    formData.append("status", newStatus);
    formData.append("owner", controlData.owner?.toString() || "");
    formData.append("reviewer", controlData.reviewer?.toString() || "");
    formData.append("approver", controlData.approver?.toString() || "");
    formData.append("auditor_feedback", controlData.auditor_feedback || "");
    formData.append("is_applicable", controlData.is_applicable?.toString() || "true");
    formData.append("user_id", userId.toString());
    formData.append("project_id", "0");
    formData.append("delete", "[]");
    formData.append("risksMitigated", JSON.stringify(controlData.risks || []));
    formData.append("risksDelete", "[]");
    
    if (controlData.due_date) {
      formData.append("due_date", controlData.due_date);
    }

    const response = await UpdateAnnexCategoryById({
      routeUrl: `/iso-42001/saveAnnexes/${id}`,
      body: formData,
    });

    return response?.status === 200;
  } catch (error) {
    console.error("Error updating ISO42001 annex status:", error);
    return false;
  }
}