/**
 * @fileoverview C2PA Service
 *
 * Service layer for C2PA Content Credentials manifest operations.
 * Communicates with the WatermarkService Python API for manifest creation and verification.
 *
 * @module services/watermark/c2pa
 */

import axios from "axios";
import logger from "../../utils/logger/fileLogger";

// ============================================================================
// Constants
// ============================================================================

const WATERMARK_SERVICE_URL =
  process.env.WATERMARK_SERVICE_URL || "http://localhost:8001";
const C2PA_OPERATION_TIMEOUT_MS = 60000; // 1 minute

// Digital source types for AI content per C2PA specification
export const DIGITAL_SOURCE_TYPES = {
  AI_GENERATED: "http://c2pa.org/digitalsourcetype/trainedAlgorithmicData",
  COMPOSITE: "http://c2pa.org/digitalsourcetype/compositeWithTrainedAlgorithmicMedia",
  SYNTHETIC: "http://c2pa.org/digitalsourcetype/digitalArt",
} as const;

// ============================================================================
// Interfaces
// ============================================================================

export interface C2PAManifestOptions {
  digitalSourceType?: string;
  allowTraining?: boolean;
  allowMining?: boolean;
  customAssertions?: Array<{
    label: string;
    data: Record<string, unknown>;
  }>;
}

export interface AIProvenance {
  modelId?: number;
  modelName?: string;
  modelVersion?: string;
  provider?: string;
  generationPromptHash?: string;
  generationTimestamp?: Date;
}

export interface C2PACreateRequest {
  imageBase64: string;
  fileName: string;
  fileType: string;
  options?: C2PAManifestOptions;
  provenance?: AIProvenance;
}

export interface C2PACreateResult {
  manifestId: string;
  instanceId: string;
  contentHash: string;
  signedImageBase64: string;
  manifestJson: Record<string, unknown>;
}

export interface C2PAVerifyResult {
  manifestFound: boolean;
  signatureValid: boolean;
  chainVerified: boolean;
  manifestData?: {
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
    assertions: Array<{
      label: string;
      data: Record<string, unknown>;
    }>;
  };
  validationErrors?: string[];
}

export interface Article50EmbedRequest {
  imageBase64: string;
  fileName: string;
  fileType: string;
  strength?: number;
  enableC2PA?: boolean;
  c2paOptions?: C2PAManifestOptions;
  provenance?: AIProvenance;
}

export interface Article50EmbedResult {
  success: boolean;
  watermarkedImageBase64: string;
  watermarkApplied: boolean;
  c2paManifestId?: string;
  c2paManifestApplied: boolean;
  contentHash: string;
  processingTimeMs: number;
  euAiActCompliant: boolean;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create and embed a C2PA Content Credentials manifest into an image
 *
 * @param request - Image data and C2PA options
 * @returns Created manifest details and signed image
 */
export async function createC2PAManifest(
  request: C2PACreateRequest
): Promise<C2PACreateResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/c2pa/create`,
      {
        image_base64: request.imageBase64,
        file_name: request.fileName,
        file_type: request.fileType,
        options: {
          digital_source_type:
            request.options?.digitalSourceType || DIGITAL_SOURCE_TYPES.AI_GENERATED,
          allow_training: request.options?.allowTraining || false,
          allow_mining: request.options?.allowMining || false,
          custom_assertions: request.options?.customAssertions || [],
        },
        provenance: {
          model_name: request.provenance?.modelName,
          model_version: request.provenance?.modelVersion,
          provider: request.provenance?.provider,
          generation_prompt_hash: request.provenance?.generationPromptHash,
          generation_timestamp: request.provenance?.generationTimestamp?.toISOString(),
        },
      },
      { timeout: C2PA_OPERATION_TIMEOUT_MS }
    );

    return {
      manifestId: response.data.manifest_id,
      instanceId: response.data.instance_id,
      contentHash: response.data.content_hash,
      signedImageBase64: response.data.signed_image_base64,
      manifestJson: response.data.manifest_json,
    };
  } catch (error) {
    logger.error("C2PA manifest creation failed", { error });
    throw error;
  }
}

/**
 * Verify a C2PA Content Credentials manifest in an image
 *
 * @param imageBase64 - Base64 encoded image
 * @returns Verification result with manifest data
 */
export async function verifyC2PAManifest(
  imageBase64: string
): Promise<C2PAVerifyResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/c2pa/verify`,
      { image_base64: imageBase64 },
      { timeout: C2PA_OPERATION_TIMEOUT_MS }
    );

    return {
      manifestFound: response.data.manifest_found,
      signatureValid: response.data.signature_valid,
      chainVerified: response.data.chain_verified,
      manifestData: response.data.manifest_data,
      validationErrors: response.data.validation_errors,
    };
  } catch (error) {
    logger.error("C2PA manifest verification failed", { error });
    throw error;
  }
}

