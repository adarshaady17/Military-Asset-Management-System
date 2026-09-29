const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const sessions = require("../services/sessionService");
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!jwtSecret || jwtSecret.length < 32)
    return res.status(503).json({ success: false, message: "Authentication is not configured" });
  let payload;
  try {
    payload = jwt.verify(match[1], jwtSecret, {
      issuer: "mams-api",
      audience: "mams-client",
    });
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
  const userId = payload.userId || payload.sub;
  if (!userId || !payload.jti)
    return res.status(401).json({ success: false, message: "Invalid authentication token" });
  if (await sessions.isRevoked(payload.jti))
    return res.status(401).json({ success: false, message: "Session has been signed out" });
  const user = await User.findById(userId);
  if (!user || user.isActive === false || user.active === false)
    return res.status(401).json({ success: false, message: "Account unavailable" });
  req.user = user;
  req.authSession = {
    jti: payload.jti,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
  };
  next();
});
