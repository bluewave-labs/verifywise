#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

/**
 * Recursively find all TypeScript and TSX files
 */
function findFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && !['node_modules', 'dist'].includes(file)) {
          findFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    });
  } catch (err) {
    // Skip
  }
  return fileList;
}

/**
 * Parse import/require statements to get paths
 */
function extractImportPaths(content) {
  const imports = [];

  // Match both import and require statements
  const importRegex = /(?:import|from)\s+['"]([\w./@\-]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Get the casing fixes needed by analyzing the imports vs actual files
 */
function analyzeCasingConflicts() {
  console.log('🔍 Analyzing casing conflicts...\n');

  const tsFiles = findFiles(srcDir);
  const importPaths = new Set();

  // Collect all imported paths
  for (const file of tsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const paths = extractImportPaths(content);
      paths.forEach(p => importPaths.add(p));
    } catch (err) {
      // Skip
    }
  }

  const casingSensitiveImports = [];

  // Check each import to see if there's a file with different casing
  for (const importPath of importPaths) {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      // This is complex - skip for now
      continue;
    }

    // Handle absolute imports
    let searchPath = path.join(srcDir, importPath.replace(/\//g, path.sep));

    // Try common file extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const basePath = searchPath;

    let foundFile = null;
    for (const ext of extensions) {
      if (fs.existsSync(basePath + ext)) {
        foundFile = basePath + ext;
        break;
      }
    }

    if (!foundFile) {
      // Maybe it's a directory with index
      if (fs.existsSync(basePath)) {
        for (const ext of extensions) {
          if (fs.existsSync(path.join(basePath, 'index' + ext))) {
            foundFile = path.join(basePath, 'index' + ext);
            break;
          }
        }
      }
    }

    if (foundFile) {
      const actualCasing = path.basename(foundFile);
      const importedCasing = path.basename(importPath);

      if (actualCasing.toLowerCase() === importedCasing.toLowerCase() &&
          actualCasing !== importedCasing) {
        casingSensitiveImports.push({
          importPath,
          actualPath: foundFile,
          actualCasing,
          importedCasing
        });
      }
    }
  }

  return casingSensitiveImports;
}

/**
 * Fix a file's imports to use correct casing
 */
function fixImportCasing(filePath, casingFixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const fix of casingFixes) {
      // Create pattern to match the imported casing
      const pattern = new RegExp(
        `(from\\s+['"'"])${fix.importPath.replace(/\//g, '\\/')}(['"'"])`,
        'g'
      );

      if (pattern.test(content)) {
        // Fix to use actual casing
        const correctedPath = fix.importPath.replace(
          new RegExp(fix.importedCasing + '$'),
          fix.actualCasing
        );

        content = content.replace(
          pattern,
          `$1${correctedPath}$2`
        );
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Main function - uses a simpler approach
 * Just fix known problematic patterns
 */
function fixCasing() {
  console.log('🔧 Fixing casing conflicts across codebase...\n');

  // Known casing fixes based on build errors
  const knownFixes = [
    // Repository files - keep lowercase
    { incorrect: /ProjectRisk\.repository/g, correct: 'projectRisk.repository' },
    { incorrect: /Project\.repository/g, correct: 'project.repository' },
    { incorrect: /File\.repository/g, correct: 'file.repository' },
    { incorrect: /UserPreferences\.repository/g, correct: 'userPreferences.repository' },
    { incorrect: /Vendor\.repository/g, correct: 'vendor.repository' },
    { incorrect: /ModelInventoryHistory\.repository/g, correct: 'modelInventoryHistory.repository' },
    { incorrect: /Task\.repository/g, correct: 'task.repository' },

    // Utils files - keep lowercase
    { incorrect: /FileTransform\.utils/g, correct: 'fileTransform.utils' },
    { incorrect: /FileErrorHandler\.utils/g, correct: 'fileErrorHandler.utils' },
    { incorrect: /FrameworkDataUtils/g, correct: 'frameworkDataUtils' },
    { incorrect: /VendorScorecard\.utils/g, correct: 'vendorScorecard.utils' },

    // Tools files - keep lowercase
    { incorrect: /tools\/FileUtil/g, correct: 'tools/fileUtil' },
    { incorrect: /tools\/FileDownload/g, correct: 'tools/fileDownload' },

    // Redux folders - keep lowercase
    { incorrect: /\/File\/fileSlice/g, correct: '/file/fileSlice' },

    // Constants - keep lowercase
    { incorrect: /constants\/Frameworks/g, correct: 'constants/frameworks' },
    { incorrect: /constants\/FileManager/g, correct: 'constants/fileManager' },
    { incorrect: /constants\/Roles/g, correct: 'constants/roles' },

    // Hooks - fix typo and casing
    { incorrect: /useProFilePhotoFetch/g, correct: 'useProfilePhotoFetch' },

    // Components - keep lowercase
    { incorrect: /ProjectRiskValue\.ts/g, correct: 'projectRiskValue.ts' },
    { incorrect: /EvidenceHubTable/g, correct: 'evidenceHubTable' },

    // Enums - keep camelCase
    { incorrect: /enums\/ModelInventory\.enum/g, correct: 'enums/modelInventory.enum' },
    { incorrect: /enums\/Task\.enum/g, correct: 'enums/task.enum' },
    { incorrect: /enums\/EvidenceHub\.enum/g, correct: 'enums/evidenceHub.enum' },

    // Interfaces - keep i.camelCase
    { incorrect: /interfaces\/i\.Task/g, correct: 'interfaces/i.task' },
    { incorrect: /interfaces\/i\.ModelInventory/g, correct: 'interfaces/i.modelInventory' },
    { incorrect: /interfaces\/i\.ModelRisk/g, correct: 'interfaces/i.modelRisk' },
    { incorrect: /interfaces\/i\.Project/g, correct: 'interfaces/i.project' },
  ];

  const tsFiles = findFiles(srcDir);
  let filesFixed = 0;

  for (const file of tsFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      for (const fix of knownFixes) {
        content = content.replace(fix.incorrect, fix.correct);
      }

      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        filesFixed++;
      }
    } catch (err) {
      // Skip
    }
  }

  console.log(`✅ Fixed casing in ${filesFixed} files\n`);
  console.log('Run "npm run build" to validate changes.');
}

fixCasing();
