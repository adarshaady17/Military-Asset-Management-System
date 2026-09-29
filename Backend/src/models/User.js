const { query } = require("../database/postgres");

const userColumns = `
  u.id,
  u.name,
  u.email,
  u.role,
  u.base_id,
  u.is_active,
  u.created_at,
  u.updated_at,
  b.name AS base_name,
  b.code AS base_code`;

function fromRow(row) {
  if (!row) return null;
  const base = row.base_id
    ? {
        id: String(row.base_id),
        _id: String(row.base_id),
        name: row.base_name,
        code: row.base_code,
      }
    : null;

  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    baseId: row.base_id === null ? null : String(row.base_id),
    base,
    isActive: row.is_active,
    active: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.password_hash ? { password: row.password_hash } : {}),
  };
}

async function findByEmail(email) {
  const result = await query(
    `SELECT ${userColumns}, u.password_hash
     FROM users u LEFT JOIN bases b ON b.id = u.base_id
     WHERE u.email = $1`,
    [email],
  );
  return fromRow(result.rows[0]);
}

async function findById(id) {
  const result = await query(
    `SELECT ${userColumns}
     FROM users u LEFT JOIN bases b ON b.id = u.base_id
     WHERE u.id = $1`,
    [id],
  );
  return fromRow(result.rows[0]);
}

module.exports = { findByEmail, findById, fromRow };
