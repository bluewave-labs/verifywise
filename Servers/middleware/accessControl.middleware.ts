
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    roleName: string;
    // Add any other fields your JWT contains
  };
}

const authorize = (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const roleName = req.user?.roleName; // Extract role from authenticated user  

    if (!roleName || !allowedRoles.includes(roleName)) {
        return res.status(403).json({ message: "Access denied" });
    }

    next(); // Proceed if role is authorized  
};

export default authorize;
