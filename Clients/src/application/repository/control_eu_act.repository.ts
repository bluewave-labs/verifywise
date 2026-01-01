import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Control structure
 */
interface Control {
  id: number;
  title: string;
  description?: string;
  status?: string;
  owner_id?: number;
  approver_id?: number;
  due_date?: string;
  control_category_id?: number;
  [key: string]: unknown;
}

/**
 * Control input for create/update
 */
interface ControlInput {
  title?: string;
  description?: string;
  status?: string;
  owner_id?: number;
  approver_id?: number;
  due_date?: string;
  control_category_id?: number;
  [key: string]: unknown;
}

/**
 * Control category with controls
 */
interface ControlCategoryWithControls {
  id: number;
  name: string;
  controls?: Control[];
  [key: string]: unknown;
}

/**
 * Compliance progress structure
 */
interface ComplianceProgress {
  total: number;
  completed: number;
  percentage: number;
  [key: string]: unknown;
}

export async function getControlById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Control>> {
  const response = await apiServices.get<BackendResponse<Control>>(`/controls/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createControl({
  body,
}: {
  body: ControlInput;
}): Promise<ApiResponse<BackendResponse<Control>>> {
  const response = await apiServices.post<BackendResponse<Control>>("/controls", body);
  return response;
}


export async function deleteControl({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/controls/${id}`);
  return response;
}

export async function getControlByIdAndProject({
  controlId,
  projectFrameworkId,
  owner,
  approver,
  dueDateFilter,
  signal,
}: {
  controlId: number;
  projectFrameworkId: number;
  owner?: string;
  approver?: string;
  dueDateFilter?: string;
  signal?: AbortSignal;
}): Promise<BackendResponse<Control>> {
  const params = new URLSearchParams({
    controlId: controlId.toString(),
    projectFrameworkId: projectFrameworkId.toString(),
  });

  if (owner && owner !== '') params.append('owner', owner);
  if (approver && approver !== '') params.append('approver', approver);
  if (dueDateFilter && dueDateFilter !== '') params.append('dueDateFilter', dueDateFilter);

  const response = await apiServices.get<BackendResponse<Control>>(`/eu-ai-act/controlById?${params.toString()}`, {
    signal,
  });
  return response.data;
}

export async function getControlCategoriesByProject({
  projectFrameworkId,
  signal,
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<ControlCategoryWithControls[]>> {
  const response = await apiServices.get<BackendResponse<ControlCategoryWithControls[]>>(`/eu-ai-act/controlCategories?projectFrameworkId=${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function getComplianceProgress({
  projectFrameworkId,
  signal,
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<ComplianceProgress>> {
  const response = await apiServices.get<BackendResponse<ComplianceProgress>>(`/eu-ai-act/compliances/progress/${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function updateControl({
  controlId,
  body,
  headers,
}: {
  controlId: number | undefined;
  body: ControlInput;
  headers?: Record<string, string>;
}): Promise<ApiResponse<BackendResponse<Control>>> {
  const response = await apiServices.patch<BackendResponse<Control>>(`/eu-ai-act/saveControls/${controlId}`, body, {
    headers: { ...headers },
  });
  return response;
}

export async function getControlsByControlCategoryId({
  controlCategoryId,
  projectFrameworkId,
  owner,
  approver,
  dueDateFilter,
  signal,
}: {
  controlCategoryId: number;
  projectFrameworkId: number;
  owner?: string;
  approver?: string;
  dueDateFilter?: string;
  signal?: AbortSignal;
}): Promise<BackendResponse<Control[]>> {
  const params = new URLSearchParams({
    projectFrameworkId: projectFrameworkId.toString(),
  });

  if (owner && owner !== '') params.append('owner', owner);
  if (approver && approver !== '') params.append('approver', approver);
  if (dueDateFilter && dueDateFilter !== '') params.append('dueDateFilter', dueDateFilter);

  const response = await apiServices.get<BackendResponse<Control[]>>(`/eu-ai-act/controls/byControlCategoryId/${controlCategoryId}?${params.toString()}`, {
    signal,
  });
  return response.data;
}
