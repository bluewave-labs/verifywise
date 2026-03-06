import { useState, useEffect, useCallback } from "react";
import { friaRepository } from "../repository/fria.repository";

export interface FriaRight {
  id: number;
  right_key: string;
  right_title: string;
  charter_ref: string;
  flagged: boolean;
  severity: number;
  confidence: number;
  impact_pathway: string | null;
  mitigation: string | null;
}

export interface FriaRiskItem {
  id: number;
  fria_id: number;
  risk_description: string;
  likelihood: string | null;
  severity: string | null;
  existing_controls: string | null;
  further_action: string | null;
  linked_project_risk_id: number | null;
  linked_risk_name: string | null;
  sort_order: number;
}

export interface FriaModelLink {
  id: number;
  model_id: number;
  provider: string | null;
  model: string | null;
  version: string | null;
  model_status: string | null;
}

export interface FriaAssessment {
  id: number;
  project_id: number;
  version: number;
  status: string;
  assessment_owner: string | null;
  assessment_date: string | null;
  operational_context: string | null;
  is_high_risk: string | null;
  high_risk_basis: string | null;
  deployer_type: string | null;
  annex_iii_category: string | null;
  first_use_date: string | null;
  review_cycle: string | null;
  period_frequency: string | null;
  fria_rationale: string | null;
  affected_groups: string | null;
  vulnerability_context: string | null;
  group_flags: string[];
  risk_scenarios: string | null;
  provider_info_used: string | null;
  human_oversight: string | null;
  transparency_measures: string | null;
  redress_process: string | null;
  data_governance: string | null;
  legal_review: string | null;
  dpo_review: string | null;
  owner_approval: string | null;
  stakeholders_consulted: string | null;
  consultation_notes: string | null;
  deployment_decision: string | null;
  decision_conditions: string | null;
  completion_pct: number;
  risk_score: number;
  risk_level: string;
  rights_flagged: number;
  project_title: string | null;
  organization_name: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useFria(projectId: string) {
  const [assessment, setAssessment] = useState<FriaAssessment | null>(null);
  const [rights, setRights] = useState<FriaRight[]>([]);
  const [riskItems, setRiskItems] = useState<FriaRiskItem[]>([]);
  const [modelLinks, setModelLinks] = useState<FriaModelLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFria = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await friaRepository.getFria(projectId);
      setAssessment(data.assessment);
      setRights(data.rights || []);
      setRiskItems(data.riskItems || []);
      setModelLinks(data.modelLinks || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load FRIA");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFria();
  }, [fetchFria]);

  const updateAssessment = useCallback(
    async (data: Partial<FriaAssessment>) => {
      if (!projectId) return;
      setIsSaving(true);
      try {
        const updated = await friaRepository.updateFria(projectId, data);
        setAssessment(updated);
      } catch (err: any) {
        setError(err?.message || "Failed to update FRIA");
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  const updateRights = useCallback(
    async (updatedRights: Partial<FriaRight>[]) => {
      if (!assessment) return;
      setIsSaving(true);
      try {
        const result = await friaRepository.updateRights(
          assessment.id,
          updatedRights
        );
        setRights(result);
        // Refresh only the assessment scores without resetting the full data
        const fresh = await friaRepository.getFria(projectId);
        setAssessment(fresh.assessment);
      } catch (err: any) {
        setError(err?.message || "Failed to update rights");
      } finally {
        setIsSaving(false);
      }
    },
    [assessment, projectId]
  );

  const addRiskItem = useCallback(
    async (data: Partial<FriaRiskItem>) => {
      if (!assessment) return;
      setIsSaving(true);
      try {
        await friaRepository.addRiskItem(assessment.id, data);
        // Refresh assessment scores and risk items without resetting rights
        const fresh = await friaRepository.getFria(projectId);
        setAssessment(fresh.assessment);
        setRiskItems(fresh.riskItems || []);
      } catch (err: any) {
        setError(err?.message || "Failed to add risk item");
      } finally {
        setIsSaving(false);
      }
    },
    [assessment, projectId]
  );

  const updateRiskItem = useCallback(
    async (itemId: number, data: Partial<FriaRiskItem>) => {
      if (!assessment) return;
      setIsSaving(true);
      try {
        await friaRepository.updateRiskItem(assessment.id, itemId, data);
        // Refresh assessment scores and risk items without resetting rights
        const fresh = await friaRepository.getFria(projectId);
        setAssessment(fresh.assessment);
        setRiskItems(fresh.riskItems || []);
      } catch (err: any) {
        setError(err?.message || "Failed to update risk item");
      } finally {
        setIsSaving(false);
      }
    },
    [assessment, projectId]
  );

  const deleteRiskItem = useCallback(
    async (itemId: number) => {
      if (!assessment) return;
      setIsSaving(true);
      try {
        await friaRepository.deleteRiskItem(assessment.id, itemId);
        // Refresh assessment scores and risk items without resetting rights
        const fresh = await friaRepository.getFria(projectId);
        setAssessment(fresh.assessment);
        setRiskItems(fresh.riskItems || []);
      } catch (err: any) {
        setError(err?.message || "Failed to delete risk item");
      } finally {
        setIsSaving(false);
      }
    },
    [assessment, projectId]
  );

  const linkModel = useCallback(
    async (modelId: number) => {
      if (!assessment) return;
      try {
        await friaRepository.linkModel(assessment.id, modelId);
        await fetchFria();
      } catch (err: any) {
        setError(err?.message || "Failed to link model");
      }
    },
    [assessment, fetchFria]
  );

  const unlinkModel = useCallback(
    async (modelId: number) => {
      if (!assessment) return;
      try {
        await friaRepository.unlinkModel(assessment.id, modelId);
        await fetchFria();
      } catch (err: any) {
        setError(err?.message || "Failed to unlink model");
      }
    },
    [assessment, fetchFria]
  );

  const submitFria = useCallback(
    async (reason?: string) => {
      if (!assessment) return;
      setIsSaving(true);
      try {
        await friaRepository.submitFria(assessment.id, reason);
        await fetchFria();
      } catch (err: any) {
        setError(err?.message || "Failed to submit FRIA");
      } finally {
        setIsSaving(false);
      }
    },
    [assessment, fetchFria]
  );

  return {
    assessment,
    rights,
    riskItems,
    modelLinks,
    isLoading,
    error,
    isSaving,
    fetchFria,
    updateAssessment,
    updateRights,
    addRiskItem,
    updateRiskItem,
    deleteRiskItem,
    linkModel,
    unlinkModel,
    submitFria,
  };
}
