require("dotenv").config({ quiet: true });
module.exports = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  pgSsl: process.env.PG_SSL === "true",
  pgSslCa: process.env.PG_SSL_CA?.replace(/\\n/g, "\n"),
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
};
