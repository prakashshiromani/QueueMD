const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  req.body = parsed.data; // ✅ Validated data attach karo
  next();
};

module.exports = { validate };
