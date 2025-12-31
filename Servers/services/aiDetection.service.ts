/**
 * @fileoverview AI Detection Service Layer
 *
 * Business logic for AI Detection operations including:
 * - Repository URL validation
 * - Scan creation and management
 * - Repository scanning with pattern matching
 * - Finding aggregation and storage
 *
 * Follows the established service layer pattern with ServiceContext.
 *
 * @module services/aiDetection
 */

import { sequelize } from "../database/db";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  IScan,
  IServiceContext,
  ICreateScanInput,
  ICreateFindingInput,
  IFilePath,
  IParsedGitHubUrl,
  ScanStatus,
  IScanResponse,
  IFindingsResponse,
  IScansResponse,
  IScanStatusResponse,
  GovernanceStatus,
  IUpdateGovernanceStatusResponse,
} from "../domain.layer/interfaces/i.aiDetection";
import {
  ValidationException,
  NotFoundException,
  BusinessLogicException,
  ExternalServiceException,
  ForbiddenException,
} from "../domain.layer/exceptions/custom.exception";
import {
  createScanQuery,
  getScanByIdQuery,
  getScanWithUserQuery,
  updateScanProgressQuery,
  getScansListQuery,
  deleteScanQuery,
  getActiveScanForRepoQuery,
  createFindingsBatchQuery,
  createModelSecurityFindingsBatchQuery,
  getFindingsForScanQuery,
  getFindingsSummaryQuery,
  updateFindingGovernanceStatusQuery,
  getGovernanceSummaryQuery,
} from "../utils/aiDetection.utils";
import {
  AI_DETECTION_PATTERNS,
  CODE_EXTENSIONS,
  DEPENDENCY_FILES,
  SKIP_DIRECTORIES,
  DetectionPattern,
  calculateRiskLevel,
} from "../config/aiDetectionPatterns";
import {
  getProviderFromExtension,
  severityToConfidence,
  getDocumentationUrl,
  formatFindingName,
  generateFindingDescription,
  getThreatCategory,
} from "../utils/modelSecurity";
import {
  getDecryptedGitHubToken,
  updateGitHubTokenLastUsed,
} from "../utils/githubToken.utils";
import {
  IModelSecurityFinding,
  ICreateModelSecurityFindingInput,
  IModelSecurityFindingRecord,
} from "../domain.layer/interfaces/i.modelSecurity";
import { QueryTypes } from "sequelize";
import { isModelFileExtension } from "../config/modelSecurityPatterns";

// ============================================================================
// Types
// ============================================================================

/**
 * Maximum number of concurrent scans to track (prevents memory exhaustion)
 */
const MAX_CONCURRENT_SCANS = 100;

/**
 * Maximum age for progress entries before cleanup (5 minutes)
 */
const PROGRESS_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Progress entry with timestamp for cleanup
 */
interface ScanProgressEntry {
  status: ScanStatus;
  progress: number;
  currentFile?: string;
  filesScanned: number;
  totalFiles?: number;
  findingsCount: number;
  abortController?: AbortController;
  createdAt: number;
  startedAt?: Date;
  errorMessage?: string;
}

/**
 * In-memory progress tracking for active scans
 * Key: scanId, Value: progress state with timestamp
 */
const scanProgressMap = new Map<number, ScanProgressEntry>();

/**
 * Clean up stale progress entries that are older than MAX_AGE
 * This prevents memory leaks from orphaned entries
 */
function cleanupStaleProgressEntries(): void {
  const now = Date.now();
  for (const [scanId, entry] of scanProgressMap.entries()) {
    // Remove completed/failed/cancelled entries older than max age
    const isTerminal = ["completed", "failed", "cancelled"].includes(entry.status);
    const isStale = now - entry.createdAt > PROGRESS_MAX_AGE_MS;

    if (isTerminal && isStale) {
      scanProgressMap.delete(scanId);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupStaleProgressEntries, 60000);

/**
 * File item from local file system scan
 */
interface LocalFileItem {
  path: string;
  fullPath: string;
  size: number;
}

// ============================================================================
// Git Clone Helpers
// ============================================================================

/**
 * Clone repository timeout (2 minutes)
 */
const CLONE_TIMEOUT_MS = 120000;

/**
 * Clone a GitHub repository to a temporary directory
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param signal - Optional abort signal
 * @param githubToken - Optional GitHub token for private repositories
 * @returns Path to cloned repository
 */
async function cloneRepository(
  owner: string,
  repo: string,
  signal?: AbortSignal,
  githubToken?: string
): Promise<string> {
  if (signal?.aborted) {
    throw new BusinessLogicException("Scan was cancelled");
  }

  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `verifywise-scan-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  // Build repository URL - use authenticated URL if token provided
  let repoUrl: string;
  if (githubToken) {
    // Use token in URL for authentication (git will use this for HTTPS auth)
    repoUrl = `https://${githubToken}@github.com/${owner}/${repo}.git`;
  } else {
    repoUrl = `https://github.com/${owner}/${repo}.git`;
  }

  try {
    // Clone with depth 1 (shallow clone - only latest commit)
    // Use spawn to get the child process so we can kill it on abort
    const clonePromise = new Promise<void>((resolve, reject) => {
      const gitProcess = spawn("git", ["clone", "--depth", "1", repoUrl, tempDir]);

      let stderr = "";
      gitProcess.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle abort signal - kill the git process
      const abortHandler = () => {
        gitProcess.kill("SIGTERM");
        reject(new BusinessLogicException("Scan was cancelled"));
      };

      if (signal) {
        signal.addEventListener("abort", abortHandler, { once: true });
      }

      // Set timeout
      const timeout = setTimeout(() => {
        gitProcess.kill("SIGTERM");
        reject(new Error("timeout"));
      }, CLONE_TIMEOUT_MS);

      gitProcess.on("close", (code: number) => {
        clearTimeout(timeout);
        if (signal) {
          signal.removeEventListener("abort", abortHandler);
        }

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `git clone exited with code ${code}`));
        }
      });

      gitProcess.on("error", (err: Error) => {
        clearTimeout(timeout);
        if (signal) {
          signal.removeEventListener("abort", abortHandler);
        }
        reject(err);
      });
    });

    await clonePromise;
    return tempDir;
  } catch (error) {
    // Clean up on failure (including cancellation)
    await cleanupClonedRepo(tempDir);

    if (error instanceof BusinessLogicException) {
      throw error; // Re-throw cancellation
    }

    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes("Authentication failed") ||
          error.message.includes("could not read Username") ||
          error.message.includes("403")) {
        throw new ValidationException(
          githubToken
            ? "Authentication failed. The token may be invalid or expired, or lacks permission for this repository."
            : "Repository not found or is private. Configure a GitHub token in Settings to scan private repositories.",
          "repository_url"
        );
      }
      if (error.message.includes("not found") || error.message.includes("Repository not found")) {
        throw new ValidationException(
          githubToken
            ? "Repository not found. Check the URL and ensure your token has access to this repository."
            : "Repository not found or is private. Configure a GitHub token in Settings to scan private repositories.",
          "repository_url"
        );
      }
      if (error.message.includes("timeout")) {
        throw new ExternalServiceException(
          "Repository clone timed out. The repository may be too large.",
          "Git"
        );
      }
    }
    throw new ExternalServiceException(
      `Failed to clone repository: ${error instanceof Error ? error.message : "Unknown error"}`,
      "Git"
    );
  }
}

