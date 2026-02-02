import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatRelativeDate } from "../dateFormatter";

// Mock date-fns to make formatRelativeDate deterministic
vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(),
  isValid: vi.fn(),
}));

import { formatDistanceToNow, isValid } from "date-fns";

describe("dateFormatter utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatRelativeDate", () => {
    it('returns "Unknown" when dateString is empty', () => {
      expect(formatRelativeDate("")).toBe("Unknown");
    });

    it('returns "Unknown" when date is invalid (isValid = false)', () => {
      (isValid as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      expect(formatRelativeDate("not-a-date")).toBe("Unknown");
      expect(isValid).toHaveBeenCalledTimes(1);
      expect(formatDistanceToNow).not.toHaveBeenCalled();
    });

    it("returns relative date using date-fns when date is valid", () => {
      (isValid as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (formatDistanceToNow as unknown as ReturnType<typeof vi.fn>).mockReturnValue("5 minutes ago");

      const input = "2026-01-22T12:00:00.000Z";
      const result = formatRelativeDate(input);

      expect(result).toBe("5 minutes ago");
      expect(isValid).toHaveBeenCalledTimes(1);

      expect(formatDistanceToNow).toHaveBeenCalledTimes(1);
      const [passedDate, passedOptions] = (formatDistanceToNow as any).mock.calls[0];

      expect(passedDate).toBeInstanceOf(Date);
      expect((passedDate as Date).toISOString()).toBe(input);
      expect(passedOptions).toEqual({ addSuffix: true });
    });
  });
});
