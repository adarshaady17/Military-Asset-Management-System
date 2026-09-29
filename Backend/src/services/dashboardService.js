const { query } = require("../database/postgres");
const { balance, balanceAt } = require("./assetService");
const resourceService = require("./resourceService");

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function isCategory(row, category) {
  return !category || row.equipment?.category === category;
}

async function movement({ baseId, user, from, to, category }) {
  const scopedBase = user.role === "ADMIN" ? baseId : user.baseId;
  const req = {
    user,
    query: { base: scopedBase || undefined, limit: 500 },
  };
  const [purchases, transfers, assignments, expenditures] = await Promise.all([
    resourceService.list(req, "purchases"),
    resourceService.list(req, "transfers"),
    resourceService.list(req, "assignments"),
    resourceService.list(req, "expenditures"),
  ]);
  const start = validDate(from);
  const end = validDate(to);
  const within = (row, field) => {
    const date = new Date(row[field]);
    return (!start || date >= start) && (!end || date <= end) && isCategory(row, category);
  };
  const filteredPurchases = purchases.filter((row) => within(row, "purchaseDate"));
  const filteredTransfers = transfers.filter((row) => within(row, "transferDate"));
  const filteredAssignments = assignments.filter((row) => within(row, "assignedDate"));
  const filteredExpenditures = expenditures.filter((row) => within(row, "expenditureDate"));

  return {
    purchases: filteredPurchases,
    transferIn: filteredTransfers.filter(
      (row) => !scopedBase || String(row.toBase?.id) === String(scopedBase),
    ),
    transferOut: filteredTransfers.filter(
      (row) => !scopedBase || String(row.fromBase?.id) === String(scopedBase),
    ),
    assignments: filteredAssignments,
    expenditures: filteredExpenditures,
  };
}

exports.summary = async ({ base, user, from, to, category }) => {
  const baseId = user.role === "ADMIN" ? base || null : user.baseId;
  const basesResult = await query(
    `SELECT id FROM bases WHERE active = TRUE ${baseId ? "AND id = $1" : ""}`,
    baseId ? [baseId] : [],
  );
  const equipmentResult = await query(
    `SELECT id, base_id, opening_balance, category
     FROM equipment WHERE active = TRUE ${category ? "AND category = $1" : ""}`,
    category ? [category] : [],
  );
  const start = validDate(from) || new Date(Date.now() - 29 * 86400000);
  start.setHours(0, 0, 0, 0);
  const end = validDate(to) || new Date();
  end.setHours(23, 59, 59, 999);
  const openingCutoff = new Date(start.getTime() - 1);

  let openingBalance = 0;
  let closingBalance = 0;
  let assigned = 0;
  for (const item of equipmentResult.rows) {
    for (const activeBase of basesResult.rows) {
      const [opening, closing, current] = await Promise.all([
        balanceAt(item.id, activeBase.id, openingCutoff),
        balanceAt(item.id, activeBase.id, end),
        balance(item.id, activeBase.id),
      ]);
      openingBalance += opening;
      closingBalance += closing;
      assigned += current.assigned;
    }
  }

  const dateFrom = start.toISOString();
  const dateTo = end.toISOString();
  const [movementRows, auditsResult] = await Promise.all([
    movement({ baseId, user, from: dateFrom, to: dateTo, category }),
    query(
      `SELECT a.*, u.name AS user_name, u.role AS user_role,
              b.name AS base_name, b.code AS base_code
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN bases b ON b.id = a.base_id
       ${baseId ? "WHERE a.base_id = $1" : ""}
       ORDER BY a.created_at DESC LIMIT 12`,
      baseId ? [baseId] : [],
    ),
  ]);
  const { purchases, transferIn, transferOut, assignments, expenditures } = movementRows;
  const sumQuantity = (rows) => rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);

  const categories = new Map();
  for (const item of equipmentResult.rows) {
    categories.set(item.category, (categories.get(item.category) || 0) + 1);
  }
  const categoryCount = [...categories.values()].reduce((total, count) => total + count, 0);
  const byCategory = [...categories].map(([name, count]) => ({
    name,
    quantity: count,
    percent: categoryCount ? Math.round((count * 100) / categoryCount) : 0,
  }));

  const trend = new Map();
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dayKey(date);
    trend.set(key, { day: key.slice(5), in: 0, out: 0 });
  }
  for (const row of purchases) {
    const slot = trend.get(dayKey(row.purchaseDate));
    if (slot) slot.in += Number(row.quantity);
  }
  for (const row of transferIn) {
    const slot = trend.get(dayKey(row.transferDate));
    if (slot) slot.in += Number(row.quantity);
  }
  for (const row of transferOut) {
    const slot = trend.get(dayKey(row.transferDate));
    if (slot) slot.out += Number(row.quantity);
  }
  for (const row of assignments) {
    const slot = trend.get(dayKey(row.assignedDate));
    if (slot) slot.out += Number(row.quantity);
  }
  for (const row of expenditures) {
    const slot = trend.get(dayKey(row.expenditureDate));
    if (slot) slot.out += Number(row.quantity);
  }

  return {
    stats: {
      openingBalance,
      purchases: sumQuantity(purchases),
      transferIn: sumQuantity(transferIn),
      transferOut: sumQuantity(transferOut),
      netMovement: sumQuantity(purchases) + sumQuantity(transferIn) - sumQuantity(transferOut),
      closingBalance,
      assigned,
      expended: sumQuantity(expenditures),
      readiness: null,
      periodAssigned: sumQuantity(assignments.filter((row) => row.status === "ACTIVE")),
      periodExpended: sumQuantity(expenditures),
    },
    byCategory,
    chartData: [...trend.values()],
    recentActivity: auditsResult.rows.map((row) => ({
      id: String(row.id),
      _id: String(row.id),
      action: row.action,
      module: row.module,
      entityId: row.entity_id,
      createdAt: row.created_at,
      user: row.user_id
        ? { id: String(row.user_id), name: row.user_name, role: row.user_role }
        : null,
      base: row.base_id
        ? { id: String(row.base_id), name: row.base_name, code: row.base_code }
        : null,
    })),
  };
};

exports.movement = async ({ base, user, from, to, category }) =>
  movement({ baseId: base || null, user, from, to, category });
