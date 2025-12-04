import { apiServices } from "../../infrastructure/api/networkServices";

export interface EntityGraphData {
  projects: Array<{
    id: number;
    uc_id?: string;
    project_title: string;
    owner: number;
  }>;
  modelInventories: Array<{
    id: number;
    provider: string;
    model: string;
    status: string;
    projects: number[];
    frameworks: number[];
  }>;
  modelRisks: Array<{
    id: number;
    risk_name: string;
    risk_level: string;
    model_id: number | null;
  }>;
  vendors: Array<{
    id: number;
    vendor_name: string;
    review_status: string;
    projects?: number[];
  }>;
  vendorRisks: Array<{
    id: number;
    risk_description: string;
    risk_severity: string;
    vendor_id: number;
  }>;
  projectRisks: Array<{
    id: number;
    risk_name: string;
    current_risk_level: string;
    project_id: number;
  }>;
  frameworks: Array<{
    id: number;
    name: string;
  }>;
}

export async function fetchEntityGraphData(): Promise<EntityGraphData> {
  const [
    projectsRes,
    modelInventoriesRes,
    modelRisksRes,
    vendorsRes,
    vendorRisksRes,
    projectRisksRes,
    frameworksRes,
  ] = await Promise.all([
    apiServices.get("/projects").catch(() => ({ data: { data: [] } })),
    apiServices.get("/modelInventory").catch(() => ({ data: { data: [] } })),
    apiServices.get("/modelRisks").catch(() => ({ data: { data: [] } })),
    apiServices.get("/vendors").catch(() => ({ data: { data: [] } })),
    apiServices.get("/vendorRisks/all").catch(() => ({ data: { data: [] } })),
    apiServices.get("/projectRisks").catch(() => ({ data: { data: [] } })),
    apiServices.get("/frameworks").catch(() => ({ data: { data: [] } })),
  ]);

  // Extract data from responses - handle both {data: []} and {data: {data: []}} formats
  const extractData = (res: { data: unknown }): unknown[] => {
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data)) {
      return (data as { data: unknown[] }).data;
    }
    return [];
  };

  return {
    projects: extractData(projectsRes) as EntityGraphData['projects'],
    modelInventories: extractData(modelInventoriesRes) as EntityGraphData['modelInventories'],
    modelRisks: extractData(modelRisksRes) as EntityGraphData['modelRisks'],
    vendors: extractData(vendorsRes) as EntityGraphData['vendors'],
    vendorRisks: extractData(vendorRisksRes) as EntityGraphData['vendorRisks'],
    projectRisks: extractData(projectRisksRes) as EntityGraphData['projectRisks'],
    frameworks: extractData(frameworksRes) as EntityGraphData['frameworks'],
  };
}