/**
 * Clean up cloned repository directory
 */
async function cleanupClonedRepo(repoPath: string): Promise<void> {
  try {
    await fs.promises.rm(repoPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Get all files in cloned repository recursively
 */
async function getRepositoryFiles(
  repoPath: string,
  signal?: AbortSignal
): Promise<LocalFileItem[]> {
  const files: LocalFileItem[] = [];

  async function scanDirectory(dirPath: string, relativePath: string = ""): Promise<void> {
    if (signal?.aborted) {
      throw new BusinessLogicException("Scan was cancelled");
    }

    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        // Skip .git directory and other skip directories
        if (entry.name === ".git" || SKIP_DIRECTORIES.includes(entry.name)) {
          continue;
        }
        await scanDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.promises.stat(fullPath);
          files.push({
            path: relPath,
            fullPath,
            size: stat.size,
          });
        } catch {
          // Skip files we can't stat
        }
      }
    }
  }

  await scanDirectory(repoPath);
  return files;
}

/**
 * Read file content from disk
 */
async function readFileContent(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf-8");
}

/**
 * Read file content as buffer (for binary files like model files)
 */
async function readFileBuffer(filePath: string): Promise<Buffer> {
  return fs.promises.readFile(filePath);
}

// ============================================================================
// URL Parsing and Validation
// ============================================================================

/**
 * Maximum allowed length for repository URL input
 */
const MAX_URL_LENGTH = 500;

/**
 * Maximum allowed length for owner/repo names (GitHub limit is 100)
 */
const MAX_NAME_LENGTH = 100;

/**
 * Allowed characters in GitHub owner/repo names
 * GitHub allows: alphanumeric, hyphens, underscores, periods
 */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Parse GitHub URL into owner and repo
 *
 * @param url - GitHub repository URL
 * @returns Parsed owner and repo
 * @throws {ValidationException} If URL is invalid, too long, or contains invalid characters
 */
export function parseGitHubUrl(url: string): IParsedGitHubUrl {
  // Validate input is a string
  if (typeof url !== "string") {
    throw new ValidationException(
      "Repository URL must be a string",
      "repository_url"
    );
  }

  // Validate URL length to prevent abuse
  if (url.length > MAX_URL_LENGTH) {
    throw new ValidationException(
      `Repository URL is too long (max ${MAX_URL_LENGTH} characters)`,
      "repository_url"
    );
  }

  // Clean the URL
  const cleanUrl = url.trim().replace(/\.git$/, "").replace(/\/$/, "");

  // Try HTTPS format: https://github.com/owner/repo
  const httpsMatch = cleanUrl.match(
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/i
  );
  if (httpsMatch) {
    return validateParsedNames(httpsMatch[1], httpsMatch[2]);
  }

  // Try SSH format: git@github.com:owner/repo
  const sshMatch = cleanUrl.match(/^git@github\.com:([^\/]+)\/([^\/]+)/i);
  if (sshMatch) {
    return validateParsedNames(sshMatch[1], sshMatch[2]);
  }

  // Try shorthand: owner/repo
  const shortMatch = cleanUrl.match(/^([^\/]+)\/([^\/]+)$/);
  if (shortMatch) {
    return validateParsedNames(shortMatch[1], shortMatch[2]);
  }

  throw new ValidationException(
    "Invalid GitHub URL format. Please provide a valid public GitHub repository URL.",
    "repository_url"
  );
}

/**
 * Validate parsed owner and repo names
 */
function validateParsedNames(owner: string, repo: string): IParsedGitHubUrl {
  // Check length
  if (owner.length > MAX_NAME_LENGTH || repo.length > MAX_NAME_LENGTH) {
    throw new ValidationException(
      `Owner/repository name is too long (max ${MAX_NAME_LENGTH} characters)`,
      "repository_url"
    );
  }

  // Check for valid characters
  if (!VALID_NAME_PATTERN.test(owner) || !VALID_NAME_PATTERN.test(repo)) {
    throw new ValidationException(
      "Owner/repository name contains invalid characters",
      "repository_url"
    );
  }

  return { owner, repo };
}


// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Check if file should be scanned
 */
function shouldScanFile(filePath: string): "code" | "dependency" | false {
  const fileName = filePath.split("/").pop() || "";

  // Check if in skip directory
  for (const skipDir of SKIP_DIRECTORIES) {
    if (filePath.includes(`/${skipDir}/`) || filePath.startsWith(`${skipDir}/`)) {
      return false;
    }
  }

  // Check for dependency files
  if (DEPENDENCY_FILES.includes(fileName)) {
    return "dependency";
  }

  // Check for code files
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  if (CODE_EXTENSIONS.includes(ext)) {
    return "code";
  }

  return false;
}

