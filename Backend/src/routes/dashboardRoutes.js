const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/dashboardController");
const asyncHandler = require("../utils/asyncHandler");
router.use(auth);
router.get("/", asyncHandler(c.summary));
router.get("/movement", asyncHandler(c.movement));
module.exports = router;
