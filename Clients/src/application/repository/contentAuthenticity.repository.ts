/**
 * @fileoverview Content Authenticity Repository
 *
 * API client for Content Authenticity (watermark) endpoints.
 *
 * @module repository/contentAuthenticity
 */

import { apiServices } from "../../infrastructure/api/networkServices";

const BASE_URL = "/content-authenticity";

// ============================================================================
// Types
// ============================================================================

export type WatermarkJobType = "embed" | "detect";
export type WatermarkJobStatus = "pending" | "processing" | "completed" | "failed";

export interface WatermarkJob {
  id: number;
  user_id: number;
  type: WatermarkJobType;
  status: WatermarkJobStatus;
  input_file_name: string;
  input_file_type: string;
  input_file_size?: number;
  output_file_id?: number;
  model_id?: number;
  project_id?: number;
  evidence_id?: number;
  settings?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  processing_time_ms?: number;
  created_at?: string;
  completed_at?: string;
}

export interface EmbedWatermarkRequest {
  image_base64: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  strength?: number;
  model_id?: number;
  project_id?: number;
}

export interface EmbedWatermarkResponse {
  jobId: number;
  status: WatermarkJobStatus;
  watermarkedImageBase64?: string;
  processingTimeMs?: number;
}

export interface DetectWatermarkRequest {
  image_base64: string;
  file_name: string;
  file_type: string;
  file_size?: number;
}

export interface DetectWatermarkResponse {
  jobId: number;
  status: WatermarkJobStatus;
  hasWatermark: boolean;
  confidence: number;
  bitAccuracy?: number;
  processingTimeMs?: number;
}

export interface WatermarkJobsResponse {
  jobs: WatermarkJob[];
  total: number;
  page: number;
  limit: number;
}

export interface WatermarkStats {
  total: number;
  embedCount: number;
  detectCount: number;
  completedCount: number;
  failedCount: number;
}

export interface GetJobsParams {
  type?: WatermarkJobType;
  status?: WatermarkJobStatus;
  page?: number;
  limit?: number;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  message: string;
  service: string;
}

// ============================================================================
// Article 50 Compliance Types
// ============================================================================

export type ConfidenceLevel = "high" | "medium" | "low" | "none";
export type AIGeneratedAssessment = "confirmed" | "likely" | "possible" | "undetected";

export interface C2PAOptions {
  digitalSourceType?: string;
  allowTraining?: boolean;
  allowMining?: boolean;
}

export interface ProvenanceInfo {
  modelName?: string;
  modelVersion?: string;
  provider?: string;
  generationPromptHash?: string;
}

export interface Article50EmbedRequest extends EmbedWatermarkRequest {
  enable_c2pa?: boolean;
  c2pa_options?: C2PAOptions;
  provenance?: ProvenanceInfo;
}

export interface Article50EmbedResponse extends EmbedWatermarkResponse {
  c2paManifestId?: string;
  c2paManifestApplied: boolean;
  contentHash?: string;
  euAiActCompliant: boolean;
}

export interface C2PAInfo {
  manifestFound: boolean;
  manifestId?: string;
  signatureValid?: boolean;
  chainVerified?: boolean;
  digitalSourceType?: string;
  generatorInfo?: {
    name: string;
    version: string;
  };
  aiModelInfo?: {
    name?: string;
    provider?: string;
    version?: string;
  };
}

export interface ComprehensiveDetectResponse extends DetectWatermarkResponse {
  confidenceLevel: ConfidenceLevel;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  c2pa?: C2PAInfo;
  aiGeneratedAssessment: AIGeneratedAssessment;
  assessmentReasoning: string;
}

