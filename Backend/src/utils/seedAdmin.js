const bcrypt = require("bcrypt");
const { query, connectDatabase, closeDatabase } = require("../database/postgres");

async function seedAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in Backend/.env.");
  }

  await connectDatabase();
  const existing = await query("SELECT id, role FROM users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rows[0].role !== "ADMIN") {
    throw new Error("ADMIN_EMAIL already belongs to a non-administrator account.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  if (existing.rowCount) {
    await query(
      `UPDATE users SET name = $1, password_hash = $2, is_active = TRUE, updated_at = NOW()
       WHERE id = $3`,
      [name, passwordHash, existing.rows[0].id],
    );
    console.log(`Administrator credentials updated for ${email}.`);
  } else {
    await query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'ADMIN', TRUE)`,
      [name, email, passwordHash],
    );
    console.log(`Administrator account created for ${email}.`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
