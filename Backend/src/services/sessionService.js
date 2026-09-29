const { query } = require("../database/postgres");
exports.revoke = async (jti, expiresAt) => {
  if (jti && expiresAt)
    await query(
      "INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING",
      [jti, expiresAt],
    );
};
exports.isRevoked = async (jti) =>
  (await query("SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()", [jti]))
    .rowCount > 0;
