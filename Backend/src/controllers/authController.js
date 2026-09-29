const authService = require("../services/authService");
const sessions = require("../services/sessionService");
const audit = require("../middleware/auditMiddleware");
const { ok } = require("../utils/response");
const userDTO = require("../utils/userDTO");
exports.login = async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  req.user = {
    _id: result.user.id,
    id: result.user.id,
    role: result.user.role,
    baseId: result.user.base?.id || null,
    base: result.user.base,
  };
  await audit({ req, action: "LOGIN", module: "auth" });
  ok(res, result, "Login successful");
};
exports.me = (req, res) => ok(res, userDTO(req.user));
exports.logout = async (req, res) => {
  await sessions.revoke(req.authSession?.jti, req.authSession?.expiresAt);
  await audit({ req, action: "LOGOUT", module: "auth" });
  ok(res, null, "Signed out successfully");
};
