import { sendPasswordResetEmail, resetPassword } from "../auth.repository";
import { apiServices } from "../../../infrastructure/api/networkServices";

vi.mock("../../../infrastructure/api/networkServices", () => ({
  apiServices: {
    post: vi.fn(),
  },
}));

describe("auth.repository", () => {
  const mockPost = vi.mocked(apiServices.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendPasswordResetEmail", () => {
    const resetData = {
      to: "user@example.com",
      email: "user@example.com",
      name: "John",
    };

    it("should POST to /mail/reset-password with correct data", async () => {
      mockPost.mockResolvedValue({
        status: 200,
        data: { message: "Email sent" },
        statusText: "OK",
      });

      const result = await sendPasswordResetEmail(resetData);

      expect(mockPost).toHaveBeenCalledWith("/mail/reset-password", resetData);
      expect(result.status).toBe(200);
    });

    it("should propagate errors", async () => {
      mockPost.mockRejectedValue(new Error("Network error"));

      await expect(sendPasswordResetEmail(resetData)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("resetPassword", () => {
    const passwordData = {
      email: "user@example.com",
      newPassword: "SecureP@ss123",
    };
    const token = "reset-token-abc";

    it("should POST to /users/reset-password with Bearer token", async () => {
      mockPost.mockResolvedValue({
        status: 200,
        data: { message: "Password reset successful" },
        statusText: "OK",
      });

      const result = await resetPassword(passwordData, token);

      expect(mockPost).toHaveBeenCalledWith(
        "/users/reset-password",
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      expect(result.status).toBe(200);
    });

    it("should propagate errors", async () => {
      mockPost.mockRejectedValue(new Error("Invalid token"));

      await expect(resetPassword(passwordData, token)).rejects.toThrow(
        "Invalid token"
      );
    });
  });
});