export interface ConfidenceThresholds {
  thresholds: {
    high: number;
    medium: number;
    low: number;
  };
  levels: {
    high: string;
    medium: string;
    low: string;
    none: string;
  };
  assessments: {
    confirmed: string;
    likely: string;
    possible: string;
    undetected: string;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Embed an invisible watermark into an image
 *
 * @param request - Image data and settings
 * @param signal - Optional abort signal
 * @returns Embedding result with watermarked image
 */
export async function embedWatermark(
  request: EmbedWatermarkRequest,
  signal?: AbortSignal
): Promise<EmbedWatermarkResponse> {
  const response = await apiServices.post<{ data: EmbedWatermarkResponse }>(
    `${BASE_URL}/embed`,
    request,
    { signal }
  );
  return response.data.data;
}

/**
 * Detect watermark in an image
 *
 * @param request - Image data
 * @param signal - Optional abort signal
 * @returns Detection result with confidence
 */
export async function detectWatermark(
  request: DetectWatermarkRequest,
  signal?: AbortSignal
): Promise<DetectWatermarkResponse> {
  const response = await apiServices.post<{ data: DetectWatermarkResponse }>(
    `${BASE_URL}/detect`,
    request,
    { signal }
  );
  return response.data.data;
}

/**
 * Get watermark job by ID
 *
 * @param jobId - Job ID
 * @param signal - Optional abort signal
 * @returns Job details
 */
export async function getWatermarkJob(
  jobId: number,
  signal?: AbortSignal
): Promise<WatermarkJob> {
  const response = await apiServices.get<{ data: WatermarkJob }>(
    `${BASE_URL}/jobs/${jobId}`,
    { signal }
  );
  return response.data.data;
}

/**
 * Get watermark jobs history
 *
 * @param params - Pagination and filter params
 * @param signal - Optional abort signal
 * @returns Paginated jobs list
 */
export async function getWatermarkJobs(
  params: GetJobsParams = {},
  signal?: AbortSignal
): Promise<WatermarkJobsResponse> {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append("type", params.type);
  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/jobs${queryString ? `?${queryString}` : ""}`;

  const response = await apiServices.get<{ data: WatermarkJobsResponse }>(url, {
    signal,
  });
  return response.data.data;
}

/**
 * Get watermark statistics
 *
 * @param signal - Optional abort signal
 * @returns Watermark statistics
 */
export async function getWatermarkStats(
  signal?: AbortSignal
): Promise<WatermarkStats> {
  const response = await apiServices.get<{ data: WatermarkStats }>(
    `${BASE_URL}/stats`,
    { signal }
  );
  return response.data.data;
}

/**
 * Check if watermark service is healthy
 *
 * @param signal - Optional abort signal
 * @returns Health check response
 */
export async function checkHealth(
  signal?: AbortSignal
): Promise<HealthCheckResponse> {
  const response = await apiServices.get<HealthCheckResponse>(
    `${BASE_URL}/health`,
    { signal }
  );
  return response.data;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert file to base64 string
 *
 * @param file - File to convert
 * @returns Base64 encoded string (without data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Download base64 image
 *
 * @param base64 - Base64 encoded image
 * @param filename - Output filename
 * @param mimeType - Image MIME type (default: image/png)
 */
export function downloadBase64Image(
  base64: string,
  filename: string,
  mimeType: string = "image/png"
): void {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Article 50 Compliance API Functions
// ============================================================================

/**
 * Embed watermark with full EU AI Act Article 50 compliance
 *
 * This provides both invisible watermarking and C2PA Content Credentials
 * for machine-readable provenance tracking.
 *
 * @param request - Image data with C2PA and provenance options
 * @param signal - Optional abort signal
 * @returns Article 50 compliant embedding result
 */
export async function embedArticle50(
  request: Article50EmbedRequest,
  signal?: AbortSignal
): Promise<Article50EmbedResponse> {
  const response = await apiServices.post<{ data: Article50EmbedResponse }>(
    `${BASE_URL}/embed/article50`,
    request,
    { signal }
  );
  return response.data.data;
}

/**
 * Comprehensive AI content detection with watermark and C2PA verification
 *
 * Returns detailed detection results including confidence levels,
 * C2PA manifest information, and AI-generated assessment.
 *
 * @param request - Image data
 * @param signal - Optional abort signal
 * @returns Comprehensive detection result
 */
export async function detectComprehensive(
  request: DetectWatermarkRequest,
  signal?: AbortSignal
): Promise<ComprehensiveDetectResponse> {
  const response = await apiServices.post<{ data: ComprehensiveDetectResponse }>(
    `${BASE_URL}/detect/comprehensive`,
    request,
    { signal }
  );
  return response.data.data;
}

/**
 * Get confidence threshold configuration and level descriptions
 *
 * @param signal - Optional abort signal
 * @returns Confidence thresholds and descriptions
 */
export async function getConfidenceThresholds(
  signal?: AbortSignal
): Promise<ConfidenceThresholds> {
  const response = await apiServices.get<{ data: ConfidenceThresholds }>(
    `${BASE_URL}/confidence/thresholds`,
    { signal }
  );
  return response.data.data;
}

// ============================================================================
// Article 50 Helper Functions
// ============================================================================

/**
 * Get human-readable label for confidence level
 */
export function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Low confidence",
    none: "Not detected",
  };
  return labels[level];
}

/**
 * Get human-readable label for AI-generated assessment
 */
export function getAssessmentLabel(assessment: AIGeneratedAssessment): string {
  const labels: Record<AIGeneratedAssessment, string> = {
    confirmed: "Confirmed AI-generated",
    likely: "Likely AI-generated",
    possible: "Possibly AI-generated",
    undetected: "Origin undetected",
  };
  return labels[assessment];
}

/**
 * Get color class for confidence level (for UI styling)
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: "#22c55e", // green
    medium: "#f59e0b", // amber
    low: "#ef4444", // red
    none: "#6b7280", // gray
  };
  return colors[level];
}

/**
 * Get color class for AI assessment (for UI styling)
 */
export function getAssessmentColor(assessment: AIGeneratedAssessment): string {
  const colors: Record<AIGeneratedAssessment, string> = {
    confirmed: "#22c55e", // green - verified
    likely: "#3b82f6", // blue
    possible: "#f59e0b", // amber - warning
    undetected: "#6b7280", // gray
  };
  return colors[assessment];
}

// ============================================================================
// Robustness Testing Types
// ============================================================================

export type TransformationType =
  | "jpeg_compression"
  | "resize"
  | "crop"
  | "rotation"
  | "brightness"
  | "contrast"
  | "noise"
  | "blur"
  | "format";

export type RobustnessLevel = "excellent" | "good" | "fair" | "poor";

export interface TransformationResult {
  transformationType: string;
  parameters: Record<string, unknown>;
  watermarkDetected: boolean;
  confidence: number;
  confidenceLoss: number;
  passed: boolean;
}

export interface RobustnessTestResult {
  originalConfidence: number;
  transformationsTested: number;
  transformationsPassed: number;
  overallRobustnessScore: number;
  results: TransformationResult[];
  isRobust: boolean;
  detectionThreshold: number;
  minRobustnessScore: number;
}

export interface SingleTransformationResult {
  originalConfidence: number;
  transformedConfidence: number;
  confidenceLoss: number;
  watermarkDetected: boolean;
  passed: boolean;
  transformedImageBase64: string;
}

export interface RobustnessTestRequest {
  image_base64: string;
  quick_test?: boolean;
}

export interface SingleTransformationRequest {
  image_base64: string;
  transformation_type: TransformationType;
  parameters?: Record<string, unknown>;
}

// ============================================================================
// Robustness Testing API Functions
// ============================================================================

/**
 * Test watermark robustness against various transformations
 *
 * Tests JPEG compression, resizing, cropping, rotation, color adjustments,
 * noise, blur, and format conversion.
 *
 * @param request - Image data and test options
 * @param signal - Optional abort signal
 * @returns Comprehensive robustness test result
 */
export async function testRobustness(
  request: RobustnessTestRequest,
  signal?: AbortSignal
): Promise<RobustnessTestResult> {
  const response = await apiServices.post<{ data: RobustnessTestResult }>(
    `${BASE_URL}/robustness/test`,
    request,
    { signal }
  );
  return response.data.data;
}

/**
 * Test watermark survival against a single transformation
 *
 * @param request - Image data and transformation settings
 * @param signal - Optional abort signal
 * @returns Single transformation test result with transformed image
 */
export async function testSingleTransformation(
  request: SingleTransformationRequest,
  signal?: AbortSignal
): Promise<SingleTransformationResult> {
  const response = await apiServices.post<{ data: SingleTransformationResult }>(
    `${BASE_URL}/robustness/transform`,
    request,
    { signal }
  );
  return response.data.data;
}

// ============================================================================
// Robustness Helper Functions
// ============================================================================

/**
 * Get robustness level based on score
 */
export function getRobustnessLevel(score: number): RobustnessLevel {
  if (score >= 0.9) return "excellent";
  if (score >= 0.7) return "good";
  if (score >= 0.5) return "fair";
  return "poor";
}

/**
 * Get human-readable label for robustness level
 */
export function getRobustnessLevelLabel(level: RobustnessLevel): string {
  const labels: Record<RobustnessLevel, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return labels[level];
}

/**
 * Get color for robustness level (for UI styling)
 */
export function getRobustnessColor(level: RobustnessLevel): string {
  const colors: Record<RobustnessLevel, string> = {
    excellent: "#22c55e", // green
    good: "#3b82f6", // blue
    fair: "#f59e0b", // amber
    poor: "#ef4444", // red
  };
  return colors[level];
}

/**
 * Get human-readable description of transformation type
 */
export function getTransformationDescription(type: TransformationType): string {
  const descriptions: Record<TransformationType, string> = {
    jpeg_compression: "JPEG compression",
    resize: "Image resizing",
    crop: "Image cropping",
    rotation: "Image rotation",
    brightness: "Brightness adjustment",
    contrast: "Contrast adjustment",
    noise: "Noise addition",
    blur: "Gaussian blur",
    format: "Format conversion",
  };
  return descriptions[type] || type;
}