/**
 * Extract C2PA manifest without full verification (faster)
 *
 * @param imageBase64 - Base64 encoded image
 * @returns Extracted manifest or null if not found
 */
export async function extractC2PAManifest(
  imageBase64: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/c2pa/extract`,
      { image_base64: imageBase64 },
      { timeout: 15000 }
    );

    return response.data.manifest || null;
  } catch (error) {
    logger.error("C2PA manifest extraction failed", { error });
    return null;
  }
}

/**
 * Embed both invisible watermark and C2PA manifest for full Article 50 compliance
 *
 * This is the recommended function for EU AI Act compliance as it provides:
 * 1. Invisible watermark for robust detection
 * 2. C2PA Content Credentials for machine-readable provenance
 *
 * @param request - Image data with watermark and C2PA options
 * @returns Fully compliant watermarked image with manifest
 */
export async function embedArticle50Compliant(
  request: Article50EmbedRequest
): Promise<Article50EmbedResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/embed/article50`,
      {
        image_base64: request.imageBase64,
        file_name: request.fileName,
        file_type: request.fileType,
        strength: request.strength || 1.0,
        enable_c2pa: request.enableC2PA !== false, // Default to true
        c2pa_options: {
          digital_source_type:
            request.c2paOptions?.digitalSourceType || DIGITAL_SOURCE_TYPES.AI_GENERATED,
          allow_training: request.c2paOptions?.allowTraining || false,
          allow_mining: request.c2paOptions?.allowMining || false,
          custom_assertions: request.c2paOptions?.customAssertions || [],
        },
        provenance: {
          model_name: request.provenance?.modelName,
          model_version: request.provenance?.modelVersion,
          provider: request.provenance?.provider,
          generation_prompt_hash: request.provenance?.generationPromptHash,
          generation_timestamp: request.provenance?.generationTimestamp?.toISOString(),
        },
      },
      { timeout: C2PA_OPERATION_TIMEOUT_MS * 2 } // Allow more time for combined operation
    );

    return {
      success: response.data.success,
      watermarkedImageBase64: response.data.watermarked_image_base64,
      watermarkApplied: response.data.watermark_applied,
      c2paManifestId: response.data.c2pa_manifest_id,
      c2paManifestApplied: response.data.c2pa_manifest_applied,
      contentHash: response.data.content_hash,
      processingTimeMs: response.data.processing_time_ms,
      euAiActCompliant: response.data.eu_ai_act_compliant,
    };
  } catch (error) {
    logger.error("Article 50 compliant embedding failed", { error });
    throw error;
  }
}

/**
 * Determine confidence level based on watermark detection confidence
 *
 * @param confidence - Detection confidence (0-1)
 * @returns Confidence level classification
 */
export function getConfidenceLevel(
  confidence: number
): "high" | "medium" | "low" | "none" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  if (confidence >= 0.5) return "low";
  return "none";
}

/**
 * Determine AI-generated assessment based on watermark and C2PA results
 *
 * @param watermarkConfidence - Watermark detection confidence
 * @param c2paResult - Optional C2PA verification result
 * @returns Assessment classification
 */
