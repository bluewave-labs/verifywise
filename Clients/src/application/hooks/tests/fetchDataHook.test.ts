import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchData } from "../fetchDataHook";

vi.mock("../../repository/entity.repository", () => ({
  getAllEntities: vi.fn(),
}));

import { getAllEntities } from "../../repository/entity.repository";

describe("fetchData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call getAllEntities and setData with response.data (success path)", async () => {
    const setData = vi.fn();
    const routeUrl = "/api/entities";

    (getAllEntities as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
    });

    await fetchData(routeUrl, setData);

    expect(getAllEntities).toHaveBeenCalledTimes(1);
    expect(getAllEntities).toHaveBeenCalledWith({ routeUrl });

    expect(setData).toHaveBeenCalledTimes(1);
    expect(setData).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it("should log an error when getAllEntities throws (catch path)", async () => {
    const setData = vi.fn();
    const routeUrl = "/api/entities";
    const err = new Error("boom");

    (getAllEntities as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await fetchData(routeUrl, setData);

    expect(setData).not.toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Error fetching data from ${routeUrl}:`,
      err
    );

    consoleSpy.mockRestore();
  });
});
