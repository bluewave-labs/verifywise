# Model Security Scanning Implementation Plan

## Executive Summary

Add model security scanning to VerifyWise AI Detection to identify malicious code hidden in ML model files found in GitHub repositories.

---

## Research Summary

### Tools Analyzed

| Tool | Approach | Strengths | Weaknesses |
|------|----------|-----------|------------|
| **Picklescan** | Blocklist | Industry standard, simple | 3 CVEs in 2025 (now patched) |
| **ModelScan** | Blocklist | Multi-format, enterprise-ready | Python dependency |
| **Fickling** | Allowlist | 100% detection, decompilation | More complex |
| **pickleparser** | Native TS | No deps, browser-compatible | Parsing only, no security logic |

### ProtectAI ModelScan Key Features

- **Multi-format support**: PKL, H5, SavedModel, joblib, cloudpickle, dill
- **Severity levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Exit codes**: 0=clean, 1=malware, 2=error, 3=no files, 4=invalid args
- **Output formats**: Console, JSON, custom
- **Static analysis**: Reads bytes without executing code

**Dangerous Operators (CRITICAL)**:
exec, eval, runpy, sys, open, breakpoint, os, subprocess, socket, nt, posix

**Dangerous Operators (HIGH)**:
webbrowser, httplib, requests.api, TensorFlow ReadFile/WriteFile

**Dangerous Operators (MEDIUM)**:
Unknown operators, Keras Lambda layers

### Hugging Face Partnership Stats

- 4.47 million models scanned
- 352,000 unsafe issues found across 51,700 models
- Guardian scans 35+ formats including GGUF, SafeTensors, LLM-specific

---

## Implementation Decision: Hybrid Approach

Phase 1: Native TypeScript (Fast, No Dependencies)
- Serialized file opcode parsing via pickleparser npm package
- Dangerous module/function detection
- SafeTensors header validation
- Basic H5 Lambda layer detection

Phase 2: Deep Scan Mode (Optional, Python - Future)
- ModelScan integration for thorough analysis
- Fickling for decompilation/advanced detection

---

## New Files to Create

Servers/
├── config/
│   └── modelSecurityPatterns.ts      # Dangerous operators/modules list
├── utils/
│   └── modelSecurity/
│       ├── pickleScanner.ts          # Bytecode analysis
│       ├── safetensorsScanner.ts     # SafeTensors validation
│       ├── h5Scanner.ts              # H5/Keras Lambda detection
│       └── complianceMapping.ts      # CWE/OWASP references
└── domain.layer/
    └── interfaces/
        └── i.modelSecurity.ts        # Type definitions

---

## Database Changes

Add columns to ai_detection_findings:

- severity: VARCHAR(20) - 'critical', 'high', 'medium', 'low'
- cwe_id: VARCHAR(20) - e.g., 'CWE-502'
- cwe_name: VARCHAR(200)
- owasp_ml_id: VARCHAR(20) - e.g., 'ML06'
- owasp_ml_name: VARCHAR(200)
- threat_type: VARCHAR(50) - 'deserialization', 'lambda_injection', etc.
- operator_name: VARCHAR(100)
- module_name: VARCHAR(100)

---

## Compliance Mapping

| Threat Type | CWE | OWASP ML |
|-------------|-----|----------|
| Deserialization | CWE-502 | ML06 - AI Supply Chain Attacks |
| Code Injection | CWE-94 | ML06 - AI Supply Chain Attacks |
| DoS Attack | CWE-400 | ML06 - AI Supply Chain Attacks |

---

## Model Formats to Support

| Format | Extensions | Risk Level | Scanner |
|--------|------------|------------|---------|
| Python Serialized | .pkl | Critical | pickleScanner |
| PyTorch | .pt, .pth, .bin | Critical | pickleScanner |
| Keras/TensorFlow | .h5, .keras | High | h5Scanner |
| SafeTensors | .safetensors | Low | safetensorsScanner |

---

## Settings Configuration

modelSecurity: {
  enabled: boolean;
  scanMode: 'quick' | 'thorough';
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
  maxModelFileSize: 100MB (GitHub limit);
}

---

## Frontend Updates

- New section: "Security Findings" on scan details page
- Severity badges: Critical (red), High (orange), Medium (yellow), Low (blue)
- CWE/OWASP links to official documentation
- Security findings count in history table

---

## Dependencies

npm packages to add:
- pickleparser: ^0.2.1

No Python dependencies for Phase 1.

---

## Rollout Plan

Week 1: Database migration + Scanner config
Week 2: Implement scanners (pkl, safetensors, h5)
Week 3: Service integration + API updates
Week 4: Frontend integration
Week 5: Testing + Settings UI
Week 6: Documentation + Release

---

## References

- https://huggingface.co/docs/hub/security-pickle
- https://github.com/protectai/modelscan
- https://github.com/trailofbits/fickling
- https://huggingface.co/blog/safetensors-security-audit
- https://cwe.mitre.org/data/definitions/502.html
- https://owasp.org/www-project-machine-learning-security-top-10/
