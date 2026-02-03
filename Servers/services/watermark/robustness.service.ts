/**
 * @fileoverview Robustness Testing Service
 *
 * Service layer for watermark robustness testing.
 * Tests watermark survival against various image transformations.
 *
 * @module services/watermark/robustness
 */

import axios from "axios";
import logger from "../../utils/logger/fileLogger";

// ============================================================================
// Constants
// ============================================================================

const WATERMARK_SERVICE_URL =
  process.env.WATERMARK_SERVICE_URL || "http://localhost:8001";
const ROBUSTNESS_TEST_TIMEOUT_MS = 120000; // 2 minutes for full test

// ============================================================================
// Interfaces
// ============================================================================

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

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Run comprehensive robustness test on a watermarked image
 *
 * Tests watermark survival against various transformations:
 * - JPEG compression at different quality levels
 * - Image resizing
 * - Cropping
 * - Rotation
 * - Brightness/contrast adjustments
 * - Noise addition
 * - Blur
 * - Format conversion
 *
 * @param imageBase64 - Base64 encoded watermarked image
 * @param quickTest - If true, run only essential tests (faster)
 * @returns Comprehensive robustness test result
 */
export async function testWatermarkRobustness(
  imageBase64: string,
  quickTest = false
): Promise<RobustnessTestResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/robustness/test`,
      {
        image_base64: imageBase64,
        quick_test: quickTest,
      },
      { timeout: ROBUSTNESS_TEST_TIMEOUT_MS }
    );

    const data = response.data;

    return {
      originalConfidence: data.original_confidence,
      transformationsTested: data.transformations_tested,
      transformationsPassed: data.transformations_passed,
      overallRobustnessScore: data.overall_robustness_score,
      results: data.results.map((r: Record<string, unknown>) => ({
        transformationType: r.transformation_type,
        parameters: r.parameters,
        watermarkDetected: r.watermark_detected,
        confidence: r.confidence,
        confidenceLoss: r.confidence_loss,
        passed: r.passed,
      })),
      isRobust: data.is_robust,
      detectionThreshold: data.detection_threshold,
      minRobustnessScore: data.min_robustness_score,
    };
  } catch (error) {
    logger.error("Robustness test failed", { error });
    throw error;
  }
}

/**
 * Test watermark survival against a single transformation
 *
 * Useful for debugging or testing specific attack vectors.
 *
 * @param imageBase64 - Base64 encoded watermarked image
 * @param transformationType - Type of transformation to apply
 * @param parameters - Parameters for the transformation
 * @returns Single transformation test result with transformed image
 */
export async function testSingleTransformation(
  imageBase64: string,
  transformationType: TransformationType,
  parameters: Record<string, unknown> = {}
): Promise<SingleTransformationResult> {
  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/robustness/transform`,
      {
        image_base64: imageBase64,
        transformation_type: transformationType,
        parameters,
      },
      { timeout: 60000 }
    );

    const data = response.data;

    return {
      originalConfidence: data.original_confidence,
      transformedConfidence: data.transformed_confidence,
      confidenceLoss: data.confidence_loss,
      watermarkDetected: data.watermark_detected,
      passed: data.passed,
      transformedImageBase64: data.transformed_image_base64,
    };
  } catch (error) {
    logger.error("Single transformation test failed", { error });
    throw error;
  }
}

/**
 * Get human-readable description of transformation type
 */
export function getTransformationDescription(
  transformationType: TransformationType
): string {
  const descriptions: Record<TransformationType, string> = {
    jpeg_compression: "JPEG Compression",
    resize: "Image Resizing",
    crop: "Image Cropping",
    rotation: "Image Rotation",
    brightness: "Brightness Adjustment",
    contrast: "Contrast Adjustment",
    noise: "Noise Addition",
    blur: "Gaussian Blur",
    format: "Format Conversion",
  };
  return descriptions[transformationType] || transformationType;
}

/**
 * Get robustness level based on score
 */
export function getRobustnessLevel(
  score: number
): "excellent" | "good" | "fair" | "poor" {
  if (score >= 0.9) return "excellent";
  if (score >= 0.7) return "good";
  if (score >= 0.5) return "fair";
  return "poor";
}

/**
 * Get color for robustness level (for UI)
 */
export function getRobustnessColor(
  level: "excellent" | "good" | "fair" | "poor"
): string {
  const colors = {
    excellent: "#22c55e", // green
    good: "#3b82f6", // blue
    fair: "#f59e0b", // amber
    poor: "#ef4444", // red
  };
  return colors[level];
}
