import { apiServices } from "../../infrastructure/api/networkServices";
import { IFeatureSettings } from "../../domain/interfaces/i.featureSettings";

export async function getFeatureSettings(): Promise<IFeatureSettings> {
  const response = await apiServices.get<Record<string, unknown>>("/feature-settings");
  return (response.data?.data ?? response.data) as IFeatureSettings;
}

export async function updateFeatureSettings(
  updates: Partial<Pick<IFeatureSettings, "lifecycle_enabled">>
): Promise<IFeatureSettings> {
  const response = await apiServices.patch<Record<string, unknown>>("/feature-settings", updates);
  return (response.data?.data ?? response.data) as IFeatureSettings;
}
