import { PluginInstallationStatus } from "../enums/plugin.enum";

export interface IPluginInstallation {
  id?: number;
  plugin_key: string; // References plugin from marketplace by key
  status: PluginInstallationStatus;
  installed_at?: Date;
  uninstalled_at?: Date;
  error_message?: string;
  configuration?: any;
  metadata?: any;
  created_at?: Date;
  updated_at?: Date;
}
