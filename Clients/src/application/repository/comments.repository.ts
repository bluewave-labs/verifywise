import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Comment structure
 */
interface Comment {
  id: number;
  tableId: string;
  rowId: string;
  userId: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  user?: {
    id: number;
    name: string;
    surname: string;
    email: string;
    profilePhoto?: string;
  };
  reactions?: CommentReaction[];
}

/**
 * Comment reaction structure
 */
interface CommentReaction {
  id: number;
  commentId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    surname: string;
  };
}

/**
 * Comment file structure
 */
interface CommentFile {
  id: number;
  tableId: string;
  rowId: string;
  commentId?: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: number;
  createdAt: string;
}

/**
 * Paginated comments response
 */
interface PaginatedCommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Upload progress event type
 */
interface UploadProgressEvent {
  loaded: number;
  total?: number;
}

/**
 * Get all comments for a specific table row
 */
export async function getCommentsByTableRow({
  tableId,
  rowId,
  page = 1,
  limit = 50,
  signal,
}: {
  tableId: string;
  rowId: string | number;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<PaginatedCommentsResponse>> {
  const response = await apiServices.get<BackendResponse<PaginatedCommentsResponse>>(
    `/comments/${tableId}/${rowId}?page=${page}&limit=${limit}`,
    { signal }
  );
  return response.data;
}

/**
 * Create a new comment
 */
export async function createComment({
  tableId,
  rowId,
  message,
}: {
  tableId: string;
  rowId: string | number;
  message: string;
}): Promise<BackendResponse<Comment>> {
  const response = await apiServices.post<BackendResponse<Comment>>("/comments", {
    tableId,
    rowId,
    message,
  });
  return response.data;
}

/**
 * Update a comment
 */
export async function updateComment({
  commentId,
  message,
}: {
  commentId: number;
  message: string;
}): Promise<BackendResponse<Comment>> {
  const response = await apiServices.put<BackendResponse<Comment>>(`/comments/${commentId}`, {
    message,
  });
  return response.data;
}

/**
 * Delete a comment
 */
export async function deleteComment({
  commentId,
}: {
  commentId: number;
}): Promise<null> {
  const response = await apiServices.delete<null>(`/comments/${commentId}`);
  return response.data;
}

/**
 * Get all files for a specific table row
 */
export async function getFilesByTableRow({
  tableId,
  rowId,
  signal,
}: {
  tableId: string;
  rowId: string | number;
  signal?: AbortSignal;
}): Promise<BackendResponse<CommentFile[]>> {
  const response = await apiServices.get<BackendResponse<CommentFile[]>>(`/comments/${tableId}/${rowId}/files`, {
    signal,
  });
  return response.data;
}

/**
 * Upload a file
 */
export async function uploadFile({
  tableId,
  rowId,
  file,
  commentId,
  onProgress,
}: {
  tableId: string;
  rowId: string | number;
  file: File;
  commentId?: number;
  onProgress?: (progress: number) => void;
}): Promise<BackendResponse<CommentFile>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tableId", tableId);
  formData.append("rowId", rowId.toString());
  if (commentId) {
    formData.append("commentId", commentId.toString());
  }

  const response = await apiServices.post<BackendResponse<CommentFile>>("/comments/files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: UploadProgressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

/**
 * Download a file
 */
export async function downloadFile({
  fileId,
}: {
  fileId: string;
}): Promise<Blob> {
  const response = await apiServices.get(`/comments/files/${fileId}/download`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

/**
 * Delete a file
 */
export async function deleteFile({
  fileId,
}: {
  fileId: string;
}): Promise<null> {
  const response = await apiServices.delete<null>(`/comments/files/${fileId}`);
  return response.data;
}

/**
 * Add a reaction to a comment
 */
export async function addReaction({
  commentId,
  emoji,
}: {
  commentId: string;
  emoji: string;
}): Promise<BackendResponse<CommentReaction>> {
  const response = await apiServices.post<BackendResponse<CommentReaction>>(`/comments/${commentId}/reactions`, {
    emoji,
  });
  return response.data;
}

/**
 * Remove a reaction from a comment
 */
export async function removeReaction({
  commentId,
  emoji,
}: {
  commentId: string;
  emoji: string;
}): Promise<null> {
  const response = await apiServices.delete<null>(
    `/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`
  );
  return response.data;
}

/**
 * Get comment and file counts for all rows in a table
 */
export async function getTableCounts({
  tableId,
  signal,
}: {
  tableId: string;
  signal?: AbortSignal;
}): Promise<Record<string, { unreadCount: number; fileCount: number }>> {
  const response = await apiServices.get(`/comments/${tableId}/counts`, {
    signal,
  });
  // Backend returns { message: "OK", data: counts }, so we need response.data.data
  const data = response.data as { data?: Record<string, { unreadCount: number; fileCount: number }> };
  return data.data || data as unknown as Record<string, { unreadCount: number; fileCount: number }>;
}

/**
 * Mark messages as read for a specific table row
 */
export async function markAsRead({
  tableId,
  rowId,
}: {
  tableId: string;
  rowId: string | number;
}): Promise<BackendResponse<{ updated: number }>> {
  const response = await apiServices.post<BackendResponse<{ updated: number }>>("/comments/mark-read", {
    tableId,
    rowId: rowId.toString(),
  });
  return response.data;
}
