import Uppy from "@uppy/core";
import { FileData } from "../../../domain/types/File";

export interface IUppyDashboardProps {
  uppy: Uppy;
  width?: number;
  height?: number;
  hideProgressIndicators?: boolean;
  files?: FileData[];
}
