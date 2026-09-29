const { query, transaction } = require("../database/postgres");
const audit = require("../middleware/auditMiddleware");
const { balance } = require("./assetService");

const tableByResource = {
  bases: "bases",
  equipment: "equipment",
  purchases: "purchases",
  transfers: "transfers",
  assignments: "assignments",
  expenditures: "expenditures",
  "audit-logs": "audit_logs",
};
const actionByResource = {
  purchases: "PURCHASE",
  transfers: "TRANSFER",
  assignments: "ASSIGN",
  expenditures: "EXPEND",
};

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function id(value) {
  return value === null || value === undefined ? null : String(value);
}

function baseObject(row, prefix) {
  const baseId = row[`${prefix}_id`];
  if (baseId === null || baseId === undefined) return null;
  return {
    id: id(baseId),
    _id: id(baseId),
    name: row[`${prefix}_name`],
    code: row[`${prefix}_code`],
    region: row[`${prefix}_region`],
  };
}

function equipmentObject(row) {
  if (row.equipment_id === null || row.equipment_id === undefined) return null;
  return {
    id: id(row.equipment_id),
    _id: id(row.equipment_id),
    name: row.equipment_name,
    assetTag: row.equipment_asset_tag,
    category: row.equipment_category,
    unit: row.equipment_unit,
    openingBalance: Number(row.equipment_opening_balance || 0),
  };
}

