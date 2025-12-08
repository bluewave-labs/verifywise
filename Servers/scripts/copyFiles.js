const fs = require("fs/promises");
const path = require("path");

async function copySQLFile() {
  const sourceFile = path.join(__dirname, "..", "SQL_Commands.sql");
  const destFile = path.join(__dirname, "..", "dist", "database", "SQL_Commands.sql");

  await fs.copyFile(sourceFile, destFile);
  console.log("SQL_Commands.sql copied successfully!");
}

async function copyTemplates() {
  const sourceDir = path.join(__dirname, "..", "templates");
  const destDir = path.join(__dirname, "..", "dist", "templates");

  await fs.mkdir(destDir, { recursive: true });

  const files = await fs.readdir(sourceDir);

  for (const file of files) {
    const sourceFile = path.join(sourceDir, file);
    const destFile = path.join(destDir, file);

    await fs.copyFile(sourceFile, destFile);
    console.log(`${file} copied successfully!`);
  }
}

async function copyPluginAssets() {
  const builtinPluginsDir = path.join(__dirname, "..", "plugins", "builtin");
  const destBuiltinPluginsDir = path.join(__dirname, "..", "dist", "plugins", "builtin");

  // Check if builtin plugins directory exists
  try {
    await fs.access(builtinPluginsDir);
  } catch {
    console.log("No builtin plugins directory found, skipping plugin assets copy");
    return;
  }

  const pluginDirs = await fs.readdir(builtinPluginsDir);

  for (const pluginDir of pluginDirs) {
    const sourcePluginDir = path.join(builtinPluginsDir, pluginDir);
    const destPluginDir = path.join(destBuiltinPluginsDir, pluginDir);

    // Check if it's a directory
    const stat = await fs.stat(sourcePluginDir);
    if (!stat.isDirectory()) continue;

    // Create destination directory if it doesn't exist
    await fs.mkdir(destPluginDir, { recursive: true });

    // Copy manifest.json if exists
    const manifestPath = path.join(sourcePluginDir, "manifest.json");
    try {
      await fs.access(manifestPath);
      await fs.copyFile(manifestPath, path.join(destPluginDir, "manifest.json"));
      console.log(`${pluginDir}/manifest.json copied successfully!`);
    } catch {
      // manifest.json doesn't exist, skip
    }

    // Copy icon.svg if exists
    const iconPath = path.join(sourcePluginDir, "icon.svg");
    try {
      await fs.access(iconPath);
      await fs.copyFile(iconPath, path.join(destPluginDir, "icon.svg"));
      console.log(`${pluginDir}/icon.svg copied successfully!`);
    } catch {
      // icon.svg doesn't exist, skip
    }
  }
}

async function copyFile() {
  try {
    await copySQLFile();
    await copyTemplates();
    await copyPluginAssets();
  } catch (error) {
    console.error("Error copying file: ", error);
    process.exit(1);
  }
}

// execute the function
(async () => { await copyFile() })();
