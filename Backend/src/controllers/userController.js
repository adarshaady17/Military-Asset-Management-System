const userService = require("../services/userService");
const { ok } = require("../utils/response");

exports.list = async (req, res) => ok(res, await userService.list(req.query));

exports.get = async (req, res) => ok(res, await userService.getById(req.params.id));

exports.create = async (req, res) =>
  ok(res, await userService.create(req, req.body), "User created successfully", 201);

exports.update = async (req, res) =>
  ok(res, await userService.update(req, req.params.id, req.body), "User updated successfully");

exports.updateStatus = async (req, res) =>
  ok(
    res,
    await userService.updateStatus(req, req.params.id, req.body.isActive),
    "User status updated successfully",
  );

exports.remove = async (req, res) =>
  ok(res, await userService.remove(req, req.params.id), "User deleted successfully");
