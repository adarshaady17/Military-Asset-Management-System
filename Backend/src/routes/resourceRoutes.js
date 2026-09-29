const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const c = require("../controllers/resourceController");
const asyncHandler = require("../utils/asyncHandler");
const read = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"];
const write = ["ADMIN", "BASE_COMMANDER"];
const resources = [
  "bases",
  "equipment",
  "purchases",
  "transfers",
  "assignments",
  "expenditures",
  "audit-logs",
];
for (const name of resources) {
  const route = expressResource(name);
  router.use(`/${name}`, route);
}
function expressResource(name) {
  const r = require("express").Router();
  r.use(auth);
  let allowed = read;
  if (name === "audit-logs") allowed = ["ADMIN"];
  if (name === "assignments" || name === "expenditures") allowed = ["ADMIN", "BASE_COMMANDER"];
  r.get("/", roles(...allowed), asyncHandler(c.list(name)));
  r.get("/:id", roles(...allowed), asyncHandler(c.get(name)));
  if (name !== "audit-logs")
    r.post(
      "/",
      roles(
        ...(name === "purchases" || name === "transfers"
          ? ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]
          : name === "bases"
            ? ["ADMIN"]
            : write),
      ),
      asyncHandler(c.create(name)),
    );
  return r;
}
module.exports = router;