function entityRow(row, name) {
  const common = {
    id: id(row.id),
    _id: id(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (name === "bases") {
    return { ...common, name: row.name, code: row.code, region: row.region, active: row.active };
  }
  if (name === "equipment") {
    return {
      ...common,
      name: row.name,
      assetTag: row.asset_tag,
      category: row.category,
      description: row.description,
      unit: row.unit,
      openingBalance: Number(row.opening_balance),
      active: row.active,
      base: baseObject(row, "base"),
    };
  }
  if (name === "transfers") {
    return {
      ...common,
      fromBase: baseObject(row, "from_base"),
      toBase: baseObject(row, "to_base"),
      equipment: equipmentObject(row),
      quantity: Number(row.quantity),
      transferDate: row.transfer_date,
      referenceNumber: row.reference_number,
      remarks: row.remarks,
      status: row.status,
      createdBy: row.creator_id
        ? { id: id(row.creator_id), name: row.creator_name, email: row.creator_email }
        : null,
    };
  }
  if (name === "audit-logs") {
    return {
      ...common,
      action: row.action,
      module: row.module,
      entityId: row.entity_id,
      oldData: row.old_data,
      newData: row.new_data,
      ipAddress: row.ip_address,
      base: baseObject(row, "base"),
      user: row.user_id ? { id: id(row.user_id), name: row.user_name, role: row.user_role } : null,
    };
  }

  const result = {
    ...common,
    base: baseObject(row, "base"),
    equipment: equipmentObject(row),
    quantity: Number(row.quantity),
    remarks: row.remarks,
    createdBy: row.creator_id
      ? { id: id(row.creator_id), name: row.creator_name, email: row.creator_email }
      : null,
  };
  if (name === "purchases") {
    result.supplier = row.supplier;
    result.reference = row.reference;
    result.purchaseDate = row.purchase_date;
    result.unitPrice = row.unit_price === null ? null : Number(row.unit_price);
    result.totalCost =
      row.unit_price === null ? null : Number(row.unit_price) * Number(row.quantity);
  } else if (name === "assignments") {
    result.personnelName = row.personnel_name;
    result.personnelId = row.personnel_id;
    result.assignedDate = row.assigned_date;
    result.status = row.status;
    result.assignedBy = row.assigned_by
      ? { id: id(row.assigned_by), name: row.assigned_by_name }
      : null;
  } else if (name === "expenditures") {
    result.reason = row.reason;
    result.authorizedBy = row.authorized_by;
    result.expenditureDate = row.expenditure_date;
  }
  return result;
}

function joins(name) {
  if (name === "bases") return "";
  if (name === "equipment") return "LEFT JOIN bases b ON b.id = e.base_id";
  if (name === "transfers") {
    return `LEFT JOIN bases fb ON fb.id = t.from_base_id
      LEFT JOIN bases tb ON tb.id = t.to_base_id
      LEFT JOIN equipment e ON e.id = t.equipment_id
      LEFT JOIN users creator ON creator.id = t.created_by`;
  }
  if (name === "audit-logs") {
    return "LEFT JOIN bases b ON b.id = a.base_id LEFT JOIN users u ON u.id = a.user_id";
  }
  const alias = name === "purchases" ? "p" : name === "assignments" ? "a" : "x";
  const creatorJoin =
    name === "assignments"
      ? `LEFT JOIN users assigned ON assigned.id = ${alias}.assigned_by`
      : `LEFT JOIN users creator ON creator.id = ${alias}.created_by`;
  return `LEFT JOIN bases b ON b.id = ${alias}.base_id
    LEFT JOIN equipment e ON e.id = ${alias}.equipment_id
    ${creatorJoin}`;
}

function selectColumns(name) {
  if (name === "bases") return "b.*";
  if (name === "equipment") {
    return `e.*, b.id AS base_id, b.name AS base_name, b.code AS base_code, b.region AS base_region`;
  }
  if (name === "transfers") {
    return `t.*, fb.id AS from_base_id, fb.name AS from_base_name, fb.code AS from_base_code,
      tb.id AS to_base_id, tb.name AS to_base_name, tb.code AS to_base_code,
      e.id AS equipment_id, e.name AS equipment_name, e.asset_tag AS equipment_asset_tag,
      e.category AS equipment_category, e.unit AS equipment_unit,
      e.opening_balance AS equipment_opening_balance,
      creator.id AS creator_id, creator.name AS creator_name, creator.email AS creator_email`;
  }
  if (name === "audit-logs") {
    return `a.*, b.id AS base_id, b.name AS base_name, b.code AS base_code, b.region AS base_region,
      u.id AS user_id, u.name AS user_name, u.role AS user_role`;
  }
  const table = tableByResource[name];
  const prefix = table === "purchases" ? "p" : table === "assignments" ? "a" : "x";
  const creatorSelect =
    name === "assignments"
      ? "assigned.id AS assigned_by, assigned.name AS assigned_by_name"
      : "creator.id AS creator_id, creator.name AS creator_name, creator.email AS creator_email";
  return `${prefix}.*, b.id AS base_id, b.name AS base_name, b.code AS base_code,
    b.region AS base_region,
    e.id AS equipment_id, e.name AS equipment_name, e.asset_tag AS equipment_asset_tag,
    e.category AS equipment_category, e.unit AS equipment_unit,
    e.opening_balance AS equipment_opening_balance, ${creatorSelect}`;
}

function fromTable(name) {
  if (name === "bases") return "bases b";
  if (name === "equipment") return "equipment e";
  if (name === "transfers") return "transfers t";
  if (name === "audit-logs") return "audit_logs a";
  const aliases = {
    purchases: "purchases p",
    assignments: "assignments a",
    expenditures: "expenditures x",
  };
  return aliases[name];
}

function orderBy(name) {
  const columns = {
    bases: "b.name ASC",
    equipment: "e.name ASC",
    purchases: "p.purchase_date DESC",
    transfers: "t.transfer_date DESC",
    assignments: "a.assigned_date DESC",
    expenditures: "x.expenditure_date DESC",
    "audit-logs": "a.created_at DESC",
  };
  return columns[name];
}

async function fetchRows(name, conditions = [], values = [], client = { query }) {
  const result = await client.query(
    `SELECT ${selectColumns(name)}
     FROM ${fromTable(name)} ${joins(name)}
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY ${orderBy(name)}
     LIMIT 500`,
    values,
  );
  return result.rows.map((row) => entityRow(row, name));
}

function dateValue(value, field) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) fail(`${field} must be a valid date.`);
  return date;
}

function quantityValue(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1)
    fail("Quantity must be a whole number greater than zero.");
  return quantity;
}

function moneyValue(value) {
  const price = Number(value);
  if (
    !Number.isFinite(price) ||
    price < 0 ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
  ) {
    fail("Unit price must be zero or greater with no more than two decimal places.");
  }
  if (price > 9999999999.99) fail("Unit price is too large.");
  return price.toFixed(2);
}