/**
 * Scan file content for AI patterns
 */
function scanFileForPatterns(
  content: string,
  fileType: "code" | "dependency"
): Array<{
  pattern: DetectionPattern;
  lineNumber: number | null;
  matchedText: string;
  findingType: "library" | "api_call" | "secret";
}> {
  const matches: Array<{
    pattern: DetectionPattern;
    lineNumber: number | null;
    matchedText: string;
    findingType: "library" | "api_call" | "secret";
  }> = [];

  const lines = content.split("\n");

  for (const category of AI_DETECTION_PATTERNS) {
    for (const pattern of category.patterns) {
      // Check imports/dependencies (library findings)
      const patternsToCheck =
        fileType === "code" ? pattern.patterns.imports : pattern.patterns.dependencies;

      if (patternsToCheck) {
        for (const regex of patternsToCheck) {
          // Search line by line for code files to get line numbers
          if (fileType === "code") {
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const match = line.match(regex);
              if (match) {
                matches.push({
                  pattern,
                  lineNumber: i + 1,
                  matchedText: match[0].substring(0, 100), // Truncate long matches
                  findingType: "library",
                });
                break; // One match per pattern per file is enough
              }
            }
          } else {
            // For dependency files, check entire content
            const match = content.match(regex);
            if (match) {
              matches.push({
                pattern,
                lineNumber: null,
                matchedText: match[0].substring(0, 100),
                findingType: "library",
              });
            }
          }
        }
      }

      // Check API calls (only for code files)
      if (fileType === "code" && pattern.patterns.apiCalls) {
        for (const regex of pattern.patterns.apiCalls) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(regex);
            if (match) {
              matches.push({
                pattern,
                lineNumber: i + 1,
                matchedText: match[0].substring(0, 100),
                findingType: "api_call",
              });
              break; // One match per pattern per file is enough
            }
          }
        }
      }

      // Check hardcoded secrets (only for code files)
      if (fileType === "code" && pattern.patterns.secrets) {
        for (const regex of pattern.patterns.secrets) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(regex);
            if (match) {
              // Mask the secret in matched text to avoid exposing it
              const matchedText = match[0].substring(0, 100);
              const maskedText = maskSecret(matchedText);
              matches.push({
                pattern,
                lineNumber: i + 1,
                matchedText: maskedText,
                findingType: "secret",
              });
              break; // One match per pattern per file is enough
            }
          }
        }
      }
    }
  }

  return matches;
}

/**
 * Mask a secret to avoid exposing full value
 * Shows first 4 and last 4 characters with asterisks in between
 */
function maskSecret(secret: string): string {
  if (secret.length <= 12) {
    // Very short secrets - show first 2 and mask rest
    return secret.substring(0, 2) + "*".repeat(secret.length - 2);
  }
  // Show first 4 and last 4 characters
  return secret.substring(0, 4) + "*".repeat(8) + secret.substring(secret.length - 4);
}
/**
 * Scan model file content for security threats
 * This works with content retrieved from GitHub API
 *
 * @param content - File content as string (may be base64 encoded for binary files)
 * @param filePath - File path for logging
 * @param extension - File extension
 * @returns Scan result with security findings
 */
async function scanModelFileContent(
  content: string,
  filePath: string,
  extension: string
): Promise<{ findings: IModelSecurityFinding[] }> {
  const findings: IModelSecurityFinding[] = [];

  try {
    // For serialized files (.pkl, .pt, .pth, .bin), we need to analyze the content
    // The content from GitHub API may be base64 encoded
    let buffer: Buffer;
    try {
      // Try to decode as base64 first (GitHub returns binary files as base64)
      buffer = Buffer.from(content, "base64");
    } catch {
      // If not base64, use as-is
      buffer = Buffer.from(content, "utf-8");
    }

    // Use pattern matching on the decoded content to find dangerous patterns
    const contentStr = buffer.toString("latin1");

    // Import the dangerous operator check from model security patterns
    const { checkDangerousOperator, getComplianceForThreatType } = await import(
      "../config/modelSecurityPatterns"
    );

    // Common dangerous patterns in serialized files
    // GLOBAL opcode: 'c' + module + '\n' + name + '\n'
    const globalPattern = /c([a-zA-Z_][a-zA-Z0-9_.]*)\n([a-zA-Z_][a-zA-Z0-9_]*)\n/g;
    let match;

    while ((match = globalPattern.exec(contentStr)) !== null) {
      const moduleName = match[1];
      const operatorName = match[2];

      const dangerousOp = checkDangerousOperator(moduleName, operatorName);
      if (dangerousOp) {
        const threatType = determineThreatTypeFromModule(moduleName);
        const compliance = getComplianceForThreatType(threatType);

        findings.push({
          threatType,
          threatName: getThreatNameFromType(threatType),
          description: dangerousOp.description,
          severity: dangerousOp.severity,
          moduleName,
          operatorName,
          cweId: compliance?.cweId || "CWE-502",
          cweName: compliance?.cweName || "Deserialization of Untrusted Data",
          owaspMlId: compliance?.owaspMlId || "ML06",
          owaspMlName: compliance?.owaspMlName || "AI Supply Chain Attacks",
          filePath,
          position: { offset: match.index, length: match[0].length },
        });
      }
    }

    // Also check for Lambda layers in H5 files
    if ([".h5", ".keras", ".hdf5"].includes(extension)) {
      const lambdaPatterns = [
        /"class_name":\s*"Lambda"/gi,
        /keras\.layers\.Lambda/gi,
      ];

      for (const pattern of lambdaPatterns) {
        if (pattern.test(contentStr)) {
          findings.push({
            threatType: "lambda_injection",
            threatName: "Lambda Layer Injection",
            description: "Keras Lambda layer detected which can contain arbitrary Python code",
            severity: "medium",
            moduleName: "keras.layers",
            operatorName: "Lambda",
            cweId: "CWE-94",
            cweName: "Improper Control of Generation of Code",
            owaspMlId: "ML06",
            owaspMlName: "AI Supply Chain Attacks",
            filePath,
          });
          break;
        }
      }
    }
  } catch (error) {
    // Silently continue - model file scan failures shouldn't fail the entire scan
    // Error is expected for corrupted or incompatible model files
  }

  return { findings };
}

