const mockTenantName = `mock-tenant-${Date.now()}`;

export const createMockTenant = (): string => {
  return mockTenantName;
};