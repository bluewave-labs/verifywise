import Uppy from "@uppy/core";
import { FileData } from "../types/File";

export interface IUppyDashboardProps {
  uppy: Uppy;
  width?: number;
  height?: number;
  hideProgressIndicators?: boolean;
  files?: FileData[];
}
