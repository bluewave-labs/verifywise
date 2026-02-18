import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboard } from "../useDashboard";

// Mock do React Query inteiro (o essencial)
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(),
  useQuery: vi.fn(),
}));

import { useQueryClient, useQuery } from "@tanstack/react-query";

describe("useDashboard", () => {
  const queryClientMock = {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as any).mockReturnValue(queryClientMock);
  });

  it("fetches dashboard on mount, sets dashboard from response.data and toggles loading (success)", async () => {
    (useQuery as any).mockReturnValue({
      data: { id: "dash-1", name: "Dashboard" },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(useQueryClient).toHaveBeenCalledTimes(1);
    expect(useQuery).toHaveBeenCalledTimes(1);

    // aqui você pode validar o shape básico retornado pelo hook
    expect(result.current.dashboard).toEqual({ id: "dash-1", name: "Dashboard" });
  });

  it("sets loading false and dashboard null when query fails (error)", async () => {
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(useQueryClient).toHaveBeenCalledTimes(1);
    expect(useQuery).toHaveBeenCalledTimes(1);

    expect(result.current.dashboard).toBeNull();
  });
});