export function determineAIGeneratedAssessment(
  watermarkConfidence: number,
  c2paResult?: C2PAVerifyResult
): {
  assessment: "confirmed" | "likely" | "possible" | "undetected";
  reasoning: string;
} {
  // C2PA provides strongest evidence
  if (c2paResult?.manifestFound && c2paResult?.signatureValid) {
    const digitalSourceType = c2paResult.manifestData?.digitalSourceType || "";
    if (digitalSourceType.includes("trainedAlgorithmicData")) {
      return {
        assessment: "confirmed",
        reasoning:
          "Valid C2PA manifest with AI-generated digital source type provides cryptographic proof of AI origin.",
      };
    }
  }

  // Watermark-based assessment
  if (watermarkConfidence >= 0.85) {
    return {
      assessment: "confirmed",
      reasoning: `High confidence watermark detection (${(watermarkConfidence * 100).toFixed(1)}%) indicates AI-generated content.`,
    };
  } else if (watermarkConfidence >= 0.65) {
    return {
      assessment: "likely",
      reasoning: `Medium confidence watermark detection (${(watermarkConfidence * 100).toFixed(1)}%) suggests AI-generated content, possibly modified.`,
    };
  } else if (watermarkConfidence >= 0.5) {
    return {
      assessment: "possible",
      reasoning: `Low confidence watermark signal (${(watermarkConfidence * 100).toFixed(1)}%) may indicate heavily modified AI content.`,
    };
  }

  // C2PA without valid signature but manifest found
  if (c2paResult?.manifestFound) {
    return {
      assessment: "possible",
      reasoning:
        "C2PA manifest found but signature could not be verified. Content may have been modified.",
    };
  }

  return {
    assessment: "undetected",
    reasoning:
      "No watermark or valid C2PA manifest detected. Content origin cannot be determined.",
  };
}

/**
 * Confidence thresholds for detection
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.5,
} as const;

// ============================================================================
// Real C2PA v2 Interfaces (using c2pa-python)
// ============================================================================

export interface C2PAV2CreateRequest {
  imageBase64: string;
  format: string;
  modelName: string;
  modelVersion: string;
  provider: string;
  promptHash?: string;
  title?: string;
}

export interface C2PAV2CreateResult {
  manifestId: string;
  claimGenerator: string;
  signatureInfo: {
    issuer: string;
    certFingerprint: string;
    algorithm: string;
    mode?: string;
  };
  assertions: Array<{
    label: string;
    data: Record<string, unknown>;
  }>;
  isAiGenerated: boolean;
  createdAt: string;
  signedImageBase64: string;
  usingRealC2PA: boolean;
}

export interface C2PAV2VerifyResult {
  isValid: boolean;
  hasCredentials: boolean;
  manifestId?: string;
  claimGenerator?: string;
  signatureValid: boolean;
  trustChainValid: boolean;
  assertions: Array<{
    label: string;
    data: Record<string, unknown>;
  }>;
  isAiGenerated: boolean;
  aiInfo?: {
    modelName?: string;
    modelVersion?: string;
    provider?: string;
    generationTimestamp?: string;
  };
  errors: string[];
  warnings: string[];
  usingRealC2PA: boolean;
}

export interface CertificateInfo {
  fingerprint: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serialNumber: string;
  organization: string;
  c2paAvailable: boolean;
}

export interface C2PAStatusInfo {
  c2paLibraryAvailable: boolean;
  certificateLoaded: boolean;
  certificateFingerprint?: string;
  certificateExpires?: string;
  signingAlgorithm: string;
  timestampServer: string;
}

// ============================================================================
// Real C2PA v2 Service Functions
// ============================================================================

/**
 * Create Content Credentials using the real c2pa-python library
 *
 * This uses proper X.509 certificate-based signing for production-ready
 * Content Credentials that comply with EU AI Act Article 50.
 *
 * @param request - Image and AI provenance information
 * @returns Created credentials with signed image
 */