exports.list = async (req, name) => {
  if (!tableByResource[name]) fail("Resource not found.", 404);
  const conditions = [];
  const values = [];
  const add = (clause, value) => {
    values.push(value);
    conditions.push(clause.replace("?", `$${values.length}`));
  };

  if (name === "bases" || name === "equipment")
    add(`${name === "bases" ? "b" : "e"}.active = ?`, true);
  if (name === "equipment" && req.query.category) add("e.category = ?", req.query.category);
  if (name === "bases" && req.query.search) {
    values.push(`%${req.query.search.trim().slice(0, 100)}%`);
    conditions.push(`(b.name ILIKE $${values.length} OR b.code ILIKE $${values.length})`);
  }
  if (name === "equipment" && req.query.search) {
    values.push(`%${req.query.search.trim().slice(0, 100)}%`);
    conditions.push(`(e.name ILIKE $${values.length} OR e.asset_tag ILIKE $${values.length})`);
  }

  const scopedBase = req.user.role === "ADMIN" ? req.query.base : req.user.baseId;
  if (scopedBase && name !== "bases") {
    if (name === "transfers") {
      values.push(scopedBase);
      conditions.push(`(t.from_base_id = $${values.length} OR t.to_base_id = $${values.length})`);
    } else if (name === "equipment") {
      add("e.base_id = ?", scopedBase);
    } else if (name !== "equipment" && name !== "audit-logs") {
      add(
        `${name === "purchases" ? "p" : name === "assignments" ? "a" : "x"}.base_id = ?`,
        scopedBase,
      );
    } else if (name === "audit-logs" && req.user.role !== "ADMIN") {
      add("a.base_id = ?", scopedBase);
    }
  }

  if (name === "audit-logs" && req.query.base && req.user.role === "ADMIN") {
    add("a.base_id = ?", req.query.base);
  }

  return fetchRows(name, conditions, values);
};

exports.getById = async (req, name, recordId, client = { query }) => {
  if (!tableByResource[name]) fail("Resource not found.", 404);
  if (!/^\d+$/.test(String(recordId))) fail("Record not found.", 404);
  const idColumn =
    name === "bases"
      ? "b.id"
      : name === "equipment"
        ? "e.id"
        : name === "transfers"
          ? "t.id"
          : name === "audit-logs"
            ? "a.id"
            : `${name === "purchases" ? "p" : name === "assignments" ? "a" : "x"}.id`;
  const conditions = [`${idColumn} = $1`];
  const values = [recordId];
  if (req.user.role !== "ADMIN" && req.user.baseId) {
    if (name === "transfers") {
      values.push(req.user.baseId);
      conditions.push(`(t.from_base_id = $2 OR t.to_base_id = $2)`);
    } else if (name === "equipment") {
      values.push(req.user.baseId);
      conditions.push("e.base_id = $2");
    } else if (!["bases", "equipment"].includes(name) && name !== "audit-logs") {
      values.push(req.user.baseId);
      conditions.push(
        `${name === "purchases" ? "p" : name === "assignments" ? "a" : "x"}.base_id = $2`,
      );
    }
  }
  const rows = await fetchRows(name, conditions, values, client);
  if (!rows.length) fail("Record not found.", 404);
  return rows[0];
};

