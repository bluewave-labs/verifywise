/**
 * @fileoverview Tests for Super Admin Middleware
 *
 * Tests authorization middleware for super-admin access control.
 *
 * @module tests/superAdmin.middleware.spec
 */

import { Request, Response, NextFunction } from "express";

// Mock user.utils
const mockGetUserByIdQuery = jest.fn();
jest.mock("../../utils/user.utils", () => ({
  getUserByIdQuery: (...args: any[]) => mockGetUserByIdQuery(...args),
}));

// Mock STATUS_CODE
const mockStatusCode: Record<number, (data: any) => any> = {
  401: (data: any) => ({ status: 401, data }),
  403: (data: any) => ({ status: 403, data }),
  404: (data: any) => ({ status: 404, data }),
  500: (data: any) => ({ status: 500, data }),
};

jest.mock("../../utils/statusCode.utils", () => ({
  STATUS_CODE: mockStatusCode,
}));

// Import after mocking
import {
  requireSuperAdmin,
  checkSuperAdmin,
} from "../../middleware/superAdmin.middleware";

describe("Super Admin Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      userId: undefined,
      isSuperAdmin: undefined,
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();
    mockGetUserByIdQuery.mockReset();
  });

  describe("requireSuperAdmin", () => {
    it("should return 401 if userId is not present", async () => {
      mockRequest.userId = undefined;

      await requireSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 404 if user is not found", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue(null);

      await requireSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockGetUserByIdQuery).toHaveBeenCalledWith(123);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not a super admin", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue({
        id: 123,
        name: "Test User",
        is_super_admin: false,
      });

      await requireSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next and set isSuperAdmin to true for super admin users", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue({
        id: 123,
        name: "Super Admin",
        is_super_admin: true,
      });

      await requireSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(true);
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockRejectedValue(new Error("Database error"));

      await requireSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("checkSuperAdmin", () => {
    it("should continue without super admin status if userId is not present", async () => {
      mockRequest.userId = undefined;

      await checkSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(false);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockGetUserByIdQuery).not.toHaveBeenCalled();
    });

    it("should set isSuperAdmin to false if user is not found", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue(null);

      await checkSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(false);
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should set isSuperAdmin to false if user is not a super admin", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue({
        id: 123,
        name: "Regular User",
        is_super_admin: false,
      });

      await checkSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(false);
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should set isSuperAdmin to true if user is a super admin", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockResolvedValue({
        id: 123,
        name: "Super Admin",
        is_super_admin: true,
      });

      await checkSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(true);
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should continue without super admin status on error", async () => {
      mockRequest.userId = 123;
      mockGetUserByIdQuery.mockRejectedValue(new Error("Database error"));

      await checkSuperAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.isSuperAdmin).toBe(false);
      expect(nextFunction).toHaveBeenCalled();
      // checkSuperAdmin should NOT return error responses, just continue
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
