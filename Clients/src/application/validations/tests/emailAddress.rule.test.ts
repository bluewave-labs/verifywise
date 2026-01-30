import { isValidEmail } from "../emailAddress.rule";

describe("Test E-mail Address Validation Rule", () => {
  it("should return true for valid e-mail addresses", () => {
    // list with valid e-mail addresses in various formats
    const validEmails = [
      "user@example.com",
      "john.doe@example.com",
      "user+tag@example.co.uk",
      "first.last@subdomain.example.com",
      "user123@example.org",
      "_username@example.com",
      "user.name+tag@example.co.uk",
      "123@example.com",
      "test.email.with+symbol@example4u.net",
    ];
    validEmails.forEach((email) => {
      expect(isValidEmail(email)).toBe(true);
    });
  });
  it("should return false for invalid e-mail addresses", () => {
    const invalidEmails = [
      "plainaddress",
      "@example.com",
      "user@",
      "user @example.com",
      "user@exam ple.com",
      "user@@example.com",
      "user@example..com",
      ".user@example.com",
      "user.@example.com",
      "user@.example.com",
      "user@example.com.",
      "user..name@example.com",
      "user@example",
      "user@-example.com",
      "user@example-.com",
      " user@example.com",
      "user@example.com ",
      "user@example,com",
      "a@b.c",
      " ",
      "",
    ];
    invalidEmails.forEach((email) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});
