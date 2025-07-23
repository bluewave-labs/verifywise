import { AsyncLocalStorage } from 'async_hooks';

type RequestContext = {
  userId?: number;
};

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
