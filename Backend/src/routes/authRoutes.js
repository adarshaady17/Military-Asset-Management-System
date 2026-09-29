const router = require("express").Router();
const c = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { validateLogin } = require("../validators/authValidator");

router.post("/login", validateLogin, asyncHandler(c.login));
router.get("/me", auth, asyncHandler(c.me));
router.post("/logout", auth, asyncHandler(c.logout));

module.exports = router;
