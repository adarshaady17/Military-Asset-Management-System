const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const User = require("../models/User");
const env = require("../config/env");
const userDTO = require("../utils/userDTO");
exports.login = async (email, password) => {
  const user = await User.findByEmail(email.trim().toLowerCase());
  if (
    !user ||
    user.isActive === false ||
    user.active === false ||
    !(await bcrypt.compare(password, user.password))
  ) {
    const e = new Error("Invalid email or password");
    e.status = 401;
    throw e;
  }
  if (user.role !== "ADMIN" && !user.base) {
    const e = new Error("Your account must be assigned to a base");
    e.status = 403;
    throw e;
  }
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    const e = new Error("Authentication is not configured with a sufficiently long JWT secret");
    e.status = 503;
    throw e;
  }
  const token = jwt.sign(
    {
      sub: String(user._id),
      userId: String(user._id),
      role: user.role,
      baseId: user.baseId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: "mams-api",
      audience: "mams-client",
      jwtid: randomUUID(),
    },
  );
  return { token, user: userDTO(user) };
};
