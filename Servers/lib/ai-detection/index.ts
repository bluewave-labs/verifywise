/**
 * @fileoverview AI Detection Library
 *
 * A library for detecting AI/ML libraries, API calls, and secrets in codebases.
 * Designed to be extracted as a standalone npm package.
 *
 * @example
 * ```typescript
 * import { AIDetector, patterns } from '@verifywise/ai-detection';
 *
 * const detector = new AIDetector();
 * const results = detector.scanFile(content, 'app.py');
 * ```
 *
 * @module lib/ai-detection
 */

// Core types
export * from "./types";

// Pattern definitions
export * from "./patterns";

// Scanner implementation
export * from "./scanner";

// Utilities
export * from "./utils";
