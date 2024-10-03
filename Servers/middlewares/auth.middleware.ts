import { NextFunction, Response } from "express";
import { getTokenPayload } from "../utils/jwt.utils";
import { getUsers } from "../utils/users.utils";
import { IUserAuthRequest } from "../types/IUserAuthRequest";
import { User } from "../models/user.model";

const authenticateJWT = async (req: IUserAuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ data: "No token provided" });

    try {
        const decoded = getTokenPayload(token);
        if (!decoded) return res.status(403).json({ data: "Not authorized" });

        if (decoded.expire < Date.now()) return res.status(401).json({ data: "token expired" })

        const users = await getUsers();
        req.user = users.find(u => u.id == decoded.id) as User;
        next();
    } catch (error: any) {
        return res.status(500).json({
            data: "internal server error",
            errorDetails: error.toString()
        });
    }
};

export default authenticateJWT;