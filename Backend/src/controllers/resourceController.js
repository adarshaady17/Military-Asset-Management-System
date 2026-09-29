const service = require("../services/resourceService");
const { ok } = require("../utils/response");
exports.list = (name) => async (req, res) => ok(res, await service.list(req, name));
exports.get = (name) => async (req, res) =>
  ok(res, await service.getById(req, name, req.params.id));
exports.create = (name) => async (req, res) =>
  ok(res, await service.create(req, name), `${name} record created`, 201);
