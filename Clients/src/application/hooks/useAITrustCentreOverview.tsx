import { useState, useEffect, useCallback } from 'react';
import { getAITrustCentreOverview, createAITrustCentreOverview, updateAITrustCentreOverview } from '../repository/aiTrustCentre.repository';

interface AITrustCentreOverviewData {
  intro?: {
    intro_visible: boolean;
    purpose_visible: boolean;
    purpose_text?: string;
    our_statement_visible: boolean;
    our_statement_text?: string;
    our_mission_visible: boolean;
    our_mission_text?: string;
  };
  compliance_badges?: {
    badges_visible: boolean;
    SOC2_Type_I: boolean;
    SOC2_Type_II: boolean;
    ISO_27001: boolean;
    ISO_42001: boolean;
    CCPA: boolean;
    GDPR: boolean;
    HIPAA: boolean;
    EU_AI_Act: boolean;
  };
  company_info?: {
    company_info_visible: boolean;
    background_visible: boolean;
    background_text?: string;
    core_benefit_visible: boolean;
    core_benefit_text?: string;
    compliance_doc_visible: boolean;
    compliance_doc_text?: string;
  };
  terms_and_contact?: {
    is_visible: boolean;
    has_terms_of_service: boolean;
    terms_of_service?: string;
    has_privacy_policy: boolean;
    privacy_policy?: string;
    has_company_email: boolean;
    company_email?: string;
  };
}

interface UseAITrustCentreOverviewReturn {
  data: AITrustCentreOverviewData | null;
  loading: boolean;
  error: string | null;
  fetchOverview: () => Promise<void>;
  saveOverview: (data: AITrustCentreOverviewData) => Promise<void>;
  updateOverview: (data: Partial<AITrustCentreOverviewData>) => Promise<void>;
}

export const useAITrustCentreOverview = (): UseAITrustCentreOverviewReturn => {
  const [data, setData] = useState<AITrustCentreOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAITrustCentreOverview();
      if (response && response.data) {
        setData(response.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI Trust Centre overview');
      console.error('Error fetching AI Trust Centre overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveOverview = useCallback(async (overviewData: AITrustCentreOverviewData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createAITrustCentreOverview(overviewData);
      if (response && response.data) {
        setData(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save AI Trust Centre overview');
      console.error('Error saving AI Trust Centre overview:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOverview = useCallback(async (overviewData: Partial<AITrustCentreOverviewData>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateAITrustCentreOverview(overviewData);
      console.log('Update response:', response);
    } catch (err: any) {
      setError(err.message || 'Failed to update AI Trust Centre overview');
      console.error('Error updating AI Trust Centre overview:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    data,
    loading,
    error,
    fetchOverview,
    saveOverview,
    updateOverview,
  };
}; 