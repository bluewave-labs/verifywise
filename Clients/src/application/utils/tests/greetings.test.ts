import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSpecialDayGreeting, getTimeBasedGreeting } from "../greetings";

describe("greetings", () => {
  beforeEach(() => {
    // Control time deterministically
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("getSpecialDayGreeting", () => {
    it("returns exact match greeting when date exists in specialDays map", () => {
      const res = getSpecialDayGreeting(1, 1, "Walber");
      expect(res).not.toBeNull();
      expect(res?.greetingText).toBe("Happy New Year");
      expect(res?.text).toContain("Walber");
      expect(res?.icon).toBe("🎉");
    });

    it("returns range greeting for May 1-7 (World Password Day)", () => {
      const res = getSpecialDayGreeting(5, 3, "Walber");
      expect(res).toEqual({
        icon: "🔐",
        text: "Happy World Password Day, Walber! 🔐",
        greetingText: "Happy World Password Day",
      });
    });

    it("returns range greeting for Aug 1-7 (International Beer Day)", () => {
      const res = getSpecialDayGreeting(8, 7, "Walber");
      expect(res).toEqual({
        icon: "🍺",
        text: "Happy International Beer Day, Walber! 🍺",
        greetingText: "Happy International Beer Day",
      });
    });

    it("returns null when no exact date or range matches", () => {
      expect(getSpecialDayGreeting(6, 20, "Walber")).toBeNull();
    });
  });

  describe("getTimeBasedGreeting - displayName resolution", () => {
    it("prefers userToken.name over userName and email", () => {
      // Local time: Jan 15 2026 10:00
      vi.setSystemTime(new Date(2026, 0, 15, 10, 0, 0));

      const res = getTimeBasedGreeting("FallbackName", {
        name: "TokenName",
        email: "emailname@example.com",
      });

      expect(res.text).toContain("TokenName");
      expect(res.greetingText).toBe("Good morning");
      expect(res.icon).toBe("☀️");
    });

    it("uses userName when token name is missing", () => {
      // Local time: Jan 15 2026 13:00
      vi.setSystemTime(new Date(2026, 0, 15, 13, 0, 0));

      const res = getTimeBasedGreeting("UserName", { email: "emailname@example.com" });

      expect(res.text).toContain("UserName");
      expect(res.greetingText).toBe("Good afternoon");
      expect(res.icon).toBe("☀️");
    });

    it("uses email prefix when userName missing and token email exists", () => {
      // Local time: Jan 15 2026 18:00
      vi.setSystemTime(new Date(2026, 0, 15, 18, 0, 0));

      const res = getTimeBasedGreeting(undefined, { email: "walber2903@example.com" });

      expect(res.text).toContain("walber2903");
      expect(res.greetingText).toBe("Good evening");
      expect(res.icon).toBe("🌅");
    });

    it('falls back to "there" when no userName or token info', () => {
      // Local time: Jan 15 2026 23:00
      vi.setSystemTime(new Date(2026, 0, 15, 23, 0, 0));

      const res = getTimeBasedGreeting(undefined, null);

      expect(res.text).toContain("there");
      expect(res.greetingText).toBe("Good night");
      expect(res.icon).toBe("🌙");
    });
  });

  describe("getTimeBasedGreeting - special day override", () => {
    it("returns special day greeting if today matches a special day", () => {
      // Local time: Jan 1 2026 10:00 (Happy New Year)
      vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));

      const res = getTimeBasedGreeting("Walber", null);

      expect(res.greetingText).toBe("Happy New Year");
      expect(res.icon).toBe("🎉");
      expect(res.text).toContain("Walber");
    });
  });

  describe("getTimeBasedGreeting - time buckets", () => {
    it("morning: 05:00-11:59", () => {
      vi.setSystemTime(new Date(2026, 0, 15, 5, 0, 0));
      const res = getTimeBasedGreeting("Walber", null);
      expect(res.greetingText).toBe("Good morning");
      expect(res.icon).toBe("☀️");
    });

    it("afternoon: 12:00-16:59", () => {
      vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
      const res = getTimeBasedGreeting("Walber", null);
      expect(res.greetingText).toBe("Good afternoon");
      expect(res.icon).toBe("☀️");
    });

    it("evening: 17:00-21:59", () => {
      vi.setSystemTime(new Date(2026, 0, 15, 17, 0, 0));
      const res = getTimeBasedGreeting("Walber", null);
      expect(res.greetingText).toBe("Good evening");
      expect(res.icon).toBe("🌅");
    });

    it("night: 22:00-00:59 => Good night", () => {
      vi.setSystemTime(new Date(2026, 0, 15, 22, 0, 0));
      const res = getTimeBasedGreeting("Walber", null);
      expect(res.greetingText).toBe("Good night");
      expect(res.icon).toBe("🌙");
    });

    it("late night: 01:00-04:59 => stable late-night message based on minutes", () => {
      // minutes=3 => index 3 % 5 = 3 => "Coffee might be needed"
      vi.setSystemTime(new Date(2026, 0, 15, 2, 3, 0));
      const res = getTimeBasedGreeting("Walber", null);

      expect(res.greetingText).toBe("Coffee might be needed");
      expect(res.icon).toBe("🌙");
      expect(res.text).toContain("Walber");
    });
  });
});
