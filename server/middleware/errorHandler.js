module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  // If error already has structured shape, forward it
  if (err && err.code && err.message) {
    return res.status(status).json({ error: { code: err.code, details: err.message } });
  }
  // If caller passed an object with code/details
  if (err && err.code && err.details) {
    return res.status(status).json({ error: { code: err.code, details: err.details } });
  }
  // Default
  res.status(status).json({ error: { code: 'INTERNAL_ERROR', details: err.message || 'Internal Server Error' } });
};
