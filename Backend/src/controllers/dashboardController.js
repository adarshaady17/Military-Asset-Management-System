const service = require("../services/dashboardService");
const { ok } = require("../utils/response");
exports.summary = async (req, res) =>
  ok(
    res,
    await service.summary({
      base: req.query.base,
      user: req.user,
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
    }),
  );
exports.movement = async (req, res) =>
  ok(
    res,
    await service.movement({
      base: req.query.base,
      user: req.user,
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
    }),
  );
