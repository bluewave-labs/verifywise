# AI Detection User Guide

## Introduction

AI Detection is a VerifyWise module that scans GitHub repositories to detect AI and machine learning libraries, providing organizations with visibility into their AI technology stack. The scanner identifies over 50 AI/ML frameworks including OpenAI, TensorFlow, PyTorch, LangChain, and Hugging Face, while also detecting security vulnerabilities in serialized model files. This helps governance and compliance teams discover "shadow AI"—AI usage that may not be formally documented—and supports regulatory requirements such as the EU AI Act.

## Why it matters

Modern organizations often adopt AI tools faster than governance processes can track them. A data science team might integrate a new LLM provider, or an engineer might add a machine learning library to solve a specific problem, without updating the official AI inventory. AI Detection closes this gap by scanning codebases directly, surfacing what is actually in use rather than relying on manual documentation. The module also identifies potentially malicious code hidden in model files—a growing supply chain risk as organizations download pretrained models from public repositories.

## Prerequisites

Before using AI Detection you need VerifyWise access with any authenticated role. Admin access is required only for configuring GitHub tokens to scan private repositories. For private repository scanning, you will also need a GitHub Personal Access Token with the `repo` scope.

## Scanning a repository

Navigate to **AI Detection → Scan** from the app switcher or sidebar. Enter a GitHub repository URL in the input field using either the full URL format (`https://github.com/owner/repo`) or the short format (`owner/repo`). Click **Scan** to begin the analysis.

The scanner clones the repository to a temporary cache, then analyzes source files, dependency manifests, and model files. A progress indicator shows the current file being processed, total files scanned, and findings discovered so far. You can cancel an in-progress scan at any time; the partial results are discarded and the scan is marked as cancelled in the history.

By default, only public repositories can be scanned. To scan private repositories, configure a GitHub Personal Access Token in **AI Detection → Settings**. See the GitHub token configuration section below for setup instructions.

## Understanding results

After a scan completes, results are organized into two tabs: **Libraries** for detected AI/ML frameworks and **Security** for model file vulnerabilities.

### Libraries tab

The Libraries tab displays all detected AI/ML technologies with their provider, confidence level, and file count. Click any row to expand and view specific file paths and line numbers where the library was found.

Confidence levels indicate detection certainty: **High** means a direct, unambiguous match such as an explicit import or dependency declaration; **Medium** indicates a likely match with some ambiguity; **Low** suggests a possible match requiring manual verification.

### Security tab

The Security tab shows findings from model file analysis. Serialized model files (`.pkl`, `.pt`, `.h5`) can contain malicious code that executes automatically when loaded. The scanner detects dangerous patterns including system command execution, network access, and code injection.

Security findings include severity levels: **Critical** indicates direct code execution risk requiring immediate investigation; **High** means indirect execution or data exfiltration risk; **Medium** suggests potentially dangerous patterns depending on context; **Low** is informational or minimal risk.

Each security finding includes CWE (Common Weakness Enumeration) and OWASP ML Top 10 references. CWE-502 (Deserialization of Untrusted Data) is the most common finding, indicating that loading the model file could execute arbitrary code. OWASP ML06 (AI Supply Chain Attacks) maps to vulnerabilities in models distributed through public repositories. For more information, see https://cwe.mitre.org and https://owasp.org/www-project-machine-learning-security-top-10/.

## Scan history

Navigate to **AI Detection → History** to view all past scans. The history table displays repository name, status, findings count, files scanned, duration, and date. Click any completed scan row to view its full results.

Each scan record is preserved indefinitely for audit purposes. You can delete individual scans by clicking the trash icon—this permanently removes the scan and all associated findings.

## Configuring GitHub tokens for private repositories

To scan private repositories, configure a GitHub Personal Access Token in **AI Detection → Settings**. The token requires the `repo` scope for private repository access, or `public_repo` scope if you only need enhanced rate limits for public repositories.

The token is encrypted at rest using AES-256-CBC encryption and is never returned to the frontend after saving—only a masked indicator confirms configuration. The token is used server-side exclusively for git clone operations.

To create a token, visit https://github.com/settings/tokens/new, enter a descriptive name, select the `repo` scope, set an expiration period, and generate the token. Copy it immediately as GitHub will not show it again. In VerifyWise, paste the token in Settings, optionally add a label, click **Test token** to verify it works, then **Save token** to store it.

For detailed instructions on GitHub token management, see the official documentation at https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token.

## Model security scanning

AI Detection automatically scans model files for security vulnerabilities. Many ML model formats use Python's pickle serialization, which can execute arbitrary code when loading a file. Attackers exploit this by embedding malicious payloads in models distributed through public repositories.

The scanner detects dangerous patterns across multiple model formats. Python pickle files (`.pkl`, `.pickle`) and PyTorch models (`.pt`, `.pth`, `.bin`) carry critical risk as they use pickle serialization internally. Keras/TensorFlow models (`.h5`, `.keras`) carry high risk due to Lambda layers that can contain arbitrary code. SafeTensors files (`.safetensors`) carry low risk as the format was designed specifically to be safe.

Dangerous operators detected include code execution functions (`eval`, `exec`, `compile`), system access modules (`os`, `subprocess`, `socket`), network libraries (`requests`, `urllib`), and obfuscation primitives (`base64`, `zlib`). The scanner also detects pickle opcode patterns at the byte level, identifying GLOBAL opcodes that import dangerous modules.

## Compliance considerations

AI Detection supports compliance efforts by maintaining an audit trail of all scans with timestamps, user attribution, and complete findings. Security findings include industry-standard CWE and OWASP ML references suitable for compliance reporting.

For EU AI Act compliance, AI Detection helps organizations inventory AI systems in use, identify high-risk AI components, and document technical measures for AI oversight. Regular scanning demonstrates due diligence in monitoring AI usage across the organization.

## Troubleshooting

If a scan fails immediately, verify the repository URL format and check whether the repository is private (requiring token configuration). If a scan takes too long, note that large repositories with many files may require several minutes; the scanner processes Python files, JavaScript/TypeScript files, dependency manifests, and model files.

If the token test fails, the token may have expired, lack required scopes, or been revoked—generate a new token with the `repo` scope. If no findings are detected, the repository may not contain AI/ML libraries, or libraries may use non-standard import patterns not yet covered by the scanner.
