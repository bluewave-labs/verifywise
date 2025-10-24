/**
 * @fileoverview File Data Transformation Utilities
 *
 * Shared utilities for transforming file data from API responses to application format.
 * Ensures consistent data structure across the application (DRY principle).
 *
 * @module utils/fileTransform
 */

import { FileData } from "../../domain/types/File";

/**
 * Transforms raw file data from API to application FileData format
 *
 * @param {any} file - Raw file data from API
 * @returns {FileData} Formatted file data for application use
 */
export const transformFileData = (file: any): FileData => ({
  id: file.id,
  fileName: file.filename,
  uploadDate: file.uploaded_time
    ? new Date(file.uploaded_time).toLocaleDateString()
    : "Invalid Date",
  uploader: `${file.uploader_name ?? ""} ${file.uploader_surname ?? ""}`.trim() || "N/A",
  source: file.source,
  projectTitle: file.project_title,
  projectId: file.project_id.toString(),
  parentId: file.parent_id,
  subId: file.sub_id,
  metaId: file.meta_id,
  isEvidence: file.is_evidence,
});

/**
 * Transforms an array of raw file data to FileData format
 *
 * @param {any[]} files - Array of raw file data from API
 * @returns {FileData[]} Array of formatted file data
 */
export const transformFilesData = (files: any[]): FileData[] => {
  if (!Array.isArray(files)) {
    return [];
  }
  return files.map(transformFileData);
};