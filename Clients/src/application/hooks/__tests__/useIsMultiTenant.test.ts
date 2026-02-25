import { renderHook, waitFor } from "@testing-library/react";

// Mock the organization repository
vi.mock("../../repository/organization.repository", () => ({
  checkOrganizationExists: vi.fn(),
}));

import { checkOrganizationExists } from "../../repository/organization.repository";

const mockCheckOrganizationExists = vi.mocked(checkOrganizationExists);

// We need to re-import the hook each time to reset module-level cache
async function importFresh() {
  vi.resetModules();
  const mod = await import("../useIsMultiTenant");
  return mod.useIsMultiTenant;
}

describe("useIsMultiTenant", () => {
  const originalHostname = window.location.hostname;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hostname to localhost
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname: "localhost" },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname: originalHostname },
      writable: true,
    });
  });

  it("should return loading=true initially, then false", async () => {
    mockCheckOrganizationExists.mockResolvedValue(true);

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should return isMultiTenant=false when org exists and hostname is localhost", async () => {
    mockCheckOrganizationExists.mockResolvedValue(true);

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // org exists + localhost → single-tenant
    expect(result.current.isMultiTenant).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should return isMultiTenant=true when hostname is app.verifywise.ai", async () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname: "app.verifywise.ai" },
      writable: true,
    });
    mockCheckOrganizationExists.mockResolvedValue(true);

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isMultiTenant).toBe(true);
  });

  it("should return isMultiTenant=true when hostname is test.verifywise.ai", async () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hostname: "test.verifywise.ai" },
      writable: true,
    });
    mockCheckOrganizationExists.mockResolvedValue(true);

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isMultiTenant).toBe(true);
  });

  it("should return isMultiTenant=true when org does NOT exist", async () => {
    mockCheckOrganizationExists.mockResolvedValue(false);

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // !organizationExists → multi-tenant
    expect(result.current.isMultiTenant).toBe(true);
  });

  it("should default to multi-tenant on API error (safety)", async () => {
    // Suppress expected console noise from error-handling code path
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCheckOrganizationExists.mockRejectedValue(new Error("Network error"));

    const useIsMultiTenant = await importFresh();
    const { result } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isMultiTenant).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it("should use cached value within 5-minute window", async () => {
    mockCheckOrganizationExists.mockResolvedValue(true);

    // First render to populate cache
    const useIsMultiTenant = await importFresh();
    const { result: result1 } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    expect(mockCheckOrganizationExists).toHaveBeenCalledTimes(1);

    // Second render should use cache (same module, cache still alive)
    const { result: result2 } = renderHook(() => useIsMultiTenant());

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    // Should not call API again (cache hit)
    expect(mockCheckOrganizationExists).toHaveBeenCalledTimes(1);
    expect(result2.current.isMultiTenant).toBe(false);
  });
});
