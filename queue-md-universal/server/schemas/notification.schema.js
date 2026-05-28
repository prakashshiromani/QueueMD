const { z } = require("zod");

const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(20)
});

module.exports = {
  notificationQuerySchema
};
