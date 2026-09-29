const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.validateLogin = (req, res, next) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password are required" });
  if (!emailPattern.test(email) || email.length > 254)
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  if (password.length > 128)
    return res.status(400).json({ success: false, message: "Password is too long" });
  req.body.email = email;
  req.body.password = password;
  next();
};
