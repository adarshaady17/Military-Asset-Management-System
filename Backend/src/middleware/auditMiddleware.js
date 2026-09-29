const { query } = require("../database/postgres");

module.exports = async function audit({
  req,
  action,
  module,
  entity,
  base,
  oldData,
  newData,
  client,
}) {
  const database = client || { query };
  const baseId =
    base ??
    entity?.base_id ??
    entity?.baseId ??
    entity?.from_base_id ??
    (module === "bases" ? entity?.id : null) ??
    entity?.base?.id ??
    entity?.base?._id ??
    req.user?.baseId ??
    req.user?.base?.id ??
    null;
  const userId = req.user?._id || req.user?.id || null;
  const entityId = entity?.id || entity?._id || entity?.entity_id || null;

  await database.query(
    `INSERT INTO audit_logs
      (user_id, action, module, entity_id, base_id, old_data, new_data, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)`,
    [
      userId,
      action,
      module,
      entityId === null ? null : String(entityId),
      baseId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      req.ip || null,
    ],
  );
};
