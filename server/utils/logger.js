const winston = require("winston");

const customFormat = winston.format.printf(({ level, message, timestamp, facilityId }) => {
  const facilityStr = facilityId ? ` [Facility: ${facilityId}]` : "";
  return `[${timestamp}] [${level.toUpperCase()}]${facilityStr}: ${message}`;
});

const transports = [];

  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat
      )
    })
  );

  // Also log to files in development for remote debugging
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  );

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat // Default to custom format even for files, or fallback
  ),
  transports
});

module.exports = logger;
