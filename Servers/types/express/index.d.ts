import 'express';

declare module 'express' {
  interface Request {
    userId?: number; 
  }
}