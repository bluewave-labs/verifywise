/**
 * DeepEval Orgs Service (frontend local state)
 * Temporary org management backed by localStorage until backend endpoints exist.
 */

export interface DeepEvalOrg {
  id: string;
  name: string;
  createdAt: string;
}

const ORGS_KEY = "vw_evals_orgs";
const CURRENT_ORG_KEY = "vw_evals_current_org";
const ORG_PROJECTS_KEY = "vw_evals_org_projects"; // map: { [orgId]: string[] }

function readOrgs(): DeepEvalOrg[] {
  try {
    const raw = localStorage.getItem(ORGS_KEY);
    return raw ? (JSON.parse(raw) as DeepEvalOrg[]) : [];
  } catch {
    return [];
  }
}

function writeOrgs(orgs: DeepEvalOrg[]) {
  localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
}

class DeepEvalOrgsService {
  async getAllOrgs(): Promise<{ orgs: DeepEvalOrg[] }> {
    return { orgs: readOrgs() };
  }

  async createOrg(name: string): Promise<{ org: DeepEvalOrg }> {
    const orgs = readOrgs();
    const org: DeepEvalOrg = {
      id: `org_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    orgs.push(org);
    writeOrgs(orgs);
    localStorage.setItem(CURRENT_ORG_KEY, org.id);
    return { org };
  }

  async setCurrentOrg(orgId: string): Promise<void> {
    localStorage.setItem(CURRENT_ORG_KEY, orgId);
  }

  async getCurrentOrg(): Promise<{ org: DeepEvalOrg | null }> {
    const orgId = localStorage.getItem(CURRENT_ORG_KEY);
    const orgs = readOrgs();
    const org = orgs.find((o) => o.id === orgId) || null;
    return { org };
  }

  async clearCurrentOrg(): Promise<void> {
    localStorage.removeItem(CURRENT_ORG_KEY);
  }

  private getOrgProjectsMap(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(ORG_PROJECTS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  }

  private setOrgProjectsMap(map: Record<string, string[]>) {
    localStorage.setItem(ORG_PROJECTS_KEY, JSON.stringify(map));
  }

  async addProjectToOrg(orgId: string, projectId: string): Promise<void> {
    const map = this.getOrgProjectsMap();
    const list = new Set(map[orgId] || []);
    list.add(projectId);
    map[orgId] = Array.from(list);
    this.setOrgProjectsMap(map);
  }

  async getProjectsForOrg(orgId: string): Promise<string[]> {
    const map = this.getOrgProjectsMap();
    return map[orgId] || [];
  }
}

export const deepEvalOrgsService = new DeepEvalOrgsService();


