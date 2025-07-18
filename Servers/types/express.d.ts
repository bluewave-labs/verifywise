import 'express';

declare module 'express' {
  interface Request {
    userId?: number;
    role?: string;
    tenantId?: string
    organizationId?: number;
  }
}