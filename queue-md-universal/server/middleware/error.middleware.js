const logger = require("../utils/logger");

/**
 * 🔒 SECURITY: Redact sensitive parameters from logs to prevent credentials leak (Item 5)
 */
function redactSensitiveData(data) {
  if (!data) return data;
  const sensitiveKeys = [
    'password', 'token', 'code', 'currentPassword', 'newPassword', 
    'refreshToken', 'accessToken', 'secret', 'razorpay_signature'
  ];
  
  if (typeof data !== 'object') return data;
  
  // Scans and replaces values recursively
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = redactSensitiveData(sanitized[key]);
    }
  }
  return sanitized;
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // 🔒 SECURITY: Return generic server error message in production to prevent stack/structure exposure (Item 5)
  const isProduction = process.env.NODE_ENV === 'production';
  let message = err.message || "Internal Server Error";
  
  if (isProduction && statusCode === 500) {
    message = "Internal Server Error";
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Extract facilityId from request if available
  const facilityId = req.user && req.user.facilityId ? req.user.facilityId : null;

  // 🔒 SECURITY: Sanitize body and headers before logging to disk (Item 5)
  const sanitizedBody = redactSensitiveData(req.body);
  const sanitizedQuery = redactSensitiveData(req.query);

  logger.error(`🔥 ERROR: ${message} | Status: ${statusCode} | Route: ${req.originalUrl} | Method: ${req.method}`, {
    facilityId,
    body: sanitizedBody,
    query: sanitizedQuery,
    stack: isProduction ? undefined : err.stack
  });

  // 🔒 Real-time Incident Monitoring & Response Alert (Slack/Teams Webhook integration) (Item 8)
  if (statusCode === 500 && process.env.INCIDENT_ALERT_WEBHOOK) {
    try {
      const https = require("https");
      const url = new URL(process.env.INCIDENT_ALERT_WEBHOOK);
      const payload = JSON.stringify({
        text: `🚨 *[QueueMD Production Alert]* 🚨\n*Action Required:* 500 Internal Server Exception\n*Route:* \`${req.method} ${req.originalUrl}\`\n*Error Detail:* \`${err.message}\`\n*Facility:* \`${facilityId || 'N/A'}\`\n*Timestamp:* \`${new Date().toISOString()}\`\n*IP Address:* \`${req.ip || 'Unknown'}\``
      });

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      };

      const alertReq = https.request(options);
      alertReq.on("error", (alertErr) => {
        logger.error(`[INCIDENT RESPONSE] Failed to fire webhook alert: ${alertErr.message}`);
      });
      alertReq.write(payload);
      alertReq.end();
    } catch (alertEx) {
      logger.error(`[INCIDENT RESPONSE] Alert serialization failed: ${alertEx.message}`);
    }
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: isProduction ? undefined : err.stack,
  });
};

module.exports = errorHandler;
