const { z } = require("zod");
const logger = require("../utils/logger");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional().transform((val) => val ? parseInt(val, 10) : 5000),
  MONGO_URI: z.string({
    required_error: "MONGO_URI is required"
  }).min(1),
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET is required"
  }).min(16, "JWT_SECRET must be at least 16 characters long")
    .refine((val) => val !== "fallback_salt_value_123", {
      message: "Security Vulnerability: JWT_SECRET cannot be the default fallback value"
    }),
  REDIS_URL: z.string({
    required_error: "REDIS_URL is required"
  }).min(1),
  CLIENT_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().default("default_sec_key_32_bytes_long_123"),
});

let validatedEnv;
try {
  validatedEnv = envSchema.parse(process.env);
  
  // Production security checks
  if (validatedEnv.NODE_ENV === "production") {
    if (validatedEnv.ENCRYPTION_KEY === "default_sec_key_32_bytes_long_123") {
      throw new Error("Security Vulnerability: ENCRYPTION_KEY must be configured and cannot be the default fallback value in production mode!");
    }
  }
} catch (error) {
  logger.error("❌ Invalid environment variables during boot! Server shutting down...");
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      logger.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    logger.error(`  - Error: ${error.message}`);
  }
  process.exit(1);
}

module.exports = validatedEnv;
