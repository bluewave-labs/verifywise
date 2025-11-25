import axios from "axios";

export interface NISTSubcategoryRisk {
  id: number;
  risk: string;
  risk_name?: string;
  description?: string;
  owner_name?: string;
  owner?: number;
  risk_level?: string;
  probability?: string;
  impact?: string;
}

export interface LinkRisksRequest {
  riskIds: number[];
}

export interface UpdateRiskLinksRequest {
  risksDelete?: number[];
  risksMitigated?: number[];
}

/**
 * Get all risks linked to a NIST AI RMF subcategory
 */
export const getRisksForNISTSubcategory = async (subcategoryId: number): Promise<NISTSubcategoryRisk[]> => {
  try {
    const response = await axios.get(`/api/nist-ai-rmf/subcategories/${subcategoryId}/risks`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching risks for NIST subcategory:", error);
    throw error;
  }
};

/**
 * Link risks to a NIST AI RMF subcategory
 */
export const linkRisksToNISTSubcategory = async (
  subcategoryId: number,
  riskIds: number[]
): Promise<number[]> => {
  try {
    const response = await axios.post(`/api/nist-ai-rmf/subcategories/${subcategoryId}/risks`, {
      riskIds,
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error linking risks to NIST subcategory:", error);
    throw error;
  }
};

/**
 * Update risk links for a NIST AI RMF subcategory
 */
export const updateNISTSubcategoryRiskLinks = async (
  subcategoryId: number,
  updateData: UpdateRiskLinksRequest
): Promise<any> => {
  try {
    const response = await axios.put(`/api/nist-ai-rmf/subcategories/${subcategoryId}/risks`, updateData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating NIST subcategory risk links:", error);
    throw error;
  }
};

/**
 * Remove a specific risk from a NIST AI RMF subcategory
 */
export const removeRiskFromNISTSubcategory = async (
  subcategoryId: number,
  riskId: number
): Promise<any> => {
  try {
    const response = await axios.delete(`/api/nist-ai-rmf/subcategories/${subcategoryId}/risks/${riskId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error removing risk from NIST subcategory:", error);
    throw error;
  }
};