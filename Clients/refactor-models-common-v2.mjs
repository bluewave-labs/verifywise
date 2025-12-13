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
 * Get files and folders that need renaming
 */
function getRenameMappings() {
  const folderRenameMap = {};
  const fileRenameMap = {};

  const items = fs.readdirSync(modelsCommonDir);

  items.forEach(item => {
    const fullPath = path.join(modelsCommonDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Check folder name
      const folderName = item;
      if (folderName[0] === folderName[0].toLowerCase()) {
        const newFolderName = toPascalCase(folderName);
        folderRenameMap[folderName] = newFolderName;
      }

      // Check model file inside folder
      const modelFile = `${item}.model.ts`;
      const modelFilePath = path.join(fullPath, modelFile);

      if (fs.existsSync(modelFilePath)) {
        const baseName = item;
        if (baseName[0] === baseName[0].toLowerCase()) {
          const newModelFileName = toPascalCase(baseName) + '.model.ts';
          fileRenameMap[modelFilePath] = newModelFileName;
        }
      }
    }
  });

  return { folderRenameMap, fileRenameMap };
}

/**
 * Create import replacement mapping
 */
function createImportReplacementMap(folderRenameMap, fileRenameMap) {
  const map = {};

  // Map folder renames to model name changes
  for (const [oldFolder, newFolder] of Object.entries(folderRenameMap)) {
    map[oldFolder] = newFolder;
    map[`Common/${oldFolder}`] = `Common/${newFolder}`;
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

  const { folderRenameMap, fileRenameMap } = getRenameMappings();
  const folderCount = Object.keys(folderRenameMap).length;
  const fileCount = Object.keys(fileRenameMap).length;

  if (folderCount === 0 && fileCount === 0) {
    console.log('✅ All folders and files already follow PascalCase!');
    return;
  }

  // Step 1: Rename folders and files
  console.log(`📋 Step 1: Renaming ${folderCount} model folders and ${fileCount} files...`);

  for (const [oldFolder, newFolder] of Object.entries(folderRenameMap)) {
    const oldPath = path.join(modelsCommonDir, oldFolder);
    const newPath = path.join(modelsCommonDir, newFolder);

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`  ✓ Renamed folder: ${oldFolder} → ${newFolder}`);
    } catch (error) {
      console.error(`  ✗ Error renaming folder ${oldFolder}: ${error.message}`);
    }
  }

  const importMap = createImportReplacementMap(folderRenameMap, fileRenameMap);

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
