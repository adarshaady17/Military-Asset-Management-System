const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/userController");

router.use(auth, roles("ADMIN"));

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.get));
router.post("/", asyncHandler(controller.create));
router.patch("/:id/status", asyncHandler(controller.updateStatus));
router.patch("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
