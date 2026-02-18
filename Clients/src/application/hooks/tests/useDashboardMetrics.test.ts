import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboardMetrics } from "../useDashboardMetrics";

vi.mock("../../repository/entity.repository", () => ({
  getAllEntities: vi.fn(),
  getEntityById: vi.fn(),
}));

import { getAllEntities, getEntityById } from "../../repository/entity.repository";

type MockFn = ReturnType<typeof vi.fn>;

const CACHE_KEY = "dashboard_metrics_cache";

function setCache(cache: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Type guard helper to silence TS "possibly null" safely
function assertNotNull<T>(value: T | null | undefined, name: string): asserts value is T {
  expect(value, `${name} should not be null`).not.toBeNull();
  expect(value, `${name} should not be undefined`).not.toBeUndefined();
}

describe("useDashboardMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips fetching on mount when critical cache keys are fresh (covers shouldSkipFetch early return)", async () => {
    const now = Date.now();

    setCache({
      trainingMetrics: { data: { total: 1 }, timestamp: now },
      policyStatusMetrics: { data: { total: 2 }, timestamp: now },
      incidentStatusMetrics: { data: { total: 3 }, timestamp: now },
      evidenceHubMetrics: { data: { total: 4 }, timestamp: now },
      modelLifecycleMetrics: { data: { total: 5 }, timestamp: now },
    });

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAllEntities).not.toHaveBeenCalled();
    expect(getEntityById).not.toHaveBeenCalled();
  });

  it("with stale (but usable) cache, uses stale-while-revalidate (isRevalidating true) until fetch completes", async () => {
    const stale = Date.now() - 60_000;
    setCache({
      trainingMetrics: { data: { total: 99 }, timestamp: stale },
      policyStatusMetrics: { data: { total: 88 }, timestamp: stale },
      incidentStatusMetrics: { data: { total: 77 }, timestamp: stale },
      evidenceHubMetrics: { data: { total: 66 }, timestamp: stale },
      modelLifecycleMetrics: { data: { total: 55 }, timestamp: stale },
    });

    (getAllEntities as unknown as MockFn).mockResolvedValue({ data: [] });
    (getEntityById as unknown as MockFn).mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => expect(result.current.isRevalidating).toBe(true));
    await waitFor(() => expect(result.current.isRevalidating).toBe(false));
    expect(result.current.loading).toBe(false);
  });

  it("covers training metrics mapping + fallback when response is not an array", async () => {
    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/training") {
        return {
          data: [
            { training_type: "Staff", status: "completed" },
            { training_type: "Staff", status: "in_progress" },
            { training_type: "Third party", status: "completed" },
            { training_type: "Vendors", status: "assigned" },
            { training_type: undefined, status: "completed" },
          ],
        };
      }
      return { data: [] };
    });

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchTrainingMetrics();
    });

    assertNotNull(result.current.trainingMetrics, "trainingMetrics");
    expect(result.current.trainingMetrics.total).toBeGreaterThan(0);
    expect(result.current.trainingMetrics.distribution).toBeTruthy();

    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/training") return { data: { not: "array" } };
      return { data: [] };
    });

    await act(async () => {
      await result.current.fetchTrainingMetrics();
    });

    assertNotNull(result.current.trainingMetrics, "trainingMetrics");
    expect(result.current.trainingMetrics.total).toBe(0);
  });

  it("covers tasks metrics recent + fallback (TaskMetrics has NO distribution)", async () => {
    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/tasks") {
        return {
          data: [
            { id: 1, title: "A", status: "completed", priority: "high", created_at: "2024-01-01" },
            { id: 2, title: "B", status: "in_progress", priority: "low", created_at: "2024-01-02" },
            { id: 3, title: "C", status: "todo", priority: "medium", created_at: "2024-01-03" },
          ],
        };
      }
      return { data: [] };
    });

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchTaskMetrics();
    });

    assertNotNull(result.current.taskMetrics, "taskMetrics");
    expect(result.current.taskMetrics.total).toBe(3);
    expect(result.current.taskMetrics.recent.length).toBeGreaterThan(0);

    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/tasks") return { data: {} };
      return { data: [] };
    });

    await act(async () => {
      await result.current.fetchTaskMetrics();
    });

    assertNotNull(result.current.taskMetrics, "taskMetrics");
    expect(result.current.taskMetrics.total).toBe(0);
  });

  it("covers use case metrics sorting + fallback", async () => {
    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/projects") {
        return {
          data: [
            { id: 1, project_title: "Old", last_updated: "2024-01-01T00:00:00Z", created_at: "2024-01-01T00:00:00Z" },
            { id: 2, project_title: "New", last_updated: "2024-02-01T00:00:00Z", created_at: "2024-02-01T00:00:00Z" },
            { id: 3, project_title: "CreatedOnly", created_at: "2024-03-01T00:00:00Z" },
          ],
        };
      }
      return { data: [] };
    });

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchUseCaseMetrics();
    });

    assertNotNull(result.current.useCaseMetrics, "useCaseMetrics");
    expect(result.current.useCaseMetrics.total).toBe(3);
    expect(result.current.useCaseMetrics.recent[0].title).toBe("CreatedOnly");

    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/projects") return { data: {} };
      return { data: [] };
    });

    await act(async () => {
      await result.current.fetchUseCaseMetrics();
    });

    assertNotNull(result.current.useCaseMetrics, "useCaseMetrics");
    expect(result.current.useCaseMetrics.total).toBe(0);
  });

  // ✅ FIX #2: organizational frameworks uses /projects + /frameworks + getEntityById(progress endpoints)
  it("covers organizational frameworks using /projects + /frameworks + getEntityById(progress endpoints) + sorting", async () => {
    (getAllEntities as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      if (routeUrl === "/projects") {
        return {
          data: [
            {
              id: 1,
              is_organizational: true,
              framework: [
                { framework_id: "101", project_framework_id: 111 }, // ISO 42001
                { framework_id: "102", project_framework_id: 222 }, // ISO 27001
                { framework_id: "103", project_framework_id: 333 }, // NIST AI RMF
              ],
            },
          ],
        };
      }

      if (routeUrl === "/frameworks") {
        return {
          data: [
            { id: 101, name: "ISO 42001" },
            { id: 102, name: "ISO 27001" },
            { id: 103, name: "NIST AI RMF" },
          ],
        };
      }

      return { data: [] };
    });

    (getEntityById as unknown as MockFn).mockImplementation(async ({ routeUrl }: { routeUrl: string }) => {
      // ISO 42001 progress
      if (routeUrl === "/iso-42001/clauses/progress/111") {
        return { data: { totalSubclauses: 10, doneSubclauses: 4 } };
      }
      if (routeUrl === "/iso-42001/annexes/progress/111") {
        return { data: { totalAnnexcategories: 5, doneAnnexcategories: 2 } };
      }

      // ISO 27001 progress
      if (routeUrl === "/iso-27001/clauses/progress/222") {
        return { data: { totalSubclauses: 20, doneSubclauses: 7 } };
      }
      if (routeUrl === "/iso-27001/annexes/progress/222") {
        return { data: { totalAnnexControls: 30, doneAnnexControls: 9 } };
      }

      // NIST breakdown (note: hook calls without id)
      if (routeUrl === "/nist-ai-rmf/status-breakdown") {
        return {
          data: {
            notStarted: 1,
            draft: 2,
            inProgress: 3,
            awaitingReview: 0,
            awaitingApproval: 0,
            implemented: 4,
            needsRework: 0,
          },
        };
      }

      return { data: null };
    });

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchOrganizationalFrameworks();
    });

    expect(result.current.organizationalFrameworks.length).toBe(3);

    // Sorting rules in hook:
    // - ISO 42001 first
    // - ISO 27001 middle
    // - NIST last
    expect(result.current.organizationalFrameworks[0].frameworkName.toLowerCase()).toContain("iso 42001");
    expect(result.current.organizationalFrameworks[1].frameworkName.toLowerCase()).toContain("iso 27001");
    expect(result.current.organizationalFrameworks[2].frameworkName.toLowerCase()).toContain("nist");

    const iso42001 = result.current.organizationalFrameworks.find((f) => f.frameworkName.toLowerCase().includes("iso 42001"))!;
    expect(iso42001.clauseProgress).toEqual({ totalSubclauses: 10, doneSubclauses: 4 });
    expect(iso42001.annexProgress).toEqual({ totalAnnexcategories: 5, doneAnnexcategories: 2 });

    const iso27001 = result.current.organizationalFrameworks.find((f) => f.frameworkName.toLowerCase().includes("iso 27001"))!;
    expect(iso27001.clauseProgress).toEqual({ totalSubclauses: 20, doneSubclauses: 7 });
    expect(iso27001.annexProgress).toEqual({ totalAnnexControls: 30, doneAnnexControls: 9 });

    const nist = result.current.organizationalFrameworks.find((f) => f.frameworkName.toLowerCase().includes("nist"))!;
    expect(nist.nistStatusBreakdown?.inProgress).toBe(3);
    expect(nist.nistStatusBreakdown?.implemented).toBe(4);
  });

  it("covers dev-only warn branch for rejected result in fetchAllMetrics (lines 1239-1241)", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const settledSpy = vi.spyOn(Promise, "allSettled").mockResolvedValue([
      { status: "rejected", reason: new Error("rejected metric") } as any,
    ]);

    (getAllEntities as unknown as MockFn).mockResolvedValue({ data: [] });
    (getEntityById as unknown as MockFn).mockResolvedValue({ data: {} });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchAllMetrics(true);
    });

    expect(warnSpy).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
    settledSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
