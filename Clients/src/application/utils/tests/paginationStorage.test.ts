import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPaginationRowCount,
  setPaginationRowCount,
  clearPaginationRowCount,
  clearAllPaginationSettings,
} from "../paginationStorage";

describe("paginationStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("getPaginationRowCount", () => {
    it("returns defaultCount when nothing stored", () => {
      expect(getPaginationRowCount("users", 10)).toBe(10);
    });

    it("returns stored value when valid positive integer", () => {
      localStorage.setItem("pagination_rows_users", "25");
      expect(getPaginationRowCount("users", 10)).toBe(25);
    });

    it("returns defaultCount when stored value is NaN", () => {
      localStorage.setItem("pagination_rows_users", "abc");
      expect(getPaginationRowCount("users", 10)).toBe(10);
    });

    it("returns defaultCount when stored value is 0 or negative", () => {
      localStorage.setItem("pagination_rows_users", "0");
      expect(getPaginationRowCount("users", 10)).toBe(10);

      localStorage.setItem("pagination_rows_users", "-5");
      expect(getPaginationRowCount("users", 10)).toBe(10);
    });

    it("returns defaultCount and warns when localStorage.getItem throws", () => {
      // IMPORTANT: spy on Storage.prototype in jsdom
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("boom");
      });

      expect(getPaginationRowCount("users", 10)).toBe(10);
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to retrieve pagination setting from localStorage:",
        expect.any(Error)
      );
    });

    it("uses defaultCount=10 when not provided", () => {
      expect(getPaginationRowCount("users")).toBe(10);
    });
  });

  describe("setPaginationRowCount", () => {
    it("stores rowCount as string", () => {
      setPaginationRowCount("users", 50);
      expect(localStorage.getItem("pagination_rows_users")).toBe("50");
    });

    it("warns when localStorage.setItem throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("boom");
      });

      setPaginationRowCount("users", 50);

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to save pagination setting to localStorage:",
        expect.any(Error)
      );
    });
  });

  describe("clearPaginationRowCount", () => {
    it("removes the key for a table", () => {
      localStorage.setItem("pagination_rows_users", "25");

      clearPaginationRowCount("users");

      expect(localStorage.getItem("pagination_rows_users")).toBeNull();
    });

    it("warns when localStorage.removeItem throws", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("boom");
      });

      clearPaginationRowCount("users");

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to clear pagination setting from localStorage:",
        expect.any(Error)
      );
    });
  });

  describe("clearAllPaginationSettings", () => {
    it("removes only keys that start with prefix", () => {
      localStorage.setItem("pagination_rows_users", "10");
      localStorage.setItem("pagination_rows_projects", "20");
      localStorage.setItem("something_else", "keep");

      clearAllPaginationSettings();

      expect(localStorage.getItem("pagination_rows_users")).toBeNull();
      expect(localStorage.getItem("pagination_rows_projects")).toBeNull();
      expect(localStorage.getItem("something_else")).toBe("keep");
    });

    it("does nothing when there are no pagination keys", () => {
      localStorage.setItem("other_key", "x");

      clearAllPaginationSettings();

      expect(localStorage.getItem("other_key")).toBe("x");
    });

    it("warns when Object.keys(localStorage) throws (without breaking vitest)", () => {
      const realKeys = Object.keys;

      vi.spyOn(Object, "keys").mockImplementation(((obj: any) => {
        // Only throw for localStorage; otherwise behave normally
        if (obj === localStorage) throw new Error("boom");
        return realKeys(obj);
      }) as any);

      clearAllPaginationSettings();

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to clear all pagination settings from localStorage:",
        expect.any(Error)
      );
    });
  });
});
