import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";


export async function getEUAIActCompliancesProgress(
  {
    projectFrameworkId,
    authToken = getAuthToken(),
  }: {
    projectFrameworkId: number;
    authToken?: string;
  }
): Promise<any> {
  const response = await apiServices.get(
    `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return response.data;
}

export async function getEUAIActAssessmentsProgress(
  {
    projectFrameworkId,
    authToken = getAuthToken(),
  }: {
    projectFrameworkId: number;
    authToken?: string;
  }
): Promise<any> {
  const response = await apiServices.get(
    `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return response.data;
}
