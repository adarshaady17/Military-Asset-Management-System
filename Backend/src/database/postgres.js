const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { databaseUrl, pgSsl, pgSslCa } = require("../config/env");

let pool;

function getConnectionConfig() {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Set it to a PostgreSQL connection string in Backend/.env."
    );
  }

  let connection;
  try {
    connection = new URL(databaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid URL. For Supabase, use the PostgreSQL connection string from Dashboard → Connect → Session pooler; an API secret key is not a database URL."
    );
  }

  if (!["postgres:", "postgresql:"].includes(connection.protocol)) {
    throw new Error(
      "DATABASE_URL must use the postgres:// or postgresql:// scheme. Supabase API keys (sb_... / eyJ...) are not PostgreSQL connection strings."
    );
  }

  if (!connection.hostname || !connection.pathname || connection.pathname === "/") {
    throw new Error(
      "DATABASE_URL is missing its database host or database name. Copy the complete PostgreSQL connection string from your provider."
    );
  }

  const isSupabase =
    connection.hostname.endsWith(".supabase.co") ||
    connection.hostname.endsWith(".pooler.supabase.com");

  if (isSupabase && process.env.VERCEL === "1") {
    // On Vercel, encrypt and verify the database server certificate. A CA PEM
    // can be supplied through PG_SSL_CA when it is not in the runtime trust store.
    connection.searchParams.delete("sslmode");
    connection.searchParams.delete("uselibpqcompat");
    return {
      connectionString: connection.toString(),
      ssl: { rejectUnauthorized: true, ...(pgSslCa ? { ca: pgSslCa } : {}) },
    };
  }

  // Supabase requires TLS. Locally, use libpq's documented `require` behavior
  // so Node's newer pg-connection-string does not reject a local certificate chain.
  if (isSupabase) {
    connection.searchParams.set("sslmode", "require");
    connection.searchParams.set("uselibpqcompat", "true");
  }

  return {
    connectionString: connection.toString(),
    ssl: pgSsl ? { rejectUnauthorized: true, ...(pgSslCa ? { ca: pgSslCa } : {}) } : undefined,
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      ...getConnectionConfig(),
      max: Number(process.env.PG_POOL_MAX) || (process.env.VERCEL === "1" ? 3 : 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (error) => console.error("PostgreSQL pool error:", error.message));
  }

  return pool;
}

async function query(text, values) {
  return getPool().query(text, values);
}

async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function connectDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await query(schema);
  await query("SELECT 1");
  console.log("PostgreSQL connected; relational schema is ready");
}

async function closeDatabase() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = { query, transaction, connectDatabase, closeDatabase };