export async function createRealC2PACredentials(
  request: C2PAV2CreateRequest
): Promise<C2PAV2CreateResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/c2pa/v2/create`,
      {
        image_base64: request.imageBase64,
        format: request.format,
        model_name: request.modelName,
        model_version: request.modelVersion,
        provider: request.provider,
        prompt_hash: request.promptHash,
        title: request.title,
      },
      { timeout: C2PA_OPERATION_TIMEOUT_MS }
    );

    return {
      manifestId: response.data.manifest_id,
      claimGenerator: response.data.claim_generator,
      signatureInfo: {
        issuer: response.data.signature_info?.issuer,
        certFingerprint: response.data.signature_info?.cert_fingerprint,
        algorithm: response.data.signature_info?.algorithm,
        mode: response.data.signature_info?.mode,
      },
      assertions: response.data.assertions || [],
      isAiGenerated: response.data.is_ai_generated,
      createdAt: response.data.created_at,
      signedImageBase64: response.data.signed_image_base64,
      usingRealC2PA: response.data.using_real_c2pa,
    };
  } catch (error) {
    logger.error("Real C2PA creation failed", { error });
    throw error;
  }
}

/**
 * Verify Content Credentials using the real c2pa-python library
 *
 * Returns detailed verification results including signature validation,
 * trust chain verification, and AI generation detection.
 *
 * @param imageBase64 - Base64 encoded image
 * @param format - Image format (png, jpeg, etc.)
 * @returns Detailed verification result
 */
export async function verifyRealC2PACredentials(
  imageBase64: string,
  format: string = "png"
): Promise<C2PAV2VerifyResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/c2pa/v2/verify`,
      {
        image_base64: imageBase64,
        format: format,
      },
      { timeout: C2PA_OPERATION_TIMEOUT_MS }
    );

    return {
      isValid: response.data.is_valid,
      hasCredentials: response.data.has_credentials,
      manifestId: response.data.manifest_id,
      claimGenerator: response.data.claim_generator,
      signatureValid: response.data.signature_valid,
      trustChainValid: response.data.trust_chain_valid,
      assertions: response.data.assertions || [],
      isAiGenerated: response.data.is_ai_generated,
      aiInfo: response.data.ai_info,
      errors: response.data.errors || [],
      warnings: response.data.warnings || [],
      usingRealC2PA: response.data.using_real_c2pa,
    };
  } catch (error) {
    logger.error("Real C2PA verification failed", { error });
    throw error;
  }
}

/**
 * Get information about the current C2PA signing certificate
 *
 * @returns Certificate details including fingerprint, validity period
 */
export async function getCertificateInfo(): Promise<CertificateInfo> {
  try {
    const response = await axios.get(`${WATERMARK_SERVICE_URL}/c2pa/certificate`, {
      timeout: 5000,
    });

    return {
      fingerprint: response.data.fingerprint,
      subject: response.data.subject,
      issuer: response.data.issuer,
      notBefore: response.data.not_before,
      notAfter: response.data.not_after,
      serialNumber: response.data.serial_number,
      organization: response.data.organization,
      c2paAvailable: response.data.c2pa_available,
    };
  } catch (error) {
    logger.error("Failed to get certificate info", { error });
    throw error;
  }
}

/**
 * Get C2PA service status including library availability and certificate status
 *
 * @returns Service status information
 */
export async function getC2PAStatus(): Promise<C2PAStatusInfo> {
  try {
    const response = await axios.get(`${WATERMARK_SERVICE_URL}/c2pa/status`, {
      timeout: 5000,
    });

    return {
      c2paLibraryAvailable: response.data.c2pa_library_available,
      certificateLoaded: response.data.certificate_loaded,
      certificateFingerprint: response.data.certificate_fingerprint,
      certificateExpires: response.data.certificate_expires,
      signingAlgorithm: response.data.signing_algorithm,
      timestampServer: response.data.timestamp_server,
    };
  } catch (error) {
    logger.error("Failed to get C2PA status", { error });
    throw error;
  }
}
