import { useCallback } from "react";
import { getUserProfilePhoto } from "../repository/user.repository";
import {
  ProfilePhotoApiResponse,
  PhotoData,
  PhotoContent
} from "../../domain/types/User";

/**
 * Type guard to check if content has a data property.
 */
function hasDataProperty(content: ArrayBuffer | number[] | PhotoContent): content is PhotoContent {
  return typeof content === 'object' && 'data' in content && content.data !== undefined;
}

/**
 * Custom hook for fetching and converting user profile photo data to blob URL.
 * Handles different response formats and auto-detects image MIME types.
 *
 * @returns {Object} Object containing the fetchProfilePhotoAsBlobUrl function
 *
 * @example
 * const { fetchProfilePhotoAsBlobUrl } = useProfilePhotoFetch();
 * const blobUrl = await fetchProfilePhotoAsBlobUrl(userId);
 */
export const useProfilePhotoFetch = () => {
  const fetchProfilePhotoAsBlobUrl = useCallback(
    async (userId: number | string): Promise<string | null> => {
      try {
        const response = await getUserProfilePhoto(userId);
        const responseData = response as ProfilePhotoApiResponse;

        if (responseData?.data?.photo?.content) {
          const photoData: PhotoData = responseData.data.photo;
          let bufferData: Uint8Array;
          let mimeType: string;

          // Handle different response formats
          if (
            photoData.content instanceof ArrayBuffer ||
            (Array.isArray(photoData.content) && photoData.content.length > 0)
          ) {
            bufferData = new Uint8Array(photoData.content as ArrayBuffer | number[]);
            mimeType = photoData.type || "image/png";
          } else if (hasDataProperty(photoData.content) && photoData.content.data) {
            bufferData = new Uint8Array(photoData.content.data);
            mimeType =
              photoData.type ||
              photoData.mimeType ||
              photoData.contentType ||
              "image/png";
          } else {
            return null;
          }

          // Auto-detect and fix SVG MIME type
          if (mimeType === "image/png" && bufferData.length > 0) {
            const svgSignature = new TextDecoder().decode(
              bufferData.slice(0, 20),
            );
            if (
              svgSignature.includes("<?xml") ||
              svgSignature.includes("<svg")
            ) {
              mimeType = "image/svg+xml";
            }
          }

          const blob = new Blob([bufferData as BlobPart], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          // Validate image loading
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(blobUrl);
            img.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              resolve(null);
            };
            img.src = blobUrl;
          });
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  return { fetchProfilePhotoAsBlobUrl };
};