/**
 * Determine threat type from module name
 */
function determineThreatTypeFromModule(module: string): string {
  const networkModules = ["socket", "httplib", "urllib", "requests", "aiohttp", "webbrowser"];
  const fileModules = ["shutil", "pathlib", "tensorflow.io"];
  const codeRunModules = ["os", "subprocess", "sys", "runpy", "code", "commands", "nt", "posix"];

  if (networkModules.some((m) => module.toLowerCase().includes(m))) return "network_access";
  if (fileModules.some((m) => module.toLowerCase().includes(m))) return "file_manipulation";
  if (codeRunModules.some((m) => module.toLowerCase() === m)) return "code_run";
  if (module === "builtins") return "code_run";

  return "deserialization";
}

/**
 * Get human-readable threat name from type
 */
function getThreatNameFromType(threatType: string): string {
  const names: Record<string, string> = {
    deserialization: "Deserialization Attack",
    code_run: "Arbitrary Code Run",
    network_access: "Unauthorized Network Access",
    file_manipulation: "File System Manipulation",
    lambda_injection: "Lambda Layer Injection",
  };
  return names[threatType] || "Security Threat";
}

// ============================================================================
// Scan Operations
// ============================================================================

/**
 * Start a new repository scan
 *
 * @param repositoryUrl - GitHub repository URL
 * @param ctx - Service context
 * @returns Created scan
 * @throws {ValidationException} If URL is invalid or repo is private
 * @throws {BusinessLogicException} If scan already in progress
 */
