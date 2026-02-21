import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mocks do repository (precisa bater exatamente com o import do hook)
const fetchSettingsMock = vi.fn();
const patchSettingsMock = vi.fn();

vi.mock("../../repository/featureSettings.repository", () => {
  return {
    getFeatureSettings: (...args: any[]) => fetchSettingsMock(...args),
    updateFeatureSettings: (...args: any[]) => patchSettingsMock(...args),
  };
});

// Importa o hook depois dos mocks
import { useFeatureSettings } from "../useFeatureSettings";

describe("useFeatureSettings", () => {
  beforeEach(() => {
    fetchSettingsMock.mockReset();
    patchSettingsMock.mockReset();
  });

  it("should fetch settings on mount and update loading/featureSettings", async () => {
    const settings = { lifecycle_enabled: true } as any;
    fetchSettingsMock.mockResolvedValue(settings);

    const { result } = renderHook(() => useFeatureSettings());

    // imediatamente após mount
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.featureSettings).toBe(null);

    // aguarda concluir fetch
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSettingsMock).toHaveBeenCalledTimes(1);
    expect(result.current.featureSettings).toEqual(settings);
    expect(result.current.error).toBe(null);
  });

  it("should set error when fetch fails and stop loading", async () => {
    fetchSettingsMock.mockRejectedValue(new Error("Boom"));

    const { result } = renderHook(() => useFeatureSettings());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSettingsMock).toHaveBeenCalledTimes(1);
    expect(result.current.featureSettings).toBe(null);
    expect(result.current.error).toBe("Boom");
  });

  it("refresh should re-fetch and clear previous error", async () => {
    fetchSettingsMock
      .mockRejectedValueOnce(new Error("First fail"))
      .mockResolvedValueOnce({ lifecycle_enabled: false });

    const { result } = renderHook(() => useFeatureSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("First fail");

    await act(async () => {
      await result.current.refresh?.(); 
    });

    await waitFor(() => {
      expect(fetchSettingsMock).toHaveBeenCalledTimes(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.featureSettings).toEqual({ lifecycle_enabled: false });
    });
  });

  it("updateSettings should call patchSettings, update state, and return updated value", async () => {
    const initial = { lifecycle_enabled: false } as any;
    const updated = { lifecycle_enabled: true } as any;

    fetchSettingsMock.mockResolvedValue(initial);
    patchSettingsMock.mockResolvedValue(updated);

    const { result } = renderHook(() => useFeatureSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.featureSettings).toEqual(initial);

    let returned: any;
    await act(async () => {
      returned = await result.current.updateSettings({ lifecycle_enabled: true });
    });

    expect(patchSettingsMock).toHaveBeenCalledTimes(1);
    expect(patchSettingsMock).toHaveBeenCalledWith({ lifecycle_enabled: true });

    expect(returned).toEqual(updated);
    expect(result.current.featureSettings).toEqual(updated);
  });

  it("should set default error message when fetch throws non-Error value", async () => {
    fetchSettingsMock.mockRejectedValue("some string error");

    const { result } = renderHook(() => useFeatureSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load feature settings");
  });

  it("updateSettings should propagate errors from patchSettings (no internal catch)", async () => {
    fetchSettingsMock.mockResolvedValue({ lifecycle_enabled: false } as any);
    patchSettingsMock.mockRejectedValue(new Error("Patch failed"));

    const { result } = renderHook(() => useFeatureSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.updateSettings({ lifecycle_enabled: true });
      })
    ).rejects.toThrowError("Patch failed");

    expect(patchSettingsMock).toHaveBeenCalledTimes(1);
  });
});