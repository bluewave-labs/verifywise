#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const modelsCommonDir = path.join(srcDir, 'domain', 'models', 'Common');

/**
 * Recursively find all files matching extension
 */
function findFiles(dir, ext, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!file.startsWith('.') && !['node_modules', 'dist'].includes(file)) {
          findFiles(filePath, ext, fileList);
        }
      } else if (file.endsWith(ext)) {
        fileList.push(filePath);
      }
    });
  } catch (err) {
    // Skip directories we can't read
  }

  return fileList;
}

/**
 * Convert camelCase to PascalCase
 */
function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get files in Common folder that need renaming
 */
function getFilesToRename() {
  const files = fs.readdirSync(modelsCommonDir);
  const renameMap = {};

  files.forEach(file => {
    if (file.endsWith('.model.ts')) {
      const baseName = file.replace('.model.ts', '');
      // Check if it starts with lowercase
      if (baseName[0] === baseName[0].toLowerCase()) {
        const newName = toPascalCase(baseName) + '.model.ts';
        renameMap[file] = newName;
      }
    }
  });

  return renameMap;
}

/**
 * Create import replacement mapping
 */
function createImportReplacementMap(renameMap) {
  const map = {};

  for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldBaseName = oldName.replace('.model.ts', '');
    const newBaseName = newName.replace('.model.ts', '');

    // Create patterns for different import path formats
    map[`domain/models/Common/${oldBaseName}`] = `domain/models/Common/${newBaseName}`;
    map[oldBaseName] = newBaseName;
  }

  return map;
}

/**
 * Update imports in a file
 */
function updateImportsInFile(filePath, importMap) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const [oldImport, newImport] of Object.entries(importMap)) {
      const pattern = new RegExp(`(from\\s+['"])([^'"]*?)${oldImport}([^'"]*?)(['"])`, 'g');

      if (pattern.test(content)) {
        const replacer = (match, prefix, before, after, quote) => {
          const newPath = before + newImport + after;
          return prefix + newPath + quote;
        };
        content = content.replace(pattern, replacer);
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
 * Main refactoring function
 */
function refactorModelsCommon() {
  console.log('🔄 Starting Models/Common folder refactoring...\n');

  const renameMap = getFilesToRename();
  const renameCount = Object.keys(renameMap).length;

  if (renameCount === 0) {
    console.log('✅ No files need renaming in Models/Common folder - all follow PascalCase!');
    return;
  }

  console.log(`📋 Step 1: Renaming ${renameCount} model files...`);
  for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(modelsCommonDir, oldName);
    const newPath = path.join(modelsCommonDir, newName);

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`  ✓ Renamed: ${oldName} → ${newName}`);
    } catch (error) {
      console.error(`  ✗ Error renaming ${oldName}: ${error.message}`);
    }
  }

  const importMap = createImportReplacementMap(renameMap);

  // Step 2: Update imports
  console.log('\n📝 Step 2: Updating imports in codebase...');
  const tsFiles = findFiles(srcDir, '.ts');
  const tsxFiles = findFiles(srcDir, '.tsx');
  const allFiles = [...tsFiles, ...tsxFiles];

  let filesUpdated = 0;
  for (const file of allFiles) {
    if (updateImportsInFile(file, importMap)) {
      filesUpdated++;
    }
  }
  console.log(`  ✓ Updated imports in ${filesUpdated} files\n`);

  console.log('✅ Models/Common folder refactoring complete!');
  console.log('Run "npm run build" to validate changes.');
}

// Run the refactoring
refactorModelsCommon();
