import { describe, it, expect, vi, afterEach } from "vitest";
import { generateId } from "../generateId";

describe("generateId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a string with length 9", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const id = generateId();

    expect(typeof id).toBe("string");
    expect(id).toHaveLength(9);
  });

  it("generates a deterministic id when Math.random is mocked", () => {
    // 0.5 -> base36 = "0.i"
    // substr(2, 9) => "i"
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const id = generateId();

    expect(id).toBe("i");
  });

  it("generates different ids when Math.random changes", () => {
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2);

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(randomSpy).toHaveBeenCalledTimes(2);
  });

  it("uses only base36 characters (a-z0-9)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.987654321);

    const id = generateId();

    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
