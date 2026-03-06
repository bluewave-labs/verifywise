import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "../useAuth";

// Mock react-redux useSelector
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

// Mock extractUserToken
vi.mock("../../tools/extractToken", () => ({
  extractUserToken: vi.fn(),
}));

import { useSelector } from "react-redux";
import { extractUserToken } from "../../tools/extractToken";

type MockFn = ReturnType<typeof vi.fn>;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when token is missing", () => {
    // selector gets state.auth?.authToken -> undefined
    (useSelector as unknown as MockFn).mockImplementation((selector: any) =>
      selector({ auth: {} })
    );

    const { result } = renderHook(() => useAuth());

    expect(extractUserToken).not.toHaveBeenCalled();

    expect(result.current.token).toBeUndefined();
    expect(result.current.userToken).toBeNull();
    expect(result.current.userRoleName).toBe("");
    expect(result.current.userId).toBeNull();
    expect(result.current.organizationId).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("parses token and returns user fields when token exists", () => {
    (useSelector as unknown as MockFn).mockImplementation((selector: any) =>
      selector({ auth: { authToken: "jwt-token" } })
    );

    (extractUserToken as unknown as MockFn).mockReturnValueOnce({
      roleName: "admin",
      id: "123",
      organizationId: "456",
    });

    const { result } = renderHook(() => useAuth());

    expect(extractUserToken).toHaveBeenCalledTimes(1);
    expect(extractUserToken).toHaveBeenCalledWith("jwt-token");

    expect(result.current.token).toBe("jwt-token");
    expect(result.current.userToken).toEqual({
      roleName: "admin",
      id: "123",
      organizationId: "456",
    });

    expect(result.current.userRoleName).toBe("admin");
    expect(result.current.userId).toBe(123);
    expect(result.current.organizationId).toBe(456);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("uses fallbacks when roleName/id missing; still runs parseInt branch when values exist", () => {
    (useSelector as unknown as MockFn).mockImplementation((selector: any) =>
      selector({ auth: { authToken: "jwt-token-2" } })
    );

    // roleName missing -> ""
    // id present but non-numeric -> parseInt runs -> NaN
    // organizationId missing -> null
    (extractUserToken as unknown as MockFn).mockReturnValueOnce({
      id: "abc",
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.userRoleName).toBe("");
    expect(Number.isNaN(result.current.userId as any)).toBe(true);
    expect(result.current.organizationId).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
