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

async function copyFile() {
  try {
    await copySQLFile();
    await copyTemplates();
  } catch (error) {
    console.error("Error copying file: ", error);
    process.exit(1);
  }
}

// execute the function
(async () => { await copyFile() })();
