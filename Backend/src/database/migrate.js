const { connectDatabase, closeDatabase } = require("./postgres");

connectDatabase()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
