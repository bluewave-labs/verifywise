
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        email: string;
        roleName: string;
        // Add any other fields your JWT contains
    };
}

/**
 * Middleware for role-based access control.
 * 
 * @description This middleware should be used after authentication middleware that populates req.user
 * @param allowedRoles - Array of role names that are authorized to access the route
 * @returns Express middleware function that checks if the user's role is authorized
 * 
 * @example
 * // Allow only admin and manager roles to access this route
 * router.get('/protected', authenticate, authorize(['admin', 'manager']), protectedController);
*/

const authorize = (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user exists first
    if (!req.user) {
        console.error('Authorization failed: No user found in request');
        return res.status(401).json({ message: "Authentication required" });
    }
    const roleName = req.user?.roleName; // Extract role from authenticated user  

    if (!roleName || !allowedRoles.includes(roleName)) {
        return res.status(403).json({ message: "Access denied" });
    }

    next(); // Proceed if role is authorized  
};

export default authorize;
