import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as shadowAiRepo from "../repository/shadowAi.repository";

// ==================== Query Keys ====================

export const shadowAiKeys = {
  all: ["shadow-ai"] as const,
  connectors: () => [...shadowAiKeys.all, "connectors"] as const,
  connector: (id: number) => [...shadowAiKeys.connectors(), id] as const,
  events: (filters?: any) => [...shadowAiKeys.all, "events", filters] as const,
  inventory: (filters?: any) => [...shadowAiKeys.all, "inventory", filters] as const,
  inventoryItem: (id: number) => [...shadowAiKeys.all, "inventory", id] as const,
  policies: () => [...shadowAiKeys.all, "policies"] as const,
  policy: (id: number) => [...shadowAiKeys.policies(), id] as const,
  violations: (filters?: any) => [...shadowAiKeys.all, "violations", filters] as const,
  exceptions: (filters?: any) => [...shadowAiKeys.all, "exceptions", filters] as const,
  reviews: (filters?: any) => [...shadowAiKeys.all, "reviews", filters] as const,
  evidence: () => [...shadowAiKeys.all, "evidence"] as const,
  dashboardSummary: () => [...shadowAiKeys.all, "dashboard", "summary"] as const,
  dashboardTrends: (days?: number) => [...shadowAiKeys.all, "dashboard", "trends", days] as const,
};

// ==================== Connectors ====================

export const useConnectors = () =>
  useQuery({
    queryKey: shadowAiKeys.connectors(),
    queryFn: () => shadowAiRepo.getConnectors(),
    select: (res) => res?.data || [],
    staleTime: 60_000,
  });

export const useCreateConnector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.createConnector({ body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.connectors() }),
  });
};

export const useUpdateConnector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updateConnector({ id, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.connectors() }),
  });
};

export const useDeleteConnector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shadowAiRepo.deleteConnector({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.connectors() }),
  });
};

export const useTestConnector = () =>
  useMutation({ mutationFn: (id: number) => shadowAiRepo.testConnector({ id }) });

export const useSyncConnector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shadowAiRepo.syncConnector({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.connectors() }),
  });
};

// ==================== Events ====================

export const useEvents = (filters?: any) =>
  useQuery({
    queryKey: shadowAiKeys.events(filters),
    queryFn: () => shadowAiRepo.getEvents({ filters }),
    select: (res) => res?.data || { events: [], total: 0 },
    staleTime: 30_000,
  });

export const useIngestEvents = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.ingestEvents({ body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shadowAiKeys.events() });
      qc.invalidateQueries({ queryKey: shadowAiKeys.inventory() });
      qc.invalidateQueries({ queryKey: shadowAiKeys.dashboardSummary() });
    },
  });
};

// ==================== Inventory ====================

export const useInventory = (filters?: any) =>
  useQuery({
    queryKey: shadowAiKeys.inventory(filters),
    queryFn: () => shadowAiRepo.getInventory({ filters }),
    select: (res) => res?.data || { items: [], total: 0 },
    staleTime: 60_000,
  });

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updateInventoryItem({ id, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.inventory() }),
  });
};

// ==================== Policies ====================

export const usePolicies = () =>
  useQuery({
    queryKey: shadowAiKeys.policies(),
    queryFn: () => shadowAiRepo.getPolicies(),
    select: (res) => res?.data || [],
    staleTime: 60_000,
  });

export const useCreatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.createPolicy({ body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.policies() }),
  });
};

export const useUpdatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updatePolicy({ id, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.policies() }),
  });
};

export const useDeletePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shadowAiRepo.deletePolicyApi({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.policies() }),
  });
};

// ==================== Violations ====================

export const useViolations = (filters?: any) =>
  useQuery({
    queryKey: shadowAiKeys.violations(filters),
    queryFn: () => shadowAiRepo.getViolations({ filters }),
    select: (res) => res?.data || { violations: [], total: 0 },
    staleTime: 30_000,
  });

export const useUpdateViolation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updateViolation({ id, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shadowAiKeys.violations() });
      qc.invalidateQueries({ queryKey: shadowAiKeys.dashboardSummary() });
    },
  });
};

// ==================== Exceptions ====================

export const useExceptions = (filters?: any) =>
  useQuery({
    queryKey: shadowAiKeys.exceptions(filters),
    queryFn: () => shadowAiRepo.getExceptions({ filters }),
    select: (res) => res?.data || [],
    staleTime: 60_000,
  });

export const useCreateException = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.createException({ body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.exceptions() }),
  });
};

export const useUpdateException = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updateException({ id, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.exceptions() }),
  });
};

// ==================== Reviews ====================

export const useReviews = (filters?: any) =>
  useQuery({
    queryKey: shadowAiKeys.reviews(filters),
    queryFn: () => shadowAiRepo.getReviews({ filters }),
    select: (res) => res?.data || [],
    staleTime: 60_000,
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.createReview({ body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.reviews() }),
  });
};

export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => shadowAiRepo.updateReview({ id, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.reviews() }),
  });
};

// ==================== Evidence ====================

export const useEvidenceExports = () =>
  useQuery({
    queryKey: shadowAiKeys.evidence(),
    queryFn: () => shadowAiRepo.getEvidenceExports(),
    select: (res) => res?.data || [],
    staleTime: 60_000,
  });

export const useCreateEvidenceExport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => shadowAiRepo.createEvidenceExport({ body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shadowAiKeys.evidence() }),
  });
};

// ==================== Dashboard ====================

export const useDashboardSummary = () =>
  useQuery({
    queryKey: shadowAiKeys.dashboardSummary(),
    queryFn: () => shadowAiRepo.getDashboardSummary(),
    select: (res) => res?.data,
    staleTime: 60_000,
  });

export const useDashboardTrends = (days?: number) =>
  useQuery({
    queryKey: shadowAiKeys.dashboardTrends(days),
    queryFn: () => shadowAiRepo.getDashboardTrends({ days }),
    select: (res) => res?.data,
    staleTime: 60_000,
  });
