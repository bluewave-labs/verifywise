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
 * Handles missing or malformed data gracefully with defensive checks.
 * Server response fields: id, filename, size, mimetype, upload_date, uploaded_by,
 * uploader_name, uploader_surname, existsOnDisk
 *
 * @param {any} file - Raw file data from API
 * @returns {FileData} Formatted file data for application use
 */
export const transformFileData = (file: any): FileData => {
    // Server sends 'upload_date' not 'uploaded_time'
    const uploadDate = file.upload_date || file.uploaded_time;

    // Construct uploader name from uploader_name and uploader_surname fields
    const uploaderName = file.uploader_name && file.uploader_surname
        ? `${file.uploader_name} ${file.uploader_surname}`
        : file.uploader_name || file.uploader_surname || "Unknown";

    return {
        id: file.id ?? "",
        fileName: file.filename ?? "Unknown",
        uploadDate: uploadDate
            ? new Date(uploadDate).toLocaleDateString()
            : "Invalid Date",
        uploader: uploaderName,
        source: file.source ?? "File Manager",
        projectTitle: file.project_title ?? "N/A",
        projectId: file.project_id != null ? String(file.project_id) : "0",
        parentId: file.parent_id ?? null,
        subId: file.sub_id ?? null,
        metaId: file.meta_id ?? null,
        isEvidence: file.is_evidence ?? false,
    };
};

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