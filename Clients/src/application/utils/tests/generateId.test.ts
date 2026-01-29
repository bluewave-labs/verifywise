import { describe, it, expect, vi, afterEach } from "vitest";
import { generateId } from "../generateId";

describe("generateId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a string with length 9", () => {
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i * 37) % 256;
      }
      return arr;
    });
    vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });

    const id = generateId();

    expect(typeof id).toBe("string");
    expect(id).toHaveLength(9);
  });

  it("generates a deterministic id when crypto.getRandomValues is mocked", () => {
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      // Fill with specific values to get predictable output
      arr[0] = 10;
      arr[1] = 20;
      arr[2] = 30;
      arr[3] = 40;
      arr[4] = 50;
      arr[5] = 60;
      arr[6] = 70;
      return arr;
    });
    vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBe(id2);
  });

  it("generates different ids when crypto.getRandomValues returns different values", () => {
    let callCount = 0;
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      callCount++;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (callCount * 17 + i * 31) % 256;
      }
      return arr;
    });
    vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(mockGetRandomValues).toHaveBeenCalledTimes(2);
  });

  it("uses only base36 characters (a-z0-9)", () => {
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 255;
      }
      return arr;
    });
    vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });

    const id = generateId();

    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
