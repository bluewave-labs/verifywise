import { AsyncLocalStorage } from 'async_hooks';

type RequestContext = {
  userId?: number;
  tenantId?: string;
  organizationId?: number;
};

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
