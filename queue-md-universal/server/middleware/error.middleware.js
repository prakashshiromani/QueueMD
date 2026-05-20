const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Internal Server Error";

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Extract facilityId from request if available (via JWT later)
  const facilityId = req.user && req.user.facilityId ? req.user.facilityId : null;

  // Log exactly using Winston (no console.log)
  logger.error(`${message} - Route: ${req.originalUrl} - Method: ${req.method}`, { facilityId });

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
