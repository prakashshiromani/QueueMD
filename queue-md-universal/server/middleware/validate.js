const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Zod Validation Failed for body:", JSON.stringify(req.body, null, 2));
    console.error("Issues:", JSON.stringify(parsed.error.issues, null, 2));
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  req.body = parsed.data; // ✅ Validated data attach karo
  next();
};

module.exports = { validate };
