/**
 * @fileoverview File Manager Constants
 *
 * Single source of truth for file upload constraints and allowed file types.
 * These constants should match the server-side validation in:
 * Servers/utils/validations/fileManagerValidation.utils.ts
 *
 * @module constants/fileManager
 */

/**
 * Maximum file size in bytes (30MB)
 */
export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;

/**
 * Maximum file size in MB for display
 */
export const MAX_FILE_SIZE_MB = 30;

/**
 * Allowed file extensions grouped by category
 * This mirrors the server-side ALLOWED_MIME_TYPES configuration
 */
export const ALLOWED_FILE_TYPES = {
  documents: {
    label: "Documents",
    extensions: ["PDF", "DOC", "DOCX", "XLS", "XLSX", "CSV", "MD"],
  },
  images: {
    label: "Images",
    extensions: ["JPEG", "PNG", "GIF", "WEBP", "SVG", "BMP", "TIFF"],
  },
  videos: {
    label: "Videos",
    extensions: ["MP4", "MPEG", "MOV", "AVI", "WMV", "WEBM", "MKV"],
  },
} as const;

/**
 * Generates a human-readable string of supported file types
 * Format: "Documents (PDF, DOC, DOCX), Images (JPEG, PNG), Videos (MP4, MOV)"
 *
 * @returns {string} Formatted string of supported file types
 */
export const getSupportedFileTypesString = (): string => {
  const categories = Object.values(ALLOWED_FILE_TYPES);

  return categories
    .map(category => `${category.label} (${category.extensions.join(", ")})`)
    .join(", ");
};

/**
 * Pre-generated supported file types string for performance
 * Use this in components to avoid recalculating on every render
 */
export const SUPPORTED_FILE_TYPES_STRING = getSupportedFileTypesString();