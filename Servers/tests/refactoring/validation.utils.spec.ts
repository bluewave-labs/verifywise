/**
 * Unit Tests for Validation Utilities (Branch 5)
 *
 * Tests the validation utilities that were refactored to replace `any` types
 * with proper TypeScript types and add comprehensive validation functions.
 *
 * @module tests/refactoring/validation.utils
 */

import {
  validateString,
  validateNumber,
  validateRequest,
  validateSchema,
  ValidationErrors,
  ValidationError,
} from "../../utils/validations/validation.utils";
import { Request, Response, NextFunction } from "express";

describe("Validation Utilities (Branch 5)", () => {
  describe("validateString", () => {
    describe("Required field validation", () => {
      it("should fail when required field is undefined", () => {
        const result = validateString(undefined, "name", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("REQUIRED_FIELD");
      });

      it("should fail when required field is null", () => {
        const result = validateString(null, "name", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("REQUIRED_FIELD");
      });

      it("should pass when optional field is undefined", () => {
        const result = validateString(undefined, "name", { required: false });
        expect(result.isValid).toBe(true);
      });

      it("should fail when required field is empty string", () => {
        const result = validateString("", "name", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("EMPTY_STRING");
      });

      it("should fail when required field is whitespace only", () => {
        const result = validateString("   ", "name", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("EMPTY_STRING");
      });
    });

    describe("Length validation", () => {
      it("should fail when string is shorter than minLength", () => {
        const result = validateString("ab", "name", { minLength: 3 });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("MIN_LENGTH");
        expect(result.message).toContain("at least 3 characters");
      });

      it("should pass when string meets minLength", () => {
        const result = validateString("abc", "name", { minLength: 3 });
        expect(result.isValid).toBe(true);
      });

      it("should fail when string exceeds maxLength", () => {
        const result = validateString("abcdefghijk", "name", { maxLength: 10 });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("MAX_LENGTH");
        expect(result.message).toContain("cannot exceed 10 characters");
      });

      it("should pass when string is within maxLength", () => {
        const result = validateString("abcdefghij", "name", { maxLength: 10 });
        expect(result.isValid).toBe(true);
      });

      it("should handle edge case at exact length limits", () => {
        const result = validateString("abc", "name", { minLength: 3, maxLength: 3 });
        expect(result.isValid).toBe(true);
      });
    });

    describe("Pattern validation", () => {
      it("should fail when string does not match pattern", () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const result = validateString("invalid-email", "email", { pattern: emailPattern });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("INVALID_FORMAT");
      });

      it("should pass when string matches pattern", () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const result = validateString("test@example.com", "email", { pattern: emailPattern });
        expect(result.isValid).toBe(true);
      });

      it("should validate phone number pattern", () => {
        const phonePattern = /^\+?[1-9]\d{1,14}$/;
        expect(validateString("+12025551234", "phone", { pattern: phonePattern }).isValid).toBe(true);
        expect(validateString("abc", "phone", { pattern: phonePattern }).isValid).toBe(false);
      });
    });

    describe("Whitespace handling", () => {
      it("should trim whitespace by default", () => {
        const result = validateString("  test  ", "name", { minLength: 4 });
        expect(result.isValid).toBe(true);
      });

      it("should not trim when trimWhitespace is false", () => {
        const result = validateString("  ab  ", "name", {
          trimWhitespace: false,
          minLength: 6,
        });
        expect(result.isValid).toBe(true);
      });
    });

    describe("Type coercion", () => {
      it("should convert number to string", () => {
        const result = validateString(123, "id", { minLength: 1 });
        expect(result.isValid).toBe(true);
      });

      it("should handle boolean coercion", () => {
        const result = validateString(true, "flag", { minLength: 1 });
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("validateNumber", () => {
    describe("Required field validation", () => {
      it("should fail when required field is undefined", () => {
        const result = validateNumber(undefined, "age", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("REQUIRED_FIELD");
      });

      it("should fail when required field is null", () => {
        const result = validateNumber(null, "age", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("REQUIRED_FIELD");
      });

      it("should fail when required field is empty string", () => {
        const result = validateNumber("", "age", { required: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("REQUIRED_FIELD");
      });

      it("should pass when optional field is undefined", () => {
        const result = validateNumber(undefined, "age", { required: false });
        expect(result.isValid).toBe(true);
      });
    });

    describe("Number parsing", () => {
      it("should fail for non-numeric string", () => {
        const result = validateNumber("abc", "age");
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("INVALID_NUMBER");
      });

      it("should pass for numeric string", () => {
        const result = validateNumber("42", "age");
        expect(result.isValid).toBe(true);
      });

      it("should pass for actual number", () => {
        const result = validateNumber(42, "age");
        expect(result.isValid).toBe(true);
      });

      it("should handle floating point numbers", () => {
        const result = validateNumber(3.14, "value");
        expect(result.isValid).toBe(true);
      });

      it("should handle negative numbers", () => {
        const result = validateNumber(-5, "balance");
        expect(result.isValid).toBe(true);
      });
    });

    describe("Integer validation", () => {
      it("should fail when integer is required but float is provided", () => {
        const result = validateNumber(3.14, "count", { integer: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("INVALID_INTEGER");
      });

      it("should pass for integer when integer is required", () => {
        const result = validateNumber(42, "count", { integer: true });
        expect(result.isValid).toBe(true);
      });

      it("should pass for .0 float when integer is required", () => {
        const result = validateNumber(42.0, "count", { integer: true });
        expect(result.isValid).toBe(true);
      });
    });

    describe("Positive validation", () => {
      it("should fail for zero when positive is required", () => {
        const result = validateNumber(0, "quantity", { positive: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("INVALID_POSITIVE");
      });

      it("should fail for negative when positive is required", () => {
        const result = validateNumber(-5, "quantity", { positive: true });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("INVALID_POSITIVE");
      });

      it("should pass for positive number", () => {
        const result = validateNumber(5, "quantity", { positive: true });
        expect(result.isValid).toBe(true);
      });
    });

    describe("Range validation", () => {
      it("should fail when value is below min", () => {
        const result = validateNumber(5, "age", { min: 18 });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("MIN_VALUE");
        expect(result.message).toContain("at least 18");
      });

      it("should fail when value exceeds max", () => {
        const result = validateNumber(150, "age", { max: 120 });
        expect(result.isValid).toBe(false);
        expect(result.code).toBe("MAX_VALUE");
        expect(result.message).toContain("cannot exceed 120");
      });

      it("should pass when value is within range", () => {
        const result = validateNumber(25, "age", { min: 18, max: 120 });
        expect(result.isValid).toBe(true);
      });

      it("should pass at exact boundary values", () => {
        expect(validateNumber(18, "age", { min: 18 }).isValid).toBe(true);
        expect(validateNumber(120, "age", { max: 120 }).isValid).toBe(true);
      });
    });
  });

  describe("validateSchema", () => {
    it("should validate object against schema", () => {
      const schema = {
        name: (value: unknown) =>
          validateString(value, "name", { required: true, minLength: 2 }),
        age: (value: unknown) =>
          validateNumber(value, "age", { required: true, min: 0 }),
      };

      const validData = { name: "John", age: 25 };
      const errors = validateSchema(validData, schema);
      expect(errors).toHaveLength(0);
    });

    it("should return errors for invalid data", () => {
      const schema = {
        name: (value: unknown) =>
          validateString(value, "name", { required: true }),
        age: (value: unknown) =>
          validateNumber(value, "age", { required: true, positive: true }),
      };

      const invalidData = { name: "", age: -5 };
      const errors = validateSchema(invalidData, schema);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateRequest middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it("should call next() for valid data", () => {
      const schema = {
        name: (value: unknown) => validateString(value, "name", { required: true }),
      };

      mockRequest.body = { name: "John" };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid data", () => {
      const schema = {
        name: (value: unknown) => validateString(value, "name", { required: true }),
      };

      mockRequest.body = { name: "" };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Validation failed",
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should include field errors in response", () => {
      const schema = {
        email: (value: unknown) =>
          validateString(value, "email", {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          }),
      };

      mockRequest.body = { email: "invalid" };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: "email",
            }),
          ]),
        })
      );
    });

    it("should handle multiple validation errors", () => {
      const schema = {
        name: (value: unknown) => validateString(value, "name", { required: true }),
        age: (value: unknown) =>
          validateNumber(value, "age", { required: true, positive: true }),
      };

      mockRequest.body = { name: "", age: -1 };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalled();
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors.length).toBeGreaterThanOrEqual(2);
    });

    it("should return void (not a Promise)", () => {
      const schema = {
        name: (value: unknown) => validateString(value, "name", { required: true }),
      };

      mockRequest.body = { name: "John" };

      const middleware = validateRequest(schema);
      const result = middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // The middleware should return void, not a Promise
      expect(result).toBeUndefined();
    });
  });

  describe("ValidationErrors class", () => {
    it("should create instance with errors array", () => {
      const errors: ValidationError[] = [
        { field: "name", message: "Name is required", code: "REQUIRED_FIELD" },
        { field: "age", message: "Age must be positive", code: "INVALID_POSITIVE" },
      ];

      const validationError = new ValidationErrors(errors);

      expect(validationError).toBeInstanceOf(Error);
      expect(validationError.name).toBe("ValidationErrors");
      expect(validationError.message).toBe("Validation failed");
      expect(validationError.errors).toEqual(errors);
    });

    it("should be throwable", () => {
      const errors: ValidationError[] = [
        { field: "email", message: "Invalid email", code: "INVALID_FORMAT" },
      ];

      expect(() => {
        throw new ValidationErrors(errors);
      }).toThrow(ValidationErrors);
    });
  });

  describe("Edge Cases", () => {
    it("should handle object values in string validation", () => {
      const result = validateString({ toString: () => "test" }, "name");
      expect(result.isValid).toBe(true);
    });

    it("should handle NaN in number validation", () => {
      const result = validateNumber(NaN, "value");
      expect(result.isValid).toBe(false);
      expect(result.code).toBe("INVALID_NUMBER");
    });

    it("should handle Infinity in number validation", () => {
      const result = validateNumber(Infinity, "value", { max: 1000 });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe("MAX_VALUE");
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      const result = validateString(longString, "content", { maxLength: 5000 });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe("MAX_LENGTH");
    });

    it("should handle zero correctly", () => {
      const result = validateNumber(0, "count", { min: 0 });
      expect(result.isValid).toBe(true);
    });
  });
});
