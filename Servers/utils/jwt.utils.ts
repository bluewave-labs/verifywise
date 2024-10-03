import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (payload: {
    id: number,
    email: string
}) => {
    return jwt.sign(
        {
            ...payload,
            expire: Date.now() + (1 * 3600 * 1000)
        },
        process.env.JWT_SECRET as string
    );
};

const getTokenPayload = (token: any): {
    id: number,
    email: string,
    expire: number
} | null => {
    try {
        return jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as {
            id: number,
            email: string,
            expire: number
        };
    } catch (error) {
        // 403: not authenticated
        return null;
    }
};

export { generateToken, getTokenPayload };