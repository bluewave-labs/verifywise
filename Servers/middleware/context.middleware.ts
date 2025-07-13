import { asyncLocalStorage } from '../utils/context/context';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

export default function contextMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = req.userId;

  asyncLocalStorage.run({ userId: typeof userId === 'number' ? userId : undefined }, () => {
    next();
  });
}
