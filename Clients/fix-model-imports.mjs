#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const modelsCommonDir = path.join(srcDir, 'domain', 'models', 'Common');

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
    // Skip directories we can't read
  }
  return fileList;
}

/**
 * Get folders in Common and create import mapping
 */
function getImportMappings() {
  const mappings = [];

  try {
    const items = fs.readdirSync(modelsCommonDir);

    items.forEach(folderName => {
      const folderPath = path.join(modelsCommonDir, folderName);
      const stat = fs.statSync(folderPath);

      if (stat.isDirectory()) {
        // List files in folder to find the actual model file
        const files = fs.readdirSync(folderPath);
        const modelFile = files.find(f => f.endsWith('.model.ts'));

        if (modelFile) {
          const fileNameWithoutExt = modelFile.replace('.model.ts', '');

          // Create mappings for incorrect patterns:
          // Pattern 1: Folder/Folder.model → Folder/fileName.model
          // This handles imports like: UserPreferences/UserPreferences.model
          const incorrectPattern1 = `${folderName}/${folderName}.model`;
          const correctPattern = `${folderName}/${fileNameWithoutExt}.model`;

          // Pattern 2: /Folder.model → /Folder/fileName.model
          // This handles imports that might just reference the folder

          mappings.push({
            folderName,
            correctImport: correctPattern,
            incorrectPatterns: [incorrectPattern1]
          });
        }
      }
    });
  } catch (err) {
    console.error('Error reading Common folder:', err.message);
  }

  return mappings;
}

/**
 * Fix imports in a file
 */
function fixImportsInFile(filePath, mappings) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const mapping of mappings) {
      for (const incorrect of mapping.incorrectPatterns) {
        // Pattern to match imports with the incorrect path
        const pattern = new RegExp(`(from\\s+['\"])([^'\"]*?)${incorrect.replace(/\//g, '\\/')}([^'\"]*?)(['\"])`, 'g');

        if (pattern.test(content)) {
          const replacer = (match, prefix, before, after, quote) => {
            const newPath = before + mapping.correctImport + after;
            return prefix + newPath + quote;
          };
          content = content.replace(pattern, replacer);
          updated = true;
        }
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
 * Main function
 */
function fixModelImports() {
  console.log('🔧 Fixing model import casing...\n');

  const mappings = getImportMappings();

  if (mappings.length === 0) {
    console.log('✅ No model import fixes needed!');
    return;
  }

  console.log(`📋 Found ${mappings.length} model folders to check`);
  console.log('📝 Scanning for incorrect imports...\n');

  const tsFiles = findFiles(srcDir);

  let filesUpdated = 0;
  for (const file of tsFiles) {
    if (fixImportsInFile(file, mappings)) {
      filesUpdated++;
      const relPath = file.replace(srcDir + '\\', '').replace(srcDir + '/', '');
      console.log(`  ✓ Fixed: ${relPath}`);
    }
  }

  console.log(`\n✅ Fixed imports in ${filesUpdated} files`);
  console.log('Run "npm run build" to validate changes.');
}

fixModelImports();
