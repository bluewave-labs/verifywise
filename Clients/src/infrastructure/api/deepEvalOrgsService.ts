import CustomAxios from "./customAxios";

export interface DeepEvalOrg {
  id: string;
  name: string;
  createdAt: string;
}

class DeepEvalOrgsService {
  async getAllOrgs(): Promise<{ orgs: DeepEvalOrg[] }> {
    const res = await CustomAxios.get("/deepeval/orgs");
    return res.data as { orgs: DeepEvalOrg[] };
  }

  async createOrg(name: string): Promise<{ org: DeepEvalOrg }> {
    const res = await CustomAxios.post("/deepeval/orgs", { name });
    return res.data as { org: DeepEvalOrg };
  }

  async getProjectsForOrg(orgId: string): Promise<string[]> {
    const res = await CustomAxios.get(`/deepeval/orgs/${orgId}/projects`);
    return (res.data?.projectIds as string[]) || [];
  }

  // Frontend convenience: remember current org locally only for UX
  private CURRENT_ORG_KEY = "vw_evals_current_org";
  async setCurrentOrg(orgId: string): Promise<void> {
    localStorage.setItem(this.CURRENT_ORG_KEY, orgId);
  }
  async getCurrentOrg(): Promise<{ org: DeepEvalOrg | null }> {
    const orgId = localStorage.getItem(this.CURRENT_ORG_KEY);
    if (!orgId) return { org: null };
    const { orgs } = await this.getAllOrgs();
    const org = orgs.find((o) => o.id === orgId) || null;
    return { org };
  }
  async clearCurrentOrg(): Promise<void> {
    localStorage.removeItem(this.CURRENT_ORG_KEY);
  }
  async addProjectToOrg(_orgId: string, _projectId: string): Promise<void> {
    // No-op; association persisted by passing orgId when creating the project
    return;
  }
}

export const deepEvalOrgsService = new DeepEvalOrgsService();