export async function startScan(
  repositoryUrl: string,
  ctx: IServiceContext
): Promise<IScan> {
  // Parse and validate URL
  const { owner, repo } = parseGitHubUrl(repositoryUrl);

  // Note: Repository validation now happens during clone
  // The cloneRepository function will throw if repo doesn't exist or is private

  // Check for existing active scan
  const activeScan = await getActiveScanForRepoQuery(owner, repo, ctx.tenantId);
  if (activeScan) {
    throw new BusinessLogicException(
      `A scan is already in progress for ${owner}/${repo}. Please wait for it to complete.`
    );
  }

  // Create scan record
  const transaction = await sequelize.transaction();
  try {
    const scanInput: ICreateScanInput = {
      repository_url: `https://github.com/${owner}/${repo}`,
      repository_owner: owner,
      repository_name: repo,
      triggered_by: ctx.userId,
      status: "pending",
    };

    const scan = await createScanQuery(scanInput, ctx.tenantId, transaction);
    await transaction.commit();

    // Check if we've hit the maximum concurrent scans limit
    if (scanProgressMap.size >= MAX_CONCURRENT_SCANS) {
      // Clean up stale entries first
      cleanupStaleProgressEntries();

      // If still at limit after cleanup, reject
      if (scanProgressMap.size >= MAX_CONCURRENT_SCANS) {
        throw new BusinessLogicException(
          "Too many concurrent scans. Please try again later."
        );
      }
    }

    // Initialize progress tracking with timestamp
    scanProgressMap.set(scan.id!, {
      status: "pending",
      progress: 0,
      filesScanned: 0,
      findingsCount: 0,
      abortController: new AbortController(),
      createdAt: Date.now(),
    });

    // Start async scanning process (non-blocking)
    // Errors are handled internally by executeScan via updateScanProgressQuery
    executeScan(scan.id!, owner, repo, ctx).catch(() => {
      // Error already handled and logged in executeScan
    });

    return scan;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Execute the actual scan process asynchronously using git clone
 */
async function executeScan(
  scanId: number,
  owner: string,
  repo: string,
  ctx: IServiceContext
): Promise<void> {
  const progressState = scanProgressMap.get(scanId);
  if (!progressState) return;

  const signal = progressState.abortController?.signal;
  let clonedRepoPath: string | null = null;

  try {
    // Update status to cloning
    const startedAt = new Date();
    progressState.status = "cloning";
    progressState.progress = 5;
    progressState.startedAt = startedAt;
    await updateScanProgressQuery(
      scanId,
      { status: "cloning", started_at: startedAt },
      ctx.tenantId
    );

    // Fetch GitHub token for private repository support
    const githubToken = await getDecryptedGitHubToken(ctx.tenantId);

    // Clone the repository (with token if available)
    clonedRepoPath = await cloneRepository(owner, repo, signal, githubToken || undefined);

    // Update last used timestamp if token was used
    if (githubToken) {
      await updateGitHubTokenLastUsed(ctx.tenantId);
    }

    // Get all files from cloned repository
    const allFiles = await getRepositoryFiles(clonedRepoPath, signal);

    // Filter scannable files (code and dependency files)
    const filesToScan = allFiles.filter((file) => shouldScanFile(file.path));

    progressState.totalFiles = filesToScan.length;
    progressState.status = "scanning";

    await updateScanProgressQuery(
      scanId,
      { status: "scanning", total_files: filesToScan.length },
      ctx.tenantId
    );

    // Collect findings (aggregated by pattern and finding type)
    const findingsMap = new Map<
      string,
      {
        pattern: DetectionPattern;
        filePaths: IFilePath[];
        category: string;
        findingType: "library" | "api_call" | "secret";
      }
    >();

    // Scan files - now reading from local disk (much faster!)
    for (let i = 0; i < filesToScan.length; i++) {
      if (signal?.aborted) {
        throw new BusinessLogicException("Scan was cancelled");
      }

      const file = filesToScan[i];
      const fileType = shouldScanFile(file.path);
      if (!fileType) continue;

      progressState.currentFile = file.path;
      progressState.filesScanned = i + 1;
      progressState.progress = Math.round(5 + (i / filesToScan.length) * 90);

      try {
        // Read file content from disk
        const content = await readFileContent(file.fullPath);

        // Scan for patterns
        const matches = scanFileForPatterns(content, fileType);

        // Aggregate findings (separate by findingType so library and api_call are tracked independently)
        for (const match of matches) {
          const key = `${match.pattern.name}::${match.pattern.provider}::${match.findingType}`;
          const existing = findingsMap.get(key);

          if (existing) {
            existing.filePaths.push({
              path: file.path,
              line_number: match.lineNumber,
              matched_text: match.matchedText,
            });
          } else {
            findingsMap.set(key, {
              pattern: match.pattern,
              category: AI_DETECTION_PATTERNS.find((c) =>
                c.patterns.includes(match.pattern)
              )?.name || "Unknown",
              findingType: match.findingType,
              filePaths: [
                {
                  path: file.path,
                  line_number: match.lineNumber,
                  matched_text: match.matchedText,
                },
              ],
            });
          }
        }

        progressState.findingsCount = findingsMap.size;
      } catch {
        // Skip files that fail to read (might be binary, permissions issue, etc.)
        // This is expected behavior and doesn't need logging
      }

      // Update progress in database periodically (every 50 files - can be more frequent since local reads are fast)
      if (i % 50 === 0) {
        await updateScanProgressQuery(
          scanId,
          { files_scanned: i + 1, findings_count: findingsMap.size },
          ctx.tenantId
        );
      }
    }

    // ========================================================================
    // Model Security Scanning (Phase 2)
    // ========================================================================
    const modelSecurityFindings: ICreateModelSecurityFindingInput[] = [];
    const MAX_MODEL_FILE_SIZE = 500 * 1024 * 1024; // 500MB local limit (more generous than API)

    // Filter model files from all files
    const modelFiles = allFiles.filter((file) =>
      isModelFileExtension(
        file.path.substring(file.path.lastIndexOf(".")).toLowerCase()
      )
    );

    // Scan model files for security threats
    for (const modelFile of modelFiles) {
      if (signal?.aborted) break;

      const extension = modelFile.path.substring(modelFile.path.lastIndexOf(".")).toLowerCase();

      // Check file size limit
      if (modelFile.size > MAX_MODEL_FILE_SIZE) {
        modelSecurityFindings.push({
          scan_id: scanId,
          finding_type: "model_security",
          category: "Scan Incomplete",
          name: "File too large to scan",
          provider: getProviderFromExtension(extension),
          confidence: "low",
          description: `File exceeds 500MB size limit (${Math.round(modelFile.size / 1024 / 1024)}MB). Unable to analyze for security threats.`,
          documentation_url: undefined,
          file_count: 1,
          file_paths: [{ path: modelFile.path, line_number: null, matched_text: "Size limit exceeded" }],
          severity: "low",
          cwe_id: "N/A",
          cwe_name: "N/A",
          owasp_ml_id: "N/A",
          owasp_ml_name: "N/A",
          threat_type: "scan_incomplete",
          operator_name: "size_check",
          module_name: "scanner",
        });
        continue;
      }

      try {
        // Read file content as buffer from disk
        const buffer = await readFileBuffer(modelFile.fullPath);
        const content = buffer.toString("base64"); // Convert to base64 for scanModelFileContent

        // Scan the file for security issues
        const scanResult = await scanModelFileContent(content, modelFile.path, extension);

        // Convert findings to database format
        for (const finding of scanResult.findings) {
          modelSecurityFindings.push({
            scan_id: scanId,
            finding_type: "model_security",
            category: getThreatCategory(finding.threatType),
            name: formatFindingName(finding.moduleName, finding.operatorName),
            provider: getProviderFromExtension(extension),
            confidence: severityToConfidence(finding.severity),
            description: generateFindingDescription(finding.threatType, finding.moduleName, finding.operatorName),
            documentation_url: getDocumentationUrl(finding.threatType, finding.cweId),
            file_count: 1,
            file_paths: [{
              path: modelFile.path,
              line_number: null,
              matched_text: finding.moduleName + "." + finding.operatorName,
            }],
            severity: finding.severity,
            cwe_id: finding.cweId,
            cwe_name: finding.cweName,
            owasp_ml_id: finding.owaspMlId,
            owasp_ml_name: finding.owaspMlName,
            threat_type: finding.threatType,
            operator_name: finding.operatorName,
            module_name: finding.moduleName,
          });
        }
      } catch (error) {
        // Create "scan incomplete" finding with reason
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        modelSecurityFindings.push({
          scan_id: scanId,
          finding_type: "model_security",
          category: "Scan Incomplete",
          name: "Unable to analyze file",
          provider: getProviderFromExtension(extension),
          confidence: "low",
          description: "Could not complete security scan: " + errorMessage,
          documentation_url: undefined,
          file_count: 1,
          file_paths: [{ path: modelFile.path, line_number: null, matched_text: "Scan incomplete" }],
          severity: "low",
          cwe_id: "N/A",
          cwe_name: "N/A",
          owasp_ml_id: "N/A",
          owasp_ml_name: "N/A",
          threat_type: "scan_incomplete",
          operator_name: "error",
          module_name: "scanner",
        });
        // Error already recorded as a finding with threat_type: "scan_incomplete"
      }
    }

    // Store findings in database
    const transaction = await sequelize.transaction();
    try {
      // Deduplicate findings by name+provider to avoid ON CONFLICT errors
      // (same library may be detected as both "library" and "api_call" finding types)
      const deduplicatedFindingsMap = new Map<string, ICreateFindingInput>();

      for (const [, finding] of findingsMap) {
        const findingType = finding.findingType || "library";
        const key = `${finding.pattern.name}::${finding.pattern.provider}`;
        const existing = deduplicatedFindingsMap.get(key);

        if (existing) {
          // Merge file paths from both findings
          const existingPaths = existing.file_paths || [];
          existing.file_paths = [...existingPaths, ...finding.filePaths];
          existing.file_count = existing.file_paths.length;
          // If one is api_call, prefer that (higher risk)
          if (findingType === "api_call") {
            existing.finding_type = "api_call";
            existing.confidence = "high";
            existing.risk_level = "high";
          }
        } else {
          deduplicatedFindingsMap.set(key, {
            scan_id: scanId,
            finding_type: findingType,
            category: finding.category,
            name: finding.pattern.name,
            provider: finding.pattern.provider,
            // API call findings are always high confidence
            confidence: findingType === "api_call" ? "high" : finding.pattern.confidence,
            // Calculate risk level based on provider and finding type
            risk_level: calculateRiskLevel(finding.pattern.provider, findingType),
            description: finding.pattern.description,
            documentation_url: finding.pattern.documentationUrl,
            file_count: finding.filePaths.length,
            file_paths: finding.filePaths,
          });
        }
      }

      const findingInputs = Array.from(deduplicatedFindingsMap.values());

      if (findingInputs.length > 0) {
        await createFindingsBatchQuery(findingInputs, ctx.tenantId, transaction);
      }

      // Store model security findings (deduplicate by name+provider to avoid ON CONFLICT errors)
      if (modelSecurityFindings.length > 0) {
        // Deduplicate security findings by aggregating file paths
        const securityFindingsMap = new Map<string, ICreateModelSecurityFindingInput>();
        for (const finding of modelSecurityFindings) {
          const key = `${finding.name}::${finding.provider}`;
          const existing = securityFindingsMap.get(key);
          if (existing) {
            // Merge file paths
            const existingPaths = existing.file_paths || [];
            const newPaths = finding.file_paths || [];
            existing.file_paths = [...existingPaths, ...newPaths];
            existing.file_count = existing.file_paths.length;
          } else {
            securityFindingsMap.set(key, { ...finding });
          }
        }
        const deduplicatedSecurityFindings = Array.from(securityFindingsMap.values());
        await createModelSecurityFindingsBatchQuery(deduplicatedSecurityFindings, ctx.tenantId, transaction);
      }

      // Mark scan as completed (include both library and security findings)
      const deduplicatedSecurityCount = modelSecurityFindings.length > 0
        ? new Set(modelSecurityFindings.map(f => `${f.name}::${f.provider}`)).size
        : 0;
      const totalFindings = findingsMap.size + deduplicatedSecurityCount;
      const completedAt = new Date();
      const durationMs = progressState.startedAt
        ? completedAt.getTime() - progressState.startedAt.getTime()
        : undefined;
      await updateScanProgressQuery(
        scanId,
        {
          status: "completed",
          files_scanned: filesToScan.length + modelFiles.length,
          findings_count: totalFindings,
          completed_at: completedAt,
          duration_ms: durationMs,
        },
        ctx.tenantId,
        transaction
      );

      await transaction.commit();

      progressState.status = "completed";
      progressState.progress = 100;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const status: ScanStatus =
      error instanceof BusinessLogicException &&
      errorMessage.includes("cancelled")
        ? "cancelled"
        : "failed";

    const errorCompletedAt = new Date();
    const errorDurationMs = progressState.startedAt
      ? errorCompletedAt.getTime() - progressState.startedAt.getTime()
      : undefined;
    await updateScanProgressQuery(
      scanId,
      {
        status,
        error_message: errorMessage,
        completed_at: errorCompletedAt,
        duration_ms: errorDurationMs,
      },
      ctx.tenantId
    );

    progressState.status = status;
    progressState.progress = 100;
    progressState.errorMessage = errorMessage;
  } finally {
    // Clean up cloned repository
    if (clonedRepoPath) {
      await cleanupClonedRepo(clonedRepoPath);
    }

    // Clean up progress tracking after a delay
    setTimeout(() => {
      scanProgressMap.delete(scanId);
    }, 60000); // Keep for 1 minute for status polling
  }
}

/**
 * Get scan status (for polling)
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Scan status
 */
export async function getScanStatus(
  scanId: number,
  ctx: IServiceContext
): Promise<IScanStatusResponse> {
  // Check in-memory progress first
  const progressState = scanProgressMap.get(scanId);
  if (progressState) {
    return {
      id: scanId,
      status: progressState.status,
      progress: progressState.progress,
      current_file: progressState.currentFile,
      files_scanned: progressState.filesScanned,
      total_files: progressState.totalFiles,
      findings_count: progressState.findingsCount,
      error_message: progressState.errorMessage,
    };
  }

  // Fall back to database
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  return {
    id: scan.id!,
    status: scan.status,
    progress: scan.status === "completed" ? 100 : scan.status === "failed" ? 100 : 0,
    files_scanned: scan.files_scanned || 0,
    total_files: scan.total_files || undefined,
    findings_count: scan.findings_count || 0,
    error_message: scan.error_message || undefined,
  };
}

/**
 * Get scan with full details
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Scan with summary
 */
export async function getScan(
  scanId: number,
  ctx: IServiceContext
): Promise<IScanResponse> {
  const scan = await getScanWithUserQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  const summary = await getFindingsSummaryQuery(scanId, ctx.tenantId);

  return {
    scan: {
      id: scan.id!,
      repository_url: scan.repository_url,
      repository_owner: scan.repository_owner,
      repository_name: scan.repository_name,
      status: scan.status,
      findings_count: scan.findings_count || 0,
      files_scanned: scan.files_scanned || 0,
      started_at: scan.started_at?.toISOString(),
      completed_at: scan.completed_at?.toISOString(),
      duration_ms: scan.duration_ms || undefined,
      error_message: scan.error_message || undefined,
      triggered_by: scan.triggered_by_user,
      created_at: scan.created_at!.toISOString(),
    },
    summary,
  };
}

/**
 * Get findings for a scan
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @param page - Page number
 * @param limit - Items per page
 * @param confidence - Optional confidence filter
 * @param findingType - Optional finding type filter (library, dependency, api_call)
 * @returns Paginated findings
 */
export async function getScanFindings(
  scanId: number,
  ctx: IServiceContext,
  page: number = 1,
  limit: number = 50,
  confidence?: string,
  findingType?: string
): Promise<IFindingsResponse> {
  // Verify scan exists
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  const { findings, total } = await getFindingsForScanQuery(
    scanId,
    ctx.tenantId,
    page,
    limit,
    confidence,
    findingType
  );

  return {
    findings: findings.map((f) => ({
      id: f.id!,
      finding_type: f.finding_type,
      category: f.category,
      name: f.name,
      provider: f.provider || "",
      confidence: f.confidence,
      risk_level: f.risk_level || "medium",
      description: f.description,
      documentation_url: f.documentation_url,
      file_count: f.file_count || 0,
      file_paths: f.file_paths || [],
      governance_status: f.governance_status,
      governance_updated_at: f.governance_updated_at?.toISOString(),
      governance_updated_by: f.governance_updated_by,
    })),
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get scan history list
 *
 * @param ctx - Service context
 * @param page - Page number
 * @param limit - Items per page
 * @param status - Optional status filter
 * @returns Paginated scans
 */
export async function getScans(
  ctx: IServiceContext,
  page: number = 1,
  limit: number = 20,
  status?: ScanStatus
): Promise<IScansResponse> {
  const { scans, total } = await getScansListQuery(ctx.tenantId, page, limit, status);

  return {
    scans: scans.map((s) => ({
      id: s.id!,
      repository_url: s.repository_url,
      repository_owner: s.repository_owner,
      repository_name: s.repository_name,
      status: s.status,
      findings_count: s.findings_count || 0,
      files_scanned: s.files_scanned || 0,
      started_at: s.started_at?.toISOString(),
      completed_at: s.completed_at?.toISOString(),
      duration_ms: s.duration_ms || undefined,
      triggered_by: s.triggered_by_user,
      created_at: s.created_at!.toISOString(),
    })),
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get the most recent active scan (pending, cloning, or scanning)
 * Efficient single query to check for any active scans.
 *
 * @param ctx - Service context
 * @returns Active scan or null if no active scan
 */
export async function getActiveScan(
  ctx: IServiceContext
): Promise<IScan | null> {
  const activeStatuses = ["pending", "cloning", "scanning"];

  // Single query to find any active scan (most recent first)
  // Note: users table is in public schema, not tenant schema
  const [scan] = await sequelize.query<IScan>(
    `SELECT s.*
     FROM "${ctx.tenantId}"."ai_detection_scans" s
     WHERE s.status IN (:statuses)
     ORDER BY s.created_at DESC
     LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      replacements: { statuses: activeStatuses },
    }
  );

  return scan || null;
}

/**
 * Cancel an in-progress scan
 *
 * Authorization: Admin can cancel any scan, Editor can only cancel their own scans.
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Updated scan
 * @throws {NotFoundException} If scan not found
 * @throws {ForbiddenException} If user not authorized to cancel this scan
 * @throws {BusinessLogicException} If scan cannot be cancelled (wrong status)
 */
export async function cancelScan(
  scanId: number,
  ctx: IServiceContext
): Promise<{ id: number; status: "cancelled"; message: string }> {
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  // Authorization check: Admin can cancel any scan, others can only cancel their own
  const isAdmin = ctx.role === "Admin";
  const isOwner = scan.triggered_by === ctx.userId;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenException(
      "You can only cancel scans that you initiated",
      "scan",
      "cancel"
    );
  }

  if (!["pending", "cloning", "scanning"].includes(scan.status)) {
    throw new BusinessLogicException(
      `Cannot cancel scan with status "${scan.status}". Only pending/in-progress scans can be cancelled.`
    );
  }

  // Abort the scan if it's in progress
  const progressState = scanProgressMap.get(scanId);
  if (progressState?.abortController) {
    progressState.abortController.abort();
  }

  // Update database with duration
  const cancelledAt = new Date();
  const cancelDurationMs = progressState?.startedAt
    ? cancelledAt.getTime() - progressState.startedAt.getTime()
    : undefined;
  await updateScanProgressQuery(
    scanId,
    { status: "cancelled", completed_at: cancelledAt, duration_ms: cancelDurationMs },
    ctx.tenantId
  );

  return {
    id: scanId,
    status: "cancelled",
    message: "Scan cancelled successfully",
  };
}

/**
 * Delete a completed/failed/cancelled scan
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Success message
 */
export async function deleteScan(
  scanId: number,
  ctx: IServiceContext
): Promise<{ message: string }> {
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  if (["pending", "cloning", "scanning"].includes(scan.status)) {
    throw new BusinessLogicException(
      `Cannot delete scan with status "${scan.status}". Please cancel it first.`
    );
  }

  const transaction = await sequelize.transaction();
  try {
    await deleteScanQuery(scanId, ctx.tenantId, transaction);
    await transaction.commit();

    return { message: "Scan deleted successfully" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ============================================================================
// Security Findings
// ============================================================================

/**
 * Get security findings for a scan
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @param page - Page number
 * @param limit - Page size
 * @param severity - Severity filter
 * @returns Paginated security findings
 */
export async function getSecurityFindings(
  scanId: number,
  ctx: IServiceContext,
  page: number = 1,
  limit: number = 50,
  severity?: string
): Promise<{
  findings: IModelSecurityFindingRecord[];
  pagination: { total: number; page: number; limit: number; total_pages: number };
}> {
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  // Build WHERE clause for findings query - filter by finding_type = 'model_security'
  let whereClause = `WHERE scan_id = $1 AND finding_type = 'model_security'`;
  const countParams: (number | string)[] = [scanId];

  if (severity) {
    whereClause += ` AND severity = $2`;
    countParams.push(severity);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${ctx.tenantId}".ai_detection_findings
    ${whereClause}
  `;
  const countResult = await sequelize.query(countQuery, {
    bind: countParams,
    type: QueryTypes.SELECT,
  }) as Array<{ total: string }>;
  const total = parseInt(countResult[0]?.total || "0", 10);

  // Get paginated findings
  const offset = (page - 1) * limit;
  const paginatedParams: (number | string)[] = [...countParams, limit, offset];
  const limitParamIndex = severity ? 3 : 2;
  const offsetParamIndex = severity ? 4 : 3;

  const findingsQuery = `
    SELECT
      id,
      scan_id,
      finding_type,
      category,
      name,
      provider,
      confidence,
      description,
      documentation_url,
      file_paths,
      severity,
      cwe_id,
      cwe_name,
      owasp_ml_id,
      owasp_ml_name,
      threat_type,
      operator_name,
      module_name,
      created_at
    FROM "${ctx.tenantId}".ai_detection_findings
    ${whereClause}
    ORDER BY
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      id
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const findings = await sequelize.query(findingsQuery, {
    bind: paginatedParams,
    type: QueryTypes.SELECT,
  }) as IModelSecurityFindingRecord[];

  // Transform findings (parse file_paths if stored as JSON string)
  const transformedFindings = findings.map((finding) => ({
    ...finding,
    file_paths:
      typeof finding.file_paths === "string"
        ? JSON.parse(finding.file_paths)
        : finding.file_paths,
    file_count: Array.isArray(finding.file_paths)
      ? finding.file_paths.length
      : typeof finding.file_paths === "string"
      ? JSON.parse(finding.file_paths).length
      : 0,
  }));

  return {
    findings: transformedFindings,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get security summary for a scan
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Security summary
 */
export async function getSecuritySummary(
  scanId: number,
  ctx: IServiceContext
): Promise<{
  total: number;
  by_severity: { critical: number; high: number; medium: number; low: number };
  by_threat_type: Record<string, number>;
  model_files_scanned: number;
}> {
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  // Get counts by severity - filter by finding_type = 'model_security'
  const severityQuery = `
    SELECT severity, COUNT(*) as count
    FROM "${ctx.tenantId}".ai_detection_findings
    WHERE scan_id = $1 AND finding_type = 'model_security'
    GROUP BY severity
  `;
  const severityCounts = await sequelize.query(severityQuery, {
    bind: [scanId],
    type: QueryTypes.SELECT,
  }) as Array<{ severity: string; count: string }>;

  // Get counts by threat type - filter by finding_type = 'model_security'
  const threatTypeQuery = `
    SELECT threat_type, COUNT(*) as count
    FROM "${ctx.tenantId}".ai_detection_findings
    WHERE scan_id = $1 AND finding_type = 'model_security'
    GROUP BY threat_type
  `;
  const threatTypeCounts = await sequelize.query(threatTypeQuery, {
    bind: [scanId],
    type: QueryTypes.SELECT,
  }) as Array<{ threat_type: string; count: string }>;

  // Get model files scanned count (count findings with finding_type = 'model_security')
  // Note: model_files_scanned column is not yet in the schema, so we derive from findings
  const modelFilesQuery = `
    SELECT COUNT(DISTINCT file_paths) as model_files_scanned
    FROM "${ctx.tenantId}".ai_detection_findings
    WHERE scan_id = $1 AND finding_type = 'model_security'
  `;
  const modelFilesResult = await sequelize.query(modelFilesQuery, {
    bind: [scanId],
    type: QueryTypes.SELECT,
  }) as Array<{ model_files_scanned: string }>;

  // Build response
  const by_severity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  let total = 0;
  for (const row of severityCounts) {
    const count = parseInt(row.count, 10);
    total += count;
    if (row.severity in by_severity) {
      by_severity[row.severity as keyof typeof by_severity] = count;
    }
  }

  const by_threat_type: Record<string, number> = {};
  for (const row of threatTypeCounts) {
    by_threat_type[row.threat_type] = parseInt(row.count, 10);
  }

  return {
    total,
    by_severity,
    by_threat_type,
    model_files_scanned: parseInt(modelFilesResult[0]?.model_files_scanned || "0", 10),
  };
}

// ============================================================================
// Governance Status Operations
// ============================================================================

/**
 * Update governance status for a finding
 *
 * @param scanId - Scan ID
 * @param findingId - Finding ID
 * @param governanceStatus - New status or null to clear
 * @param ctx - Service context
 * @returns Updated finding with governance info
 */
export async function updateFindingGovernanceStatus(
  scanId: number,
  findingId: number,
  governanceStatus: GovernanceStatus | null,
  ctx: IServiceContext
): Promise<IUpdateGovernanceStatusResponse> {
  // Verify scan exists and belongs to tenant
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan ${scanId} not found`);
  }

  // Validate governance status if provided
  if (governanceStatus !== null && !["reviewed", "approved", "flagged"].includes(governanceStatus)) {
    throw new ValidationException("governance_status must be 'reviewed', 'approved', 'flagged', or null");
  }

  // Update the finding
  const updatedFinding = await updateFindingGovernanceStatusQuery(
    findingId,
    scanId,
    governanceStatus,
    ctx.userId,
    ctx.tenantId
  );

  if (!updatedFinding) {
    throw new NotFoundException(`Finding ${findingId} not found in scan ${scanId}`);
  }

  return {
    id: updatedFinding.id!,
    governance_status: governanceStatus,
    governance_updated_at: new Date().toISOString(),
    governance_updated_by: ctx.userId,
  };
}

/**
 * Get governance summary for a scan
 *
 * @param scanId - Scan ID
 * @param ctx - Service context
 * @returns Governance summary with counts
 */
export async function getGovernanceSummary(
  scanId: number,
  ctx: IServiceContext
): Promise<{
  total: number;
  reviewed: number;
  approved: number;
  flagged: number;
  unreviewed: number;
}> {
  // Verify scan exists
  const scan = await getScanByIdQuery(scanId, ctx.tenantId);
  if (!scan) {
    throw new NotFoundException(`Scan ${scanId} not found`);
  }

  return getGovernanceSummaryQuery(scanId, ctx.tenantId);
}
