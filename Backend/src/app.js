const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const app = express();
const allowedOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/", (req, res) =>
  res.json({
    success: true,
    data: {
      service: "MAMS Asset API",
      status: "ok",
      health: "/api/health",
    },
  }),
);
app.get("/api/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api", resourceRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: "API route not found" }));
app.use(errorMiddleware);

// Vercel imports this Express app directly. Running this file locally also
// initializes the database and starts the development HTTP listener.
if (require.main === module) {
  const { connectDatabase } = require("./database/postgres");
  const { port } = env;

  connectDatabase()
    .then(() => app.listen(port, () => console.log(`Asset API listening on port ${port}`)))
    .catch((error) => {
      console.error(`Startup failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = app;
