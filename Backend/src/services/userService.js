const bcrypt = require("bcrypt");
const { query, transaction } = require("../database/postgres");
const User = require("../models/User");
const audit = require("../middleware/auditMiddleware");
const userDTO = require("../utils/userDTO");

const roles = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userColumns = `u.id, u.name, u.email, u.role, u.base_id, u.is_active,
  u.created_at, u.updated_at, b.name AS base_name, b.code AS base_code`;

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function validateProfile(data, { creating = false } = {}) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

  if (!name || name.length > 120) fail("Name is required and must be under 120 characters.");
  if (!emailPattern.test(email) || email.length > 254) fail("Enter a valid email address.");
  if (!roles.includes(data.role)) fail("Choose a supported user role.");
  if (creating && (typeof data.password !== "string" || data.password.length < 10)) {
    fail("Password must be at least 10 characters.");
  }
  if (data.password && data.password.length < 10) {
    fail("Password must be at least 10 characters.");
  }
  if (data.password && data.password.length > 128) fail("Password must be under 128 characters.");
  if (data.role !== "ADMIN" && !data.base) {
    fail("A base is required for Base Commander and Logistics Officer accounts.");
  }

  return {
    name,
    email,
    role: data.role,
    baseId: data.role === "ADMIN" ? null : data.base,
  };
}

async function verifyBase(client, baseId) {
  if (!baseId) return null;
  if (!/^\d+$/.test(String(baseId))) fail("Choose a valid base.");
  const result = await client.query("SELECT id FROM bases WHERE id = $1 AND active = TRUE", [
    baseId,
  ]);
  if (!result.rowCount) fail("The selected base was not found or is inactive.");
  return result.rows[0].id;
}

async function findUser(client, id) {
  if (!/^\d+$/.test(String(id))) fail("User was not found.", 404);
  const result = await client.query(
    `SELECT ${userColumns}
     FROM users u LEFT JOIN bases b ON b.id = u.base_id
     WHERE u.id = $1`,
    [id],
  );
  if (!result.rowCount) fail("User was not found.", 404);
  return User.fromRow(result.rows[0]);
}

function snapshot(user) {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    base: user.baseId,
    isActive: user.isActive,
  };
}

async function ensureAdminCanBeRemoved(client, user, change = {}) {
  const losesAdminAccess =
    user.role === "ADMIN" &&
    ((change.role && change.role !== "ADMIN") || change.isActive === false || change.delete);
  if (!losesAdminAccess) return;

  const result = await client.query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN' AND is_active = TRUE",
  );
  if (result.rows[0].count <= 1) {
    fail("The last active administrator cannot be demoted, deactivated, or deleted.", 409);
  }
}

function handleDatabaseError(error) {
  if (error?.code === "23505") fail("A user with this email address already exists.", 409);
  if (error?.code === "23503") fail("The selected base is not available.", 400);
  throw error;
}

exports.list = async (queryParams = {}) => {
  const clauses = [];
  const values = [];
  const add = (condition, value) => {
    values.push(value);
    clauses.push(condition.replace("?", `$${values.length}`));
  };

  if (roles.includes(queryParams.role)) add("u.role = ?", queryParams.role);
  if (queryParams.status === "active") add("u.is_active = ?", true);
  if (queryParams.status === "inactive") add("u.is_active = ?", false);
  if (queryParams.base && /^\d+$/.test(String(queryParams.base))) {
    add("u.base_id = ?", queryParams.base);
  }
  if (queryParams.search) {
    values.push(`%${queryParams.search.trim().slice(0, 100)}%`);
    const parameter = `$${values.length}`;
    clauses.push(`(u.name ILIKE ${parameter} OR u.email ILIKE ${parameter})`);
  }

  const result = await query(
    `SELECT ${userColumns}
     FROM users u LEFT JOIN bases b ON b.id = u.base_id
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY u.created_at DESC
     LIMIT 500`,
    values,
  );
  return result.rows.map((row) => userDTO(User.fromRow(row)));
};

exports.getById = async (id) => userDTO(await findUser({ query }, id));

exports.create = async (req, data) => {
  const profile = validateProfile(data, { creating: true });
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    return await transaction(async (client) => {
      profile.baseId = await verifyBase(client, profile.baseId);
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, base_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          profile.name,
          profile.email,
          passwordHash,
          profile.role,
          profile.baseId,
          data.isActive !== false,
        ],
      );
      const user = await findUser(client, result.rows[0].id);
      await audit({
        req,
        action: "CREATE",
        module: "users",
        entity: user,
        newData: snapshot(user),
        client,
      });
      return userDTO(user);
    });
  } catch (error) {
    handleDatabaseError(error);
  }
};

exports.update = async (req, id, data) => {
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;

  try {
    return await transaction(async (client) => {
      const user = await findUser(client, id);
      if (String(user.id) === String(req.user.id) && data.role && data.role !== user.role) {
        fail("You cannot change your own administrator role.", 403);
      }

      const before = snapshot(user);
      const profile = validateProfile({
        name: data.name ?? user.name,
        email: data.email ?? user.email,
        role: data.role ?? user.role,
        base: Object.hasOwn(data, "base") ? data.base : user.baseId,
        password: data.password,
      });
      await ensureAdminCanBeRemoved(client, user, { role: profile.role });
      profile.baseId = await verifyBase(client, profile.baseId);

      const result = await client.query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, base_id = $4,
             password_hash = COALESCE($5, password_hash), updated_at = NOW()
         WHERE id = $6
         RETURNING id`,
        [profile.name, profile.email, profile.role, profile.baseId, passwordHash, id],
      );
      const updated = await findUser(client, result.rows[0].id);
      await audit({
        req,
        action: "UPDATE",
        module: "users",
        entity: updated,
        oldData: before,
        newData: snapshot(updated),
        client,
      });
      return userDTO(updated);
    });
  } catch (error) {
    handleDatabaseError(error);
  }
};

exports.updateStatus = async (req, id, isActive) => {
  if (typeof isActive !== "boolean") fail("isActive must be true or false.");

  return transaction(async (client) => {
    const user = await findUser(client, id);
    if (String(user.id) === String(req.user.id) && !isActive) {
      fail("You cannot deactivate your own account.", 403);
    }

    await ensureAdminCanBeRemoved(client, user, { isActive });
    const before = snapshot(user);
    await client.query("UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2", [
      isActive,
      id,
    ]);
    const updated = await findUser(client, id);
    await audit({
      req,
      action: isActive ? "ACTIVATE" : "DEACTIVATE",
      module: "users",
      entity: updated,
      oldData: before,
      newData: snapshot(updated),
      client,
    });
    return userDTO(updated);
  });
};

exports.remove = async (req, id) =>
  transaction(async (client) => {
    const user = await findUser(client, id);
    if (String(user.id) === String(req.user.id)) fail("You cannot delete your own account.", 403);
    await ensureAdminCanBeRemoved(client, user, { delete: true });
    await audit({
      req,
      action: "DELETE",
      module: "users",
      entity: user,
      oldData: snapshot(user),
      client,
    });
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    return { id: String(user.id) };
  });
