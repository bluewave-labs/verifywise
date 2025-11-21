import { CEMarkingData } from "../../domain/types/ceMarking";
import CustomAxios from "./customAxios";

const CE_MARKING_API = `/ce-marking`;

/**
 * CE Marking API Service
 */
export const ceMarkingService = {
  /**
   * Get CE Marking data for a project
   * Creates default record if none exists
   */
  async getCEMarking(projectId: string): Promise<CEMarkingData> {
    try {
      const response = await CustomAxios.get<CEMarkingData>(
        `${CE_MARKING_API}/${projectId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching CE Marking data:", error);
      throw error;
    }
  },

  /**
   * Update CE Marking data for a project
   */
  async updateCEMarking(
    projectId: string,
    data: Partial<CEMarkingData>
  ): Promise<CEMarkingData> {
    try {
      const response = await CustomAxios.put<CEMarkingData>(
        `${CE_MARKING_API}/${projectId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating CE Marking data:", error);
      throw error;
    }
  },

  /**
   * Update a specific conformity step
   * Note: The backend only needs the changed fields, not the entire step
   */
  async updateConformityStep(
    projectId: string,
    stepId: number,
    stepData: {
      description?: string;
      status?: string;
      owner?: string;
      dueDate?: string | null;
      completedDate?: string | null;
    }
  ): Promise<CEMarkingData> {
    try {
      // Backend expects a simple object with the step update fields
      // The controller will handle updating the specific step by ID
      const updateData = {
        conformitySteps: [{
          id: stepId,
          ...stepData
        }]
      } as any; // Using 'any' here because backend expects a different format

      return await this.updateCEMarking(projectId, updateData);
    } catch (error) {
      console.error("Error updating conformity step:", error);
      throw error;
    }
  },

  /**
   * Update classification and scope
   */
  async updateClassificationAndScope(
    projectId: string,
    data: {
      isHighRiskAISystem?: boolean;
      roleInProduct?: string;
      annexIIICategory?: string;
      intendedPurpose?: string;
    }
  ): Promise<CEMarkingData> {
    return await this.updateCEMarking(projectId, data);
  },

  /**
   * Update declaration of conformity
   */
  async updateDeclaration(
    projectId: string,
    data: {
      declarationStatus?: string;
      signedOn?: string | null;
      signatory?: string | null;
      declarationDocument?: string | null;
    }
  ): Promise<CEMarkingData> {
    return await this.updateCEMarking(projectId, data);
  },

  /**
   * Update EU registration
   */
  async updateRegistration(
    projectId: string,
    data: {
      registrationStatus?: string;
      euRegistrationId?: string | null;
      registrationDate?: string | null;
      euRecordUrl?: string | null;
    }
  ): Promise<CEMarkingData> {
    return await this.updateCEMarking(projectId, data);
  },

  /**
   * Get all available policies
   */
  async getAllPolicies(): Promise<any[]> {
    try {
      const response = await CustomAxios.get('/policies');
      // The policies API returns { message: "OK", data: [...] }
      // Extract the data array from the wrapped response
      if (response.data && response.data.data) {
        return response.data.data;
      }
      // Fallback in case the response format is different
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching policies:", error);
      throw error;
    }
  },

  /**
   * Get all available evidence/files
   */
  async getAllEvidences(): Promise<any[]> {
    try {
      const response = await CustomAxios.get('/files');
      // The files API returns the array directly (not wrapped)
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
      console.error("Error fetching evidence:", error);
      throw error;
    }
  },

  /**
   * Update linked policies
   */
  async updateLinkedPolicies(
    projectId: string,
    policyIds: number[]
  ): Promise<CEMarkingData> {
    return await this.updateCEMarking(projectId, {
      linkedPolicies: policyIds,
      policiesLinked: policyIds.length
    } as any);
  },

  /**
   * Update linked evidence
   */
  async updateLinkedEvidences(
    projectId: string,
    evidenceIds: number[]
  ): Promise<CEMarkingData> {
    return await this.updateCEMarking(projectId, {
      linkedEvidences: evidenceIds,
      evidenceLinked: evidenceIds.length
    } as any);
  },
};