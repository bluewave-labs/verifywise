import { asyncLocalStorage } from '../utils/context/context';
import { Request, Response, NextFunction } from 'express';

export default function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = (req as any).userId;

  asyncLocalStorage.run({ userId: typeof userId === 'number' ? userId : undefined }, () => {
    next();
  });
}
