const { query } = require("../database/postgres");

async function getBalance(equipmentId, baseId, through, client) {
  const db = client || { query };
  const equipment = await db.query(
    `SELECT id, base_id, opening_balance
     FROM equipment
     WHERE id = $1 AND active = TRUE`,
    [equipmentId],
  );
  if (!equipment.rowCount) {
    throw Object.assign(new Error("Equipment record was not found"), { status: 404 });
  }

  const params = [equipmentId, baseId];
  const dateFilter = (field) => {
    if (!through) return "";
    params.push(through);
    return ` AND ${field} <= $${params.length}`;
  };
  const purchaseDate = dateFilter("purchase_date");
  const transferInDate = dateFilter("transfer_date");
  const transferOutDate = dateFilter("transfer_date");
  const expenditureDate = dateFilter("expenditure_date");
  const assignmentDate = dateFilter("assigned_date");
  const result = await db.query(
    `SELECT
       (SELECT COALESCE(SUM(quantity), 0)::int FROM purchases
        WHERE equipment_id = $1 AND base_id = $2${purchaseDate}) AS purchases,
       (SELECT COALESCE(SUM(quantity), 0)::int FROM transfers
        WHERE equipment_id = $1 AND to_base_id = $2 AND status = 'COMPLETED'${transferInDate}) AS transfer_in,
       (SELECT COALESCE(SUM(quantity), 0)::int FROM transfers
        WHERE equipment_id = $1 AND from_base_id = $2 AND status = 'COMPLETED'${transferOutDate}) AS transfer_out,
       (SELECT COALESCE(SUM(quantity), 0)::int FROM expenditures
        WHERE equipment_id = $1 AND base_id = $2${expenditureDate}) AS expended,
       (SELECT COALESCE(SUM(quantity), 0)::int FROM assignments
        WHERE equipment_id = $1 AND base_id = $2 AND status = 'ACTIVE'${assignmentDate}) AS assigned`,
    params,
  );
  const sums = result.rows[0];
  const opening =
    String(equipment.rows[0].base_id) === String(baseId)
      ? Number(equipment.rows[0].opening_balance)
      : 0;
  const purchases = Number(sums.purchases);
  const transferIn = Number(sums.transfer_in);
  const transferOut = Number(sums.transfer_out);
  const expended = Number(sums.expended);
  const assigned = Number(sums.assigned);

  return {
    opening,
    purchases,
    transferIn,
    transferOut,
    expended,
    assigned,
    available: opening + purchases + transferIn - transferOut - expended - assigned,
  };
}

exports.balance = (equipmentId, baseId, client) => getBalance(equipmentId, baseId, null, client);

exports.balanceAt = async (equipmentId, baseId, through) => {
  const totals = await getBalance(equipmentId, baseId, through);
  return totals.available + totals.assigned;
};
