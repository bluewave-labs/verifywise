const fs = require("fs/promises");
const path = require("path");

async function copyFile() {
  try {
    // source and destination paths
    const sourceFile = path.join(__dirname, "..", "..", "SQL_Commands.sql");
    const destFile = path.join(__dirname, "..", "dist", "database", "SQL_Commands.sql");

    // copy the file
    await fs.copyFile(sourceFile, destFile);
    console.log("SQL_Commands.sql copied successfully!");
  } catch (error) {
    console.error("Error copying file: ", error);
    process.exit(1);
  }
}

// execute the function
(async () => { await copyFile() })();
