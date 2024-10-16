import Jwt from "jsonwebtoken";

const getTokenPayload = (token: any): any => {
  try {
    return Jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      email: string;
      expire: number;
    };
  } catch (error) {
    return null;
  }
};

/**
 * Generate token payload and add the expiration time of the token
 * @param payload id and email of the user
 * @returns generated token
 */
const generateToken = (payload: {
  id: number,
  email: string
}) => {
  return Jwt.sign(
    {
      ...payload,
      expire: Date.now() + (1 * 3600 * 1000)
    },
    process.env.JWT_SECRET as string
  );
};

export { getTokenPayload, generateToken };
