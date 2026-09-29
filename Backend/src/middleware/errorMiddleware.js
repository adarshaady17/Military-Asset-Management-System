module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status =
    err.status ||
    (err.name === "ValidationError" || err.name === "CastError"
      ? 400
      : err.code === 11000 || err.code === "23505"
        ? 409
        : ["23503", "23514", "22P02"].includes(err.code)
          ? 400
          : 500);
  const message =
    status >= 500
      ? "An unexpected server error occurred"
      : err.code === 11000 || err.code === "23505"
        ? "A record with this value already exists"
        : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message,
    ...(status === 400 && err.errors
      ? { error: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) }
      : {}),
  });
};
