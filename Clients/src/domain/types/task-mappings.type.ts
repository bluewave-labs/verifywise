
export type MappingOptionId = string;

export interface MappingOption {
  id: MappingOptionId;
  label: string;
}

export type TaskMappingKey = "useCaseMap" | "modelMap" | "frameworkMap" | "vendorMap";

export interface TaskMappingMaps {
  useCaseMap: Map<string, string>;
  modelMap: Map<string, string>;
  frameworkMap: Map<string, string>;
  vendorMap: Map<string, string>;
}

export interface TaskMappingsState {
  useCases: MappingOption[];
  models: MappingOption[];
  frameworks: MappingOption[];
  vendors: MappingOption[];
}