exports.create = async (req, name) => {
  if (!tableByResource[name] || name === "audit-logs") fail("Resource not found.", 404);
  const data = { ...req.body };
  delete data._id;

  if (req.user.role === "BASE_COMMANDER" && name !== "bases") data.base = req.user.baseId;
  if (req.user.role === "LOGISTICS_OFFICER" && ["purchases", "transfers"].includes(name)) {
    if (!req.user.baseId) fail("Your account is not assigned to a base.", 403);
    if (name === "purchases") data.base = req.user.baseId;
    else {
      if (data.fromBase && String(data.fromBase) !== String(req.user.baseId)) {
        fail("Transfers must originate from your assigned base.", 403);
      }
      data.fromBase = req.user.baseId;
    }
  }
  if (name === "transfers") {
    if (String(data.fromBase) === String(data.toBase))
      fail("Source and destination bases must differ.");
    if (req.user.role === "BASE_COMMANDER" && String(data.fromBase) !== String(req.user.baseId)) {
      fail("Transfers must originate from your assigned base.", 403);
    }
  }

  if (name === "bases") {
    const result = await query(
      `INSERT INTO bases (name, code, region, active)
       VALUES ($1, UPPER($2), $3, $4) RETURNING *`,
      [
        String(data.name || "").trim(),
        String(data.code || "").trim(),
        data.region || "",
        data.active !== false,
      ],
    );
    const row = entityRow(result.rows[0], name);
    await audit({ req, action: "CREATE", module: name, entity: row, newData: row });
    return row;
  }

  if (name === "equipment") {
    const result = await query(
      `INSERT INTO equipment (name, asset_tag, category, description, unit, opening_balance, base_id, active)
       VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        String(data.name || "").trim(),
        String(data.assetTag || "").trim(),
        String(data.category || "").trim(),
        data.description || null,
        data.unit || "units",
        Number(data.openingBalance || 0),
        data.base,
        data.active !== false,
      ],
    );
    const row = await exports.getById({ user: { role: "ADMIN" } }, name, result.rows[0].id);
    await audit({ req, action: "CREATE", module: name, entity: row, newData: row });
    return row;
  }

  const action = actionByResource[name];
  if (!action) fail("Resource not found.", 404);
  const quantity = quantityValue(data.quantity);
  const unitPrice = name === "purchases" ? moneyValue(data.unitPrice) : null;
  const equipmentId = data.equipment;
  const baseId = name === "transfers" ? data.fromBase : data.base;
  if (!baseId || !equipmentId) fail("Base and equipment are required.");

  return transaction(async (client) => {
    await client.query("SELECT id FROM equipment WHERE id = $1 FOR UPDATE", [equipmentId]);
    if (name !== "purchases") {
      const current = await balance(equipmentId, baseId, client);
      if (quantity > current.available)
        fail(`Insufficient available stock (${current.available}).`);
    }

    let insert;
    if (name === "purchases") {
      insert = await client.query(
        `INSERT INTO purchases (base_id, equipment_id, quantity, unit_price, supplier, reference, purchase_date, remarks, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), $8, $9) RETURNING id`,
        [
          baseId,
          equipmentId,
          quantity,
          unitPrice,
          data.supplier || null,
          data.reference || null,
          dateValue(data.purchaseDate, "Purchase date"),
          data.remarks || null,
          req.user.id,
        ],
      );
    } else if (name === "transfers") {
      const destination = await client.query(
        "SELECT id FROM bases WHERE id = $1 AND active = TRUE",
        [data.toBase],
      );
      if (!destination.rowCount) fail("Destination base was not found or is inactive.");
      insert = await client.query(
        `INSERT INTO transfers (from_base_id, to_base_id, equipment_id, quantity, transfer_date, reference_number, remarks, created_by)
         VALUES ($1, $2, $3, $4, COALESCE($5, NOW()), $6, $7, $8) RETURNING id`,
        [
          baseId,
          data.toBase,
          equipmentId,
          quantity,
          dateValue(data.transferDate, "Transfer date"),
          data.referenceNumber || null,
          data.remarks || null,
          req.user.id,
        ],
      );
    } else if (name === "assignments") {
      insert = await client.query(
        `INSERT INTO assignments (base_id, equipment_id, quantity, personnel_name, personnel_id, assigned_date, remarks, assigned_by)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7, $8) RETURNING id`,
        [
          baseId,
          equipmentId,
          quantity,
          data.personnelName,
          data.personnelId,
          dateValue(data.assignedDate, "Assignment date"),
          data.remarks || null,
          req.user.id,
        ],
      );
    } else {
      insert = await client.query(
        `INSERT INTO expenditures (base_id, equipment_id, quantity, reason, authorized_by, expenditure_date, remarks, created_by)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7, $8) RETURNING id`,
        [
          baseId,
          equipmentId,
          quantity,
          data.reason,
          data.authorizedBy || null,
          dateValue(data.expenditureDate, "Expenditure date"),
          data.remarks || null,
          req.user.id,
        ],
      );
    }

    const created = await exports.getById(
      { user: { role: "ADMIN" } },
      name,
      insert.rows[0].id,
      client,
    );
    await audit({
      req,
      action,
      module: name,
      entity: created,
      newData: created,
      base: baseId,
      client,
    });
    return created;
  });
};

exports.tableByResource = tableByResource;
