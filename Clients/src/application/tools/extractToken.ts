export const extractUserToken = (
  token: string
): { id: any; email: any, name: string, roleId: string, expire: string, iat: string, roleName: string } | null => {
  if (!token) {
    console.error("Token is missing!");
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format");
      return null;
    }
    const payloadBase64 = parts[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch (error) {
    console.error("Failed to decode token", error);
    return null;
  }
};